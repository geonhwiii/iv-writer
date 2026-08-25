import { IVEditor } from './core/editor';
import { HUDOverlay } from './ui/hud';
import { HostToWebviewMessage, WebviewToHostMessage, DocumentStats } from '../shared/messages';
import { IVWriterSettings, ThemePreset } from '../shared/settings';
import { DEFAULT_SETTINGS, THEME_PRESETS } from '../shared/constants';

declare function acquireVsCodeApi(): {
  postMessage: (message: WebviewToHostMessage) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const vscode = acquireVsCodeApi();

let editor: IVEditor | null = null;
let hud: HUDOverlay | null = null;
let currentSettings: IVWriterSettings = DEFAULT_SETTINGS;

function applyThemeAndStyles(settings: IVWriterSettings): void {
  document.body.setAttribute('data-theme', settings.theme.preset);
  document.body.setAttribute('data-cursor-anim', settings.cursor.animation);
  document.body.setAttribute('data-cursor-style', settings.cursor.style);
  document.body.setAttribute('data-focusline-style', settings.focusLine.style);

  // Apply CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--iv-max-width', `${settings.typography.maxWidth}px`);
  root.style.setProperty('--iv-font-size', `${settings.typography.fontSize}px`);
  root.style.setProperty('--iv-line-height', `${settings.typography.lineHeight}`);
  root.style.setProperty('--iv-font-family', settings.typography.fontFamily);
  root.style.setProperty('--iv-cursor-width', `${settings.cursor.width}px`);
}

function cycleTheme(): void {
  const currentIndex = THEME_PRESETS.indexOf(currentSettings.theme.preset);
  const nextIndex = (currentIndex + 1) % THEME_PRESETS.length;
  currentSettings.theme.preset = THEME_PRESETS[nextIndex];
  
  applyThemeAndStyles(currentSettings);
  hud?.updateControls(currentSettings);
}

function cycleFocusMode(): void {
  editor?.cycleFocusMode();
  hud?.updateControls(currentSettings);
}

function adjustFontSize(delta: number): void {
  const newSize = Math.max(12, Math.min(36, currentSettings.typography.fontSize + delta));
  currentSettings.typography.fontSize = newSize;
  applyThemeAndStyles(currentSettings);
}

function initApp(): void {
  const editorContainer = document.getElementById('editor-container');
  if (!editorContainer) {
    return;
  }

  hud = new HUDOverlay({
    onToggleFocus: () => cycleFocusMode(),
    onCycleTheme: () => cycleTheme(),
    onAdjustFontSize: (delta) => adjustFontSize(delta),
    onOpenSettings: () => vscode.postMessage({ type: 'SHOW_MENU' }),
  });

  applyThemeAndStyles(currentSettings);

  window.addEventListener('message', (event) => {
    const message: HostToWebviewMessage = event.data;

    switch (message.type) {
      case 'INIT': {
        const { content, settings } = message.payload;
        currentSettings = { ...DEFAULT_SETTINGS, ...settings };
        applyThemeAndStyles(currentSettings);

        if (editor) {
          editor.destroy();
        }

        editor = new IVEditor(
          editorContainer,
          content,
          currentSettings,
          {
            onDocChange: (newContent) => {
              hud?.hideImmediately();
              vscode.postMessage({
                type: 'TEXT_EDIT',
                payload: { content: newContent },
              });
            },
            onCursorChange: (line, column, selectionLength) => {
              hud?.hideImmediately();
              vscode.postMessage({
                type: 'CURSOR_ACTIVITY',
                payload: { line, column, selectionLength },
              });
            },
            onStatsChange: (stats: DocumentStats) => {
              hud?.updateStats(stats);
              vscode.postMessage({
                type: 'STATS_UPDATE',
                payload: stats,
              });
            },
            onOpenLink: (link: string) => {
              vscode.postMessage({
                type: 'OPEN_LINK',
                payload: { target: link },
              });
            },
          }
        );

        hud?.updateControls(currentSettings);
        editor.focus();
        break;
      }

      case 'DOC_CHANGED': {
        if (editor) {
          editor.setContent(message.payload.content);
        }
        break;
      }

      case 'CONFIG_CHANGED': {
        currentSettings = { ...DEFAULT_SETTINGS, ...message.payload.settings };
        applyThemeAndStyles(currentSettings);
        editor?.updateSettings(currentSettings);
        hud?.updateControls(currentSettings);
        break;
      }

      case 'EXEC_COMMAND': {
        const { command } = message.payload;
        if (command === 'toggleFocus' || command === 'cycleFocus') {
          cycleFocusMode();
        } else if (command === 'cycleTheme') {
          cycleTheme();
        }
        break;
      }
    }
  });

  // Notify extension host that webview is ready
  vscode.postMessage({ type: 'READY' });
}

document.addEventListener('DOMContentLoaded', initApp);
