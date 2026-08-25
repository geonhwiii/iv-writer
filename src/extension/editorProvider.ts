import * as vscode from 'vscode';
import { HostToWebviewMessage, WebviewToHostMessage } from '../shared/messages';
import { IVWriterSettings } from '../shared/settings';
import { StatusBarManager } from './statusBar';

export class IVWriterEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'ivWriter.editor';
  public static activePanel: vscode.WebviewPanel | null = null;

  public static getActivePanel(): vscode.WebviewPanel | null {
    return IVWriterEditorProvider.activePanel;
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new IVWriterEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      IVWriterEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
    return providerRegistration;
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    IVWriterEditorProvider.activePanel = webviewPanel;

    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        IVWriterEditorProvider.activePanel = e.webviewPanel;
      }
    });

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
        vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
      ],
    };

    const fileName = document.uri.path.split('/').pop() || '제목 없음';
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, fileName);

    let isUpdatingFromWebview = false;
    let isUpdatingFromHost = false;

    const syncSettings = () => {
      const config = vscode.workspace.getConfiguration('ivWriter');
      const settings: Partial<IVWriterSettings> = {
        focus: {
          enabled: config.get<boolean>('focus.enabled', true),
          mode: config.get<'sentence' | 'paragraph' | 'line'>('focus.mode', 'sentence'),
          anchor: config.get<number>('focus.anchor', 0.50),
          fadeDistance: config.get<number>('focus.fadeDistance', 6),
          minimumOpacity: config.get<number>('focus.minimumOpacity', 1.0),
          fadePower: config.get<number>('focus.fadePower', 2.0),
        },
        typography: {
          fontFamily: config.get<string>(
            'typography.fontFamily',
            '"iA Writer Duo", "iA Writer Mono", "SF Mono", Menlo, Monaco, "Pretendard", monospace'
          ),
          fontSize: config.get<number>('typography.fontSize', 19),
          lineHeight: config.get<number>('typography.lineHeight', 1.8),
          maxWidth: config.get<number>('typography.maxWidth', 680),
        },
        theme: {
          preset: config.get<'paper' | 'dark' | 'sepia' | 'midnight'>('theme.preset', 'paper'),
        },
        cursor: {
          style: config.get<'bar' | 'block' | 'underline'>('cursor.style', 'bar'),
          width: config.get<number>('cursor.width', 2),
          animation: config.get<'fade' | 'pulse' | 'blink' | 'solid'>('cursor.animation', 'fade'),
        },
        focusLine: {
          enabled: config.get<boolean>('focusLine.enabled', false),
          style: config.get<'background' | 'left-border' | 'underline' | 'none'>('focusLine.style', 'none'),
        },
        editor: {
          autoSaveDebounce: config.get<number>('editor.autoSaveDebounce', 500),
          hideHeaderHUD: config.get<boolean>('editor.hideHeaderHUD', false),
        },
      };

      const msg: HostToWebviewMessage = {
        type: 'CONFIG_CHANGED',
        payload: {
          settings: settings as IVWriterSettings,
        },
      };
      webviewPanel.webview.postMessage(msg);
    };

    const changeConfigSub = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ivWriter')) {
        syncSettings();
      }
    });

    const changeDocSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        if (isUpdatingFromWebview) {
          return;
        }
        isUpdatingFromHost = true;
        const msg: HostToWebviewMessage = {
          type: 'DOC_CHANGED',
          payload: {
            content: document.getText(),
            version: document.version,
          },
        };
        webviewPanel.webview.postMessage(msg);
        isUpdatingFromHost = false;
      }
    });

    webviewPanel.webview.onDidReceiveMessage(async (message: WebviewToHostMessage) => {
      switch (message.type) {
        case 'READY': {
          const config = vscode.workspace.getConfiguration('ivWriter');
          const currentSettings = {
            focus: {
              enabled: config.get<boolean>('focus.enabled', true),
              mode: config.get<'sentence' | 'paragraph' | 'line'>('focus.mode', 'sentence'),
              anchor: config.get<number>('focus.anchor', 0.50),
              fadeDistance: config.get<number>('focus.fadeDistance', 6),
              minimumOpacity: config.get<number>('focus.minimumOpacity', 1.0),
              fadePower: config.get<number>('focus.fadePower', 2.0),
            },
            typography: {
              fontFamily: config.get<string>(
                'typography.fontFamily',
                '"iA Writer Duo", "iA Writer Mono", "SF Mono", Menlo, Monaco, "Pretendard", monospace'
              ),
              fontSize: config.get<number>('typography.fontSize', 19),
              lineHeight: config.get<number>('typography.lineHeight', 1.8),
              maxWidth: config.get<number>('typography.maxWidth', 680),
            },
            theme: {
              preset: config.get<'paper' | 'dark' | 'sepia' | 'midnight'>('theme.preset', 'paper'),
            },
            cursor: {
              style: config.get<'bar' | 'block' | 'underline'>('cursor.style', 'bar'),
              width: config.get<number>('cursor.width', 2),
              animation: config.get<'fade' | 'pulse' | 'blink' | 'solid'>('cursor.animation', 'fade'),
            },
            focusLine: {
              enabled: config.get<boolean>('focusLine.enabled', false),
              style: config.get<'background' | 'left-border' | 'underline' | 'none'>('focusLine.style', 'none'),
            },
            editor: {
              autoSaveDebounce: config.get<number>('editor.autoSaveDebounce', 500),
            },
          };

          const initMsg: HostToWebviewMessage = {
            type: 'INIT',
            payload: {
              documentUri: document.uri.toString(),
              content: document.getText(),
              settings: currentSettings as IVWriterSettings,
              isReadonly: false,
            },
          };
          webviewPanel.webview.postMessage(initMsg);
          break;
        }

        case 'TEXT_EDIT': {
          if (isUpdatingFromHost) {
            return;
          }
          isUpdatingFromWebview = true;
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          edit.replace(document.uri, fullRange, message.payload.content);
          await vscode.workspace.applyEdit(edit);
          isUpdatingFromWebview = false;
          break;
        }

        case 'STATS_UPDATE': {
          StatusBarManager.updateStats(message.payload);
          break;
        }

        case 'OPEN_LINK': {
          const { target } = message.payload;
          if (target.startsWith('http://') || target.startsWith('https://')) {
            vscode.env.openExternal(vscode.Uri.parse(target));
          } else {
            vscode.window.showInformationMessage(`Open local target: ${target}`);
          }
          break;
        }

        case 'SHOW_MENU': {
          vscode.commands.executeCommand('iv-writer.showQuickMenu');
          break;
        }

        case 'LOG': {
          break;
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      if (IVWriterEditorProvider.activePanel === webviewPanel) {
        IVWriterEditorProvider.activePanel = null;
      }
      changeConfigSub.dispose();
      changeDocSub.dispose();
    });
  }

  private getHtmlForWebview(webview: vscode.Webview, fileName: string): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} https: data:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>iV Writer</title>
