import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap, search, openSearchPanel } from '@codemirror/search';
import { FocusEngine, BlockRange } from './focusEngine';
import { ScrollEngine } from './scrollEngine';
import { IVWriterSettings } from '../../shared/settings';

export interface EditorCallbacks {
  onDocChange: (newContent: string) => void;
  onCursorChange: (line: number, col: number, selectionLen: number) => void;
  onStatsChange: (stats: { words: number; chars: number; charsNoSpaces: number; paragraphs: number; readingTimeMin: number }) => void;
  onOpenLink?: (link: string) => void;
}

export class IVEditor {
  private view: EditorView;
  private scrollEngine: ScrollEngine;
  private isComposing: boolean = false;
  private currentSettings: IVWriterSettings;
  private saveDebounceTimer: any = null;

  constructor(
    private readonly container: HTMLElement,
    initialDoc: string,
    initialSettings: IVWriterSettings,
    private readonly callbacks: EditorCallbacks
  ) {
    this.currentSettings = initialSettings;

    // ViewPlugin for Focus Fading Decorations
    const focusPlugin = this.createFocusPlugin();

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        search({ top: true }),
        markdown(),
        EditorView.lineWrapping,
        focusPlugin,
        EditorView.updateListener.of((update) => this.handleEditorUpdate(update)),
        EditorView.domEventHandlers({
          compositionstart: () => {
            this.isComposing = true;
            return false;
          },
          compositionend: () => {
            this.isComposing = false;
            this.scrollEngine.scrollToCursor();
            return false;
          },
          click: (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target && (event.metaKey || event.ctrlKey)) {
              const text = target.textContent || '';
              // Check if code file reference like `src/...` or file://
              const match = text.match(/(?:file:\/\/\/?)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/);
              if (match && this.callbacks.onOpenLink) {
                this.callbacks.onOpenLink(match[1]);
              }
            }
            return false;
          }
        }),
      ],
    });

    this.view = new EditorView({
      state,
      parent: container,
    });

    this.scrollEngine = new ScrollEngine(
      this.view,
      this.currentSettings.focus.anchor,
      this.currentSettings.focus.enabled
    );

    // Initial calculations
    this.computeDocumentStats(initialDoc);
    setTimeout(() => {
      this.scrollEngine.scrollToCursor(true);
    }, 100);
  }

  private createFocusPlugin(): Extension {
    const editorInstance = this;

    return ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
          if (
            update.docChanged ||
            update.selectionSet ||
            update.viewportChanged
          ) {
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView): DecorationSet {
          const settings = editorInstance.currentSettings.focus;
          const doc = view.state.doc;
          const text = doc.toString();
          const mainSelection = view.state.selection.main;
          const cursorPos = mainSelection.head;
          const hasSelection = mainSelection.from !== mainSelection.to;

          if (!settings.enabled) {
            return Decoration.none;
          }

          const blocks =
            settings.mode === 'paragraph'
              ? FocusEngine.extractParagraphBlocks(text)
              : FocusEngine.extractLineBlocks(text);

          const activeIndex = FocusEngine.findActiveBlockIndex(blocks, cursorPos);
          const visualStates = FocusEngine.calculateBlockVisualStates(
            blocks,
            activeIndex,
            settings
          );

          const builder: { from: number; deco: Decoration }[] = [];

          // Viewport 내 라인들에 데코레이션 적용
          for (const { from, to } of view.visibleRanges) {
            let pos = from;
            while (pos <= to) {
              const line = doc.lineAt(pos);
              
              // 해당 line이 선택 영역과 겹치는지 확인
              const isSelected =
                hasSelection &&
                line.from <= mainSelection.to &&
                line.to >= mainSelection.from;

              // 해당 line이 속한 블록의 visual state 찾기
              const state = visualStates.find(
                (vs) => line.from >= vs.from && line.from <= vs.to
              );

              if (state) {
                const isFocused = isSelected || state.isFocused;
                const opacity = isSelected ? 1.0 : state.opacity;
                
                const lineClass = isFocused ? 'iv-line-focused' : 'iv-line-faded';
                const deco = Decoration.line({
                  attributes: {
                    class: lineClass,
                    style: `opacity: ${opacity}; transition: opacity ${settings.transitionDuration || 200}ms ease-out;`,
                  },
                });

                builder.push({ from: line.from, deco });
              }

              pos = line.to + 1;
            }
          }

          builder.sort((a, b) => a.from - b.from);
          const decoSet = Decoration.set(
            builder.map((item) => item.deco.range(item.from))
          );
          return decoSet;
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    );
  }

  private handleEditorUpdate(update: ViewUpdate): void {
    if (update.docChanged) {
      const newText = update.state.doc.toString();
      this.computeDocumentStats(newText);

      // Debounce auto-save
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }
      this.saveDebounceTimer = setTimeout(() => {
        this.callbacks.onDocChange(newText);
      }, this.currentSettings.editor.autoSaveDebounce);
    }

    if (update.selectionSet || update.docChanged) {
      const main = update.state.selection.main;
      const line = update.state.doc.lineAt(main.head);
      const col = main.head - line.from;
      const selLen = Math.abs(main.to - main.from);

      this.callbacks.onCursorChange(line.number, col, selLen);

      if (!this.isComposing) {
        this.scrollEngine.scrollToCursor();
      }
    }
  }

  private computeDocumentStats(text: string): void {
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    
    // Korean/English mixed words calculation
    const trimmed = text.trim();
    const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
    
    // Paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0).length;

    // Reading speed: approx 200 words / min (or 500 chars / min for CJK)
    const readingTimeMin = Math.max(1, Math.ceil(charsNoSpaces / 500));

    this.callbacks.onStatsChange({
      words,
      chars,
      charsNoSpaces,
      paragraphs,
      readingTimeMin,
    });
  }

  public setContent(content: string): void {
    const currentDoc = this.view.state.doc.toString();
    if (currentDoc !== content) {
      this.view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      });
      this.computeDocumentStats(content);
    }
  }

  public updateSettings(newSettings: IVWriterSettings): void {
    this.currentSettings = newSettings;
    this.scrollEngine.setAnchor(newSettings.focus.anchor);
    this.scrollEngine.setEnabled(newSettings.focus.enabled);

    // Force re-render decorations
    this.view.dispatch({
      effects: [],
    });
  }

  public toggleFocusMode(): void {
    this.currentSettings.focus.enabled = !this.currentSettings.focus.enabled;
    this.updateSettings(this.currentSettings);
  }

  public cycleFocusMode(): void {
    if (!this.currentSettings.focus.enabled) {
      this.currentSettings.focus.enabled = true;
      this.currentSettings.focus.mode = 'paragraph';
    } else if (this.currentSettings.focus.mode === 'paragraph') {
      this.currentSettings.focus.mode = 'line';
    } else {
      this.currentSettings.focus.enabled = false;
    }
    this.updateSettings(this.currentSettings);
  }

  public focus(): void {
    this.view.focus();
  }

  public destroy(): void {
    this.scrollEngine.destroy();
    this.view.destroy();
  }
}
