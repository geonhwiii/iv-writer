import * as vscode from 'vscode';
import { HostToWebviewMessage, WebviewToHostMessage } from '../shared/messages';
import { IVWriterSettings } from '../shared/settings';
import { StatusBarManager } from './statusBar';

export class IVWriterEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'iv-writer.editor';
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
        vscode.Uri.joinPath(this.context.extensionUri, 'assets'),
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

    let lastSentToDoc = document.getText();

    const changeConfigSub = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ivWriter')) {
        syncSettings();
      }
    });

    const changeDocSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        const currentText = document.getText();
        // If change originated from our webview edit, DO NOT echo back
        if (currentText === lastSentToDoc) {
          return;
        }
        lastSentToDoc = currentText;
        const msg: HostToWebviewMessage = {
          type: 'DOC_CHANGED',
          payload: {
            content: currentText,
            version: document.version,
          },
        };
        webviewPanel.webview.postMessage(msg);
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
              fontSize: config.get<number>('typography.fontSize', 19.5),
              lineHeight: config.get<number>('typography.lineHeight', 2.0),
              maxWidth: config.get<number>('typography.maxWidth', 580),
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

          lastSentToDoc = document.getText();
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
          lastSentToDoc = message.payload.content;
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          edit.replace(document.uri, fullRange, message.payload.content);
          await vscode.workspace.applyEdit(edit);
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

        case 'REOPEN_DEFAULT': {
          await vscode.commands.executeCommand('workbench.action.reopenTextEditor');
          break;
        }

        case 'CLOSE_TAB': {
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
          break;
        }

        case 'TOGGLE_FULLSCREEN': {
          await vscode.commands.executeCommand('workbench.action.toggleZenMode');
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
    const logoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'logo.png')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https:; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} https: data:; img-src ${webview.cspSource} https: data:; connect-src https:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>iV Writer</title>
</head>
<body>
  <div id="app" class="iv-container">
    <!-- Clean Minimal Title Header with Window Dots, Logo & Preview Button -->
    <header class="iv-top-nav">
      <div class="iv-window-dots">
        <button id="dot-red" class="dot dot-red" title="iV Writer 끄기 / 기본 텍스트 에디터로 전환"></button>
        <button id="dot-yellow" class="dot dot-yellow" title="에디터 탭 닫기"></button>
        <button id="dot-green" class="dot dot-green" title="iV Writer 집중 전체화면 모드 토글"></button>
      </div>
      <div class="iv-title-wrapper">
        <img src="${logoUri}" alt="iV Writer Logo" class="iv-top-logo" />
      </div>
      <button id="btn-preview" class="iv-btn-preview" title="마크다운 미리보기 모드 토글 (Cmd+Shift+V)">
        <svg id="icon-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <svg id="icon-edit" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </button>
    </header>

    <!-- Main Writing Editor -->
    <main id="editor-container" class="iv-editor-container"></main>

    <!-- Markdown Rendered Preview View -->
    <article id="preview-container" class="iv-preview-container" style="display: none;"></article>

    <!-- Bottom Format Bar (Streamlined with Select Dropdown) -->
    <footer class="iv-format-bar">
      <div class="iv-format-left">
        <!-- Group 1: Structure (Body button + Heading Custom Dropdown + List Custom Dropdown) -->
        <button id="btn-fmt-body" class="iv-fmt-item active" title="본문 서식으로 전환">본문</button>

        <!-- Heading Dropdown -->
        <div class="iv-dropdown-wrapper">
          <button id="btn-fmt-heading" class="iv-fmt-item" title="제목 레벨 선택">
            <span id="label-fmt-heading">제목 1</span> ↕
          </button>
          <div id="menu-fmt-heading" class="iv-dropdown-menu" style="display: none;">
            <div class="iv-dropdown-item" data-val="h1">제목 1</div>
            <div class="iv-dropdown-item" data-val="h2">제목 2</div>
            <div class="iv-dropdown-item" data-val="h3">제목 3</div>
            <div class="iv-dropdown-item" data-val="h4">제목 4</div>
            <div class="iv-dropdown-item" data-val="h5">제목 5</div>
            <div class="iv-dropdown-item" data-val="h6">제목 6</div>
          </div>
        </div>

        <!-- List Dropdown (Exact Match from Screenshot) -->
        <div class="iv-dropdown-wrapper">
          <button id="btn-fmt-list" class="iv-fmt-item" title="목록 스타일 선택">
            <span id="label-fmt-list">목록</span> ↕
          </button>
          <div id="menu-fmt-list" class="iv-dropdown-menu" style="display: none;">
            <div class="iv-dropdown-item" data-val="list">목록</div>
            <div class="iv-dropdown-item" data-val="numlist">순서가 지정된 목록</div>
            <div class="iv-dropdown-item" data-val="task">작업</div>
            <div class="iv-dropdown-item" data-val="numtask">순서가 지정된 작업</div>
          </div>
        </div>

        <span class="iv-fmt-divider"></span>

        <!-- Group 2: Inline Styles -->
        <button class="iv-fmt-item iv-fmt-bold" data-fmt="bold">볼드체</button>
        <button class="iv-fmt-item iv-fmt-italic" data-fmt="italic">이탈릭체</button>
        <button class="iv-fmt-item iv-fmt-strike" data-fmt="strike">취소선</button>

        <span class="iv-fmt-divider"></span>

        <!-- Group 3: Quick Controls (Focus, Typewriter Lock & Theme) -->
        <button id="btn-fmt-focus" class="iv-fmt-item iv-fmt-control" title="포커스 모드 변경 (문장/문단/끄기) [Cmd+/]">
          <span id="label-fmt-focus">포커스: 문장</span> ↕
        </button>
        <button id="btn-fmt-lock" class="iv-fmt-item iv-fmt-control" title="타자기 센터 락 토글 (화면 중앙 50% 고정)">
          <span id="label-fmt-lock">타자기: 중앙</span> ↕
        </button>
        <button id="btn-fmt-theme" class="iv-fmt-item iv-fmt-control" title="테마 변경 (Paper / Dark / Sepia / Midnight)">
          <span id="label-fmt-theme">테마: Paper</span> ↕
        </button>
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
