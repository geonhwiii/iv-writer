import * as vscode from 'vscode';
import { DocumentStats } from '../shared/messages';

export class StatusBarManager {
  private static statusBarItem: vscode.StatusBarItem;

  public static initialize(context: vscode.ExtensionContext): void {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'iv-writer.showQuickMenu';
    context.subscriptions.push(this.statusBarItem);
  }

  public static updateStats(stats: DocumentStats): void {
    if (!this.statusBarItem) {
      return;
    }
    this.statusBarItem.text = `$(edit) ${stats.words.toLocaleString()} words • ${stats.readingTimeMin}m read`;
    this.statusBarItem.tooltip = `iV Writer Stats:\n- Words: ${stats.words}\n- Characters: ${stats.chars}\n- Paragraphs: ${stats.paragraphs}\n- Estimated Reading Time: ${stats.readingTimeMin} min\nClick to open quick menu.`;
    this.statusBarItem.show();
  }

  public static hide(): void {
    this.statusBarItem?.hide();
  }
}
