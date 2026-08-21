import * as vscode from 'vscode';
import { IVWriterEditorProvider } from './editorProvider';
import { HostToWebviewMessage } from '../shared/messages';

export function activate(context: vscode.ExtensionContext) {
  console.log('[iV Writer] Extension activating...');

  // 1. Custom Editor Provider 등록
  context.subscriptions.push(IVWriterEditorProvider.register(context));

  // 2. Commands 등록
  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.openWriterMode', async (uri?: vscode.Uri) => {
      let targetUri = uri;
      if (!targetUri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          targetUri = activeEditor.document.uri;
        }
      }

      if (!targetUri) {
        vscode.window.showInformationMessage('iV Writer: Please open a markdown or text file first.');
        return;
      }

      await vscode.commands.executeCommand(
        'vscode.openWith',
        targetUri,
        IVWriterEditorProvider.viewType,
        vscode.ViewColumn.Active
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.toggleFocusMode', () => {
      const activePanel = IVWriterEditorProvider.getActivePanel();
      if (activePanel) {
        const msg: HostToWebviewMessage = {
          type: 'EXEC_COMMAND',
          payload: { command: 'toggleFocus' },
        };
        activePanel.webview.postMessage(msg);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.cycleFocusMode', () => {
      const activePanel = IVWriterEditorProvider.getActivePanel();
      if (activePanel) {
        const msg: HostToWebviewMessage = {
          type: 'EXEC_COMMAND',
          payload: { command: 'cycleFocus' },
        };
        activePanel.webview.postMessage(msg);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.cycleTheme', () => {
      const activePanel = IVWriterEditorProvider.getActivePanel();
      if (activePanel) {
        const msg: HostToWebviewMessage = {
          type: 'EXEC_COMMAND',
          payload: { command: 'cycleTheme' },
        };
        activePanel.webview.postMessage(msg);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.toggleZenMode', async () => {
      await vscode.commands.executeCommand('workbench.action.toggleZenMode');
    })
  );

  console.log('[iV Writer] Extension activated successfully.');
}

export function deactivate() {
  console.log('[iV Writer] Extension deactivated.');
}
