import * as vscode from 'vscode';
import { DocumentStats } from '../shared/messages';

export class StatusBarManager {
  private static statusBarItem: vscode.StatusBarItem;
  private static latestStats: DocumentStats = {
    words: 0,
    chars: 0,
    charsNoSpaces: 0,
    paragraphs: 0,
    readingTimeMin: 1,
  };

  public static initialize(context: vscode.ExtensionContext): void {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'iv-writer.showQuickMenu';
    context.subscriptions.push(this.statusBarItem);
  }

  public static updateStats(stats: DocumentStats): void {
    this.latestStats = stats;
    if (!this.statusBarItem) {
      return;
    }
    this.statusBarItem.text = `$(edit) ${stats.words.toLocaleString()} words • ${stats.readingTimeMin}m read`;
    this.statusBarItem.tooltip = `iV Writer Stats:\n- Words: ${stats.words.toLocaleString()}\n- Characters: ${stats.chars.toLocaleString()} (no spaces: ${stats.charsNoSpaces.toLocaleString()})\n- Paragraphs: ${stats.paragraphs.toLocaleString()}\n- Reading Time: ~${stats.readingTimeMin} min\nClick to open quick menu.`;
    this.statusBarItem.show();
  }

  public static showStatisticsDialog(): void {
    const s = this.latestStats;
    const msg = [
      `📊 iV Writer Document Statistics`,
      `• Words: ${s.words.toLocaleString()}`,
      `• Characters: ${s.chars.toLocaleString()} (without spaces: ${s.charsNoSpaces.toLocaleString()})`,
      `• Paragraphs: ${s.paragraphs.toLocaleString()}`,
      `• Estimated Reading Time: ~${s.readingTimeMin} min (based on 500 chars/min or 200 words/min)`,
    ].join('\n');

    vscode.window.showInformationMessage(msg, { modal: true });
  }

  public static hide(): void {
    this.statusBarItem?.hide();
  }
}
