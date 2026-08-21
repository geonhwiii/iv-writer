import * as vscode from 'vscode';
import { HostToWebviewMessage, WebviewToHostMessage } from '../shared/messages';
import { ConfigManager } from './configManager';
import { StatusBarManager } from './statusBar';
import { ThemePreset, FocusMode } from '../shared/settings';
import { THEME_PRESETS } from '../shared/constants';

export class IVWriterEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'iv-writer.editor';
  private static activePanel: vscode.WebviewPanel | undefined;

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

  public static getActivePanel(): vscode.WebviewPanel | undefined {
    return IVWriterEditorProvider.activePanel;
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
      ],
    };

    IVWriterEditorProvider.activePanel = webviewPanel;
    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        IVWriterEditorProvider.activePanel = e.webviewPanel;
      }
    });

    webviewPanel.onDidDispose(() => {
      if (IVWriterEditorProvider.activePanel === webviewPanel) {
        IVWriterEditorProvider.activePanel = undefined;
      }
    });

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    let isSavingFromWebview = false;

    // 1. Webview -> Host Messages
    webviewPanel.webview.onDidReceiveMessage(async (message: WebviewToHostMessage) => {
      switch (message.type) {
        case 'READY': {
          const initMsg: HostToWebviewMessage = {
            type: 'INIT',
            payload: {
              documentUri: document.uri.toString(),
              content: document.getText(),
              settings: ConfigManager.getSettings(),
              isReadonly: document.isClosed || !vscode.workspace.fs.isWritableFileSystem(document.uri.scheme),
            },
          };
          webviewPanel.webview.postMessage(initMsg);
          break;
        }

        case 'TEXT_EDIT': {
          const newContent = message.payload.content;
          if (newContent === document.getText()) {
            return;
          }

          isSavingFromWebview = true;
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          edit.replace(document.uri, fullRange, newContent);
          await vscode.workspace.applyEdit(edit);
          isSavingFromWebview = false;
          break;
        }

        case 'STATS_UPDATE': {
          StatusBarManager.updateStats(message.payload);
          break;
        }

        case 'OPEN_LINK': {
          const target = message.payload.target;
          try {
            // Find file in workspace
            const files = await vscode.workspace.findFiles(`**/${target}`, '**/node_modules/**', 1);
            if (files && files.length > 0) {
              const doc = await vscode.workspace.openTextDocument(files[0]);
              await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
            } else {
              // Try directly as relative or absolute URI
              const uri = vscode.Uri.file(target);
              const doc = await vscode.workspace.openTextDocument(uri);
              await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
            }
          } catch (err) {
            console.warn(`[iV Writer] Could not open link target: ${target}`);
          }
          break;
        }

        case 'SHOW_MENU': {
          vscode.commands.executeCommand('iv-writer.showQuickMenu');
          break;
        }

        case 'LOG': {
          const { level, message: logMsg } = message.payload;
          if (level === 'error') {
            console.error(`[iV Writer Webview] ${logMsg}`);
          } else if (level === 'warn') {
            console.warn(`[iV Writer Webview] ${logMsg}`);
          } else {
            console.log(`[iV Writer Webview] ${logMsg}`);
          }
          break;
        }
      }
    });

    // 2. Host -> Webview Document Sync (e.g. external edits or undo/redo from VS Code)
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        if (isSavingFromWebview) {
          return;
        }
        const docChangeMsg: HostToWebviewMessage = {
          type: 'DOC_CHANGED',
          payload: {
            content: document.getText(),
            version: e.document.version,
          },
        };
        webviewPanel.webview.postMessage(docChangeMsg);
      }
    });

    // 3. Host -> Webview Config Sync
    const configSubscription = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ivWriter')) {
        const configMsg: HostToWebviewMessage = {
          type: 'CONFIG_CHANGED',
          payload: {
            settings: ConfigManager.getSettings(),
          },
        };
        webviewPanel.webview.postMessage(configMsg);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      configSubscription.dispose();
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
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
    <!-- Main Editor Mount Point -->
    <main id="editor-container" class="iv-editor-container"></main>

    <!-- iA Writer Bottom Floating Stats Pill Bar (Auto-hide) -->
    <div id="iv-hud" class="iv-hud">
      <div class="iv-stat-pill">
        <span id="stat-chars">0 Characters</span>
        <span id="stat-chars-no-space">0 Without Spaces</span>
        <span id="stat-words">0 Words</span>
        <span id="stat-sentences">0 Sentences</span>
        <span id="stat-reading-time">00:00:00 Reading Time</span>
      </div>
    </div>
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
