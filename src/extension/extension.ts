import * as vscode from 'vscode';
import { IVWriterEditorProvider } from './editorProvider';
import { HostToWebviewMessage } from '../shared/messages';
import { StatusBarManager } from './statusBar';
import { DailyNotesManager } from './dailyNotes';

export function activate(context: vscode.ExtensionContext) {
  console.log('[iV Writer] Extension activating...');

  // 1. Status Bar 초기화
  StatusBarManager.initialize(context);

  // 2. Custom Editor Provider 등록
  context.subscriptions.push(IVWriterEditorProvider.register(context));

  // 3. Commands 등록
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

  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.createDailyNote', async () => {
      await DailyNotesManager.createDailyNote();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.showStatistics', () => {
      StatusBarManager.showStatisticsDialog();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('iv-writer.showQuickMenu', async () => {
      const items = [
        { label: '$(symbol-text) Toggle Focus Mode', description: 'Toggle Focus / Normal', action: 'toggleFocus' },
        { label: '$(sync) Cycle Focus Mode', description: 'Paragraph -> Line -> Off', action: 'cycleFocus' },
        { label: '$(color-mode) Cycle Writing Theme', description: 'Paper, Dark, Sepia, Midnight', action: 'cycleTheme' },
        { label: '$(graph) View Document Statistics', description: 'Detailed words, chars, reading time', action: 'statistics' },
        { label: '$(screen-full) Toggle Zen Mode', description: 'Distraction-free workspace', action: 'toggleZen' },
        { label: '$(calendar) Create Daily Note', description: 'Open today\'s note in notes/YYYY-MM-DD.md', action: 'dailyNote' },
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'iV Writer: Quick Actions',
      });

      if (!selected) {
        return;
      }

      switch (selected.action) {
        case 'toggleFocus':
          vscode.commands.executeCommand('iv-writer.toggleFocusMode');
          break;
        case 'cycleFocus':
          vscode.commands.executeCommand('iv-writer.cycleFocusMode');
          break;
        case 'cycleTheme':
          vscode.commands.executeCommand('iv-writer.cycleTheme');
          break;
        case 'statistics':
          vscode.commands.executeCommand('iv-writer.showStatistics');
          break;
        case 'toggleZen':
          vscode.commands.executeCommand('iv-writer.toggleZenMode');
          break;
        case 'dailyNote':
          vscode.commands.executeCommand('iv-writer.createDailyNote');
          break;
      }
    })
  );

  console.log('[iV Writer] Extension activated successfully.');
}

export function deactivate() {
  StatusBarManager.hide();
  console.log('[iV Writer] Extension deactivated.');
}