</head>
<body>
  <div id="app" class="iv-container">
    <!-- Top Navigation Header (Screenshot 1 Exact Replicaton) -->
    <header class="iv-top-nav">
      <div class="iv-nav-left">
        <div class="iv-window-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <button id="btn-sidebar-toggle" class="iv-nav-btn" title="사이드바 토글">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        </button>
        <div class="iv-nav-arrows">
          <button class="iv-nav-arrow" title="뒤로가기">‹</button>
          <button class="iv-nav-arrow" title="앞으로가기">›</button>
        </div>
      </div>

      <div class="iv-nav-center">
        <span class="iv-doc-title">${fileName}</span>
      </div>

      <div class="iv-nav-right">
        <button id="btn-focus-mode" class="iv-nav-btn iv-focus-pill" title="포커스 모드 전환 (문장/문단/끄기) [Cmd+/]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="6" y1="18" x2="18" y2="18"/></svg>
          <span id="label-focus">문장 포커스</span>
          <span class="iv-dropdown-arrow">▾</span>
        </button>
        <button id="btn-theme" class="iv-nav-btn" title="테마 변경 (Paper / Dark / Sepia) [Cmd+K Cmd+T]">
          <span id="label-theme">Paper</span>
        </button>
        <button id="btn-search" class="iv-nav-btn" title="문서 검색 (Cmd+F)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button id="btn-settings" class="iv-nav-btn" title="퀵 메뉴 및 단축키">
          ⚙️
        </button>
      </div>
    </header>

    <!-- Main Editor Mount Point -->
    <main id="editor-container" class="iv-editor-container"></main>

    <!-- Bottom Format Bar (Screenshot 1 Exact Replicaton) -->
    <footer class="iv-format-bar">
      <div class="iv-format-left">
        <button class="iv-fmt-item active" data-fmt="p">본문</button>
        <button class="iv-fmt-item" data-fmt="h1">제목 1 ↕</button>
        <button class="iv-fmt-item" data-fmt="list">목록 ↕</button>
        <button class="iv-fmt-item" data-fmt="quote">블록 따옴표</button>
        <button class="iv-fmt-item iv-fmt-bold" data-fmt="bold">볼드체</button>
        <button class="iv-fmt-item" data-fmt="italic">이탤릭체</button>
        <button class="iv-fmt-item" data-fmt="strike">취소선</button>
        <button class="iv-fmt-item" data-fmt="link">링크</button>
        <button class="iv-fmt-item" data-fmt="wikilink">위키링크</button>
        <button class="iv-fmt-item" data-fmt="footnote">각주</button>
        <button class="iv-fmt-item" data-fmt="table">표</button>
        <button class="iv-fmt-item" data-fmt="toc">목차</button>
      </div>

      <div class="iv-format-right">
        <button id="btn-stats" class="iv-fmt-stats" title="클릭하여 전체 통계 확인">
          <span id="stat-words-count">0 단어</span> ↕
        </button>
      </div>
    </footer>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
