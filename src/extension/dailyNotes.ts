import * as vscode from 'vscode';
import { IVWriterEditorProvider } from './editorProvider';

export class DailyNotesManager {
  public static async createDailyNote(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('iV Writer: Please open a workspace folder first to create daily notes.');
      return;
    }

    const rootUri = workspaceFolders[0].uri;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Path: notes/YYYY-MM-DD.md
    const notesFolderUri = vscode.Uri.joinPath(rootUri, 'notes');
    const dailyFileUri = vscode.Uri.joinPath(notesFolderUri, `${dateStr}.md`);

    try {
      // Check if notes directory exists, create if not
      await vscode.workspace.fs.createDirectory(notesFolderUri);

      // Check if file already exists
      let fileExists = false;
      try {
        await vscode.workspace.fs.stat(dailyFileUri);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (!fileExists) {
        const initialContent = `# ${dateStr} Daily Note

## 오늘의 생각
- 

## 작업 로그
- 

## 회고 및 메모
- 
`;
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(dailyFileUri, encoder.encode(initialContent));
      }

      // Open file in iV Writer
      await vscode.commands.executeCommand(
        'vscode.openWith',
        dailyFileUri,
        IVWriterEditorProvider.viewType,
        vscode.ViewColumn.Active
      );
    } catch (err: any) {
      vscode.window.showErrorMessage(`iV Writer: Failed to create daily note - ${err.message}`);
    }
  }
}
