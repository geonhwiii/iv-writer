import { IVEditor } from './core/editor';
import { HUDOverlay } from './ui/hud';
import { MarkdownPreviewRenderer } from './core/previewRenderer';
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
let isPreviewMode: boolean = false;

function applyThemeAndStyles(settings: IVWriterSettings): void {
  document.body.setAttribute('data-theme', settings.theme.preset);
  document.body.setAttribute('data-cursor-anim', settings.cursor.animation);
  document.body.setAttribute('data-cursor-style', settings.cursor.style);
  document.body.setAttribute('data-focusline-style', settings.focusLine.style);
  document.body.setAttribute('data-center-lock', settings.focus.anchor > 0.1 ? 'true' : 'false');

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

function togglePreview(): void {
  const editorContainer = document.getElementById('editor-container');
  const previewContainer = document.getElementById('preview-container');
  if (!editorContainer || !previewContainer) {
    return;
  }

  isPreviewMode = !isPreviewMode;
  if (isPreviewMode) {
    editor?.flushSave();
    const content = editor?.getContent() || '';
    previewContainer.innerHTML = MarkdownPreviewRenderer.render(content);
    editorContainer.style.display = 'none';
    previewContainer.style.display = 'block';
  } else {
    editorContainer.style.display = 'block';
    previewContainer.style.display = 'none';
    editor?.focus();
  }

  hud?.setPreviewMode(isPreviewMode);
}

function toggleFullscreen(): void {
  const doc = document as any;
  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
    const el = document.documentElement as any;
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (request) {
      request.call(el).catch(() => {
        vscode.postMessage({ type: 'TOGGLE_FULLSCREEN' });
      });
    } else {
      vscode.postMessage({ type: 'TOGGLE_FULLSCREEN' });
    }
  } else {
    const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
    if (exit) {
      exit.call(doc).catch(() => {
        vscode.postMessage({ type: 'TOGGLE_FULLSCREEN' });
      });
    } else {
      vscode.postMessage({ type: 'TOGGLE_FULLSCREEN' });
    }
  }
}

function initApp(): void {
  const editorContainer = document.getElementById('editor-container');
  if (!editorContainer) {
    return;
  }

  // Route empty outside container clicks to editor focus safely
  editorContainer.addEventListener('click', (e: MouseEvent) => {
    if (!isPreviewMode && e.target === editorContainer) {
      editor?.focus();
    }
  });

  hud = new HUDOverlay({
    onToggleFocus: () => cycleFocusMode(),
    onToggleCenterLock: () => {
      editor?.toggleCenterLock();
      hud?.updateControls(currentSettings);
    },
    onCycleTheme: () => cycleTheme(),
    onOpenSearch: () => editor?.openSearch(),
    onOpenSettings: () => vscode.postMessage({ type: 'SHOW_MENU' }),
    onTogglePreview: () => togglePreview(),
    onInsertFormat: (fmt) => editor?.insertFormat(fmt),
    onReopenDefault: () => vscode.postMessage({ type: 'REOPEN_DEFAULT' }),
    onCloseTab: () => vscode.postMessage({ type: 'CLOSE_TAB' }),
    onToggleFullscreen: () => toggleFullscreen(),
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
              hud?.hideHUD();
              vscode.postMessage({
                type: 'TEXT_EDIT',
                payload: { content: newContent },
              });
            },
            onCursorChange: (line, column, selectionLength) => {
              vscode.postMessage({
                type: 'CURSOR_ACTIVITY',
                payload: { line, column, selectionLength },
              });
            },
            onFormatChange: (fmt) => {
              hud?.setBlockFormatActive(fmt);
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
          if (isPreviewMode) {
            const previewContainer = document.getElementById('preview-container');
            if (previewContainer) {
              previewContainer.innerHTML = MarkdownPreviewRenderer.render(message.payload.content);
            }
          }
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

  // Intercept Cmd+S / Ctrl+S to flush any pending edits immediately
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
      editor?.flushSave();
    }
    // Cmd+Shift+V for Toggle Preview
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      togglePreview();
    }
  });

  window.addEventListener('blur', () => {
    editor?.flushSave();
  });

  // Notify extension host that webview is ready
  vscode.postMessage({ type: 'READY' });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
