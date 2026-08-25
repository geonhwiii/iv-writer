import { EditorState, Extension, StateEffect } from '@codemirror/state';
import { drawSelection, EditorView, keymap, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap, search, openSearchPanel } from '@codemirror/search';
import { FocusEngine } from './focusEngine';
import { ScrollEngine } from './scrollEngine';
import { IVWriterSettings } from '../../shared/settings';

import { DocumentStats } from '../../shared/messages';

export const updateFocusEffect = StateEffect.define<null>();

export interface EditorCallbacks {
  onDocChange: (newContent: string) => void;
  onCursorChange: (line: number, col: number, selectionLen: number) => void;
  onFormatChange?: (format: string) => void;
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

    const cursorTheme = EditorView.theme({
      '.cm-cursor, .cm-cursorLayer .cm-cursor': {
        borderLeft: '2.5px solid var(--iv-cursor-color, rgb(89, 193, 250)) !important',
        borderLeftWidth: '2.5px !important',
        borderRadius: '2px !important',
        marginLeft: '-1px',
      },
      '.cm-content': {
        caretColor: 'var(--iv-cursor-color, rgb(89, 193, 250)) !important',
      },
    });

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        history(),
        drawSelection(),
        cursorTheme,
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
            update.viewportChanged ||
            update.transactions.some((tr) => tr.effects.some((e) => e.is(updateFocusEffect)))
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

          const builder: { from: number; to: number; deco: Decoration }[] = [];

          // 1. iA Writer Signature Outdented Heading Markers (#, ##, ###, ####)
          const headingDeco = Decoration.mark({
            class: 'iv-heading-mark',
          });

          for (let i = 1; i <= doc.lines; i++) {
            const line = doc.line(i);
            const match = line.text.match(/^(#{1,6}\s+)/);
            if (match) {
              const markLen = match[1].length;
              builder.push({
                from: line.from,
                to: line.from + markLen,
                deco: headingDeco,
              });
            }
          }

          // 2. Focus Dimming
          if (settings.enabled && text.length > 0) {
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

      // Fast debounce auto-save (80ms)
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }
      this.saveDebounceTimer = setTimeout(() => {
        this.saveDebounceTimer = null;
        this.callbacks.onDocChange(newText);
      }, 80);
    }

    if (update.selectionSet || update.docChanged) {
      const main = update.state.selection.main;
      const line = update.state.doc.lineAt(main.head);
      const col = main.head - line.from;
      const selLen = Math.abs(main.to - main.from);

      this.callbacks.onCursorChange(line.number, col, selLen);

      // Detect current line format
      const lineText = line.text;
      let blockFmt = 'p';
      if (/^#{1,6}\s+/.test(lineText)) {
        const match = lineText.match(/^(#{1,6})\s+/);
        if (match) {
          blockFmt = `h${match[1].length}`;
        }
      } else if (/^-\s+\[[ xX]\]\s+/.test(lineText)) {
        blockFmt = 'task';
      } else if (/^\d+\.\s+\[[ xX]\]\s+/.test(lineText)) {
        blockFmt = 'numtask';
      } else if (/^[-*+]\s+/.test(lineText)) {
        blockFmt = 'list';
      } else if (/^\d+\.\s+/.test(lineText)) {
        blockFmt = 'numlist';
      }

      this.callbacks.onFormatChange?.(blockFmt);

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
    if (this.isComposing) {
      return;
    }
    const currentDoc = this.view.state.doc.toString();
    if (currentDoc !== content) {
      this.view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      });
      this.computeDocumentStats(content);
    }
  }

  public flushSave(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    const currentText = this.view.state.doc.toString();
    this.callbacks.onDocChange(currentText);
  }

  public updateSettings(newSettings: IVWriterSettings): void {
    this.currentSettings = newSettings;
    const isLocked = newSettings.focus.anchor > 0.1;
    document.body.setAttribute('data-center-lock', isLocked ? 'true' : 'false');
    this.scrollEngine.setAnchor(newSettings.focus.anchor);
    this.scrollEngine.setEnabled(newSettings.focus.enabled);

    // Force re-render decorations immediately
    this.view.dispatch({
      effects: [updateFocusEffect.of(null)],
    });
  }

  public toggleFocusMode(): void {
    this.currentSettings.focus.enabled = !this.currentSettings.focus.enabled;
    this.updateSettings(this.currentSettings);
  }

  public toggleCenterLock(): void {
    const isLocked = this.currentSettings.focus.anchor > 0.1;
    this.currentSettings.focus.anchor = isLocked ? 0.0 : 0.50;
    this.updateSettings(this.currentSettings);
    if (!isLocked) {
      this.scrollEngine.scrollToCursor(true);
    }
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

  public openSearch(): void {
    openSearchPanel(this.view);
  }

  public getContent(): string {
    return this.view.state.doc.toString();
  }

  public insertFormat(formatType: string): void {
    const selection = this.view.state.selection.main;
    const selectedText = this.view.state.sliceDoc(selection.from, selection.to);

    switch (formatType) {
      case 'bold': {
        const text = selectedText || '볼드체';
        this.view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: `**${text}**` },
          selection: { anchor: selection.from + 2, head: selection.from + 2 + text.length },
        });
        break;
      }
      case 'italic': {
        const text = selectedText || '이탈릭체';
        this.view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: `*${text}*` },
          selection: { anchor: selection.from + 1, head: selection.from + 1 + text.length },
        });
        break;
      }
      case 'strike': {
        const text = selectedText || '취소선';
        this.view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: `~~${text}~~` },
          selection: { anchor: selection.from + 2, head: selection.from + 2 + text.length },
        });
        break;
      }
      case 'h1': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `# ${cleaned}` },
        });
        break;
      }
      case 'h2': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `## ${cleaned}` },
        });
        break;
      }
      case 'h3': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `### ${cleaned}` },
        });
        break;
      }
      case 'h4': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `#### ${cleaned}` },
        });
        break;
      }
      case 'h5': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `##### ${cleaned}` },
        });
        break;
      }
      case 'h6': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `###### ${cleaned}` },
        });
        break;
      }
      case 'list': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `- ${cleaned}` },
        });
        break;
      }
      case 'numlist': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `1. ${cleaned}` },
        });
        break;
      }
      case 'task': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `- [ ] ${cleaned}` },
        });
        break;
      }
      case 'numtask': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `1. [ ] ${cleaned}` },
        });
        break;
      }
      case 'quote': {
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: `> ${cleaned}` },
        });
        break;
      }
      case 'code': {
        const text = selectedText || '코드 내용 입력';
        this.view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: `\`\`\`\n${text}\n\`\`\`` },
        });
        break;
      }
      case 'p': {
        // Plain text: remove all markdown prefixes
        const line = this.view.state.doc.lineAt(selection.head);
        const cleaned = line.text.replace(/^([#>\-\*\+\d\.]+(\s+\[[ xX]\])?\s+)/, '');
        this.view.dispatch({
          changes: { from: line.from, to: line.to, insert: cleaned },
        });
        break;
      }
    }
    this.view.focus();
  }

  public focus(): void {
    this.view.focus();
  }

  public destroy(): void {
    this.scrollEngine.destroy();
    this.view.destroy();
  }
}
