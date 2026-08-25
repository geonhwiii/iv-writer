import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap, search, openSearchPanel } from '@codemirror/search';
import { FocusEngine } from './focusEngine';
import { ScrollEngine } from './scrollEngine';
import { IVWriterSettings } from '../../shared/settings';

import { DocumentStats } from '../../shared/messages';

export interface EditorCallbacks {
  onDocChange: (newContent: string) => void;
  onCursorChange: (line: number, col: number, selectionLen: number) => void;
  onStatsChange: (stats: DocumentStats) => void;
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

          if (!settings.enabled || text.length === 0) {
            return Decoration.none;
          }

          let activeRange: { from: number; to: number };
          if (hasSelection) {
            activeRange = { from: Math.min(mainSelection.from, mainSelection.to), to: Math.max(mainSelection.from, mainSelection.to) };
          } else {
            const ranges =
              settings.mode === 'sentence'
                ? FocusEngine.extractSentenceRanges(text)
                : settings.mode === 'paragraph'
                ? FocusEngine.extractParagraphRanges(text)
                : FocusEngine.extractLineRanges(text);

            activeRange = FocusEngine.findActiveRange(ranges, cursorPos);
          }

          const dimmedRanges = FocusEngine.calculateDimmedRanges(text.length, activeRange);
          const builder: { from: number; to: number; deco: Decoration }[] = [];

          const dimDeco = Decoration.mark({
            class: 'iv-dimmed',
          });

          for (const d of dimmedRanges) {
            if (d.from < d.to) {
              builder.push({
                from: d.from,
                to: d.to,
                deco: dimDeco,
              });
            }
          }

          builder.sort((a, b) => a.from - b.from);
          return Decoration.set(
            builder.map((item) => item.deco.range(item.from, item.to))
          );
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    );
  }

  private handleEditorUpdate(update: ViewUpdate): void {
    if (update.docChanged) {
      this.scrollEngine.resetUserScroll();
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
    
    // Sentences
    const sentences = FocusEngine.extractSentenceRanges(text).filter((r) => {
      const s = text.slice(r.from, r.to).trim();
      return s.length > 0;
    }).length;

    // Paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0).length;

    // Reading speed: approx 200 words / min (or 500 chars / min for CJK)
    const totalSeconds = Math.max(1, Math.round((charsNoSpaces / 500) * 60));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const readingTimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const readingTimeMin = Math.max(1, Math.ceil(totalSeconds / 60));

    this.callbacks.onStatsChange({
      words,
      chars,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTimeMin,
      readingTimeFormatted,
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
      this.currentSettings.focus.mode = 'sentence';
    } else if (this.currentSettings.focus.mode === 'sentence') {
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
