import { DocumentStats } from '../../shared/messages';
import { IVWriterSettings, ThemePreset } from '../../shared/settings';
import { THEME_PRESETS } from '../../shared/constants';

export class HUDOverlay {
  private hudElement: HTMLElement | null;
  private statWords: HTMLElement | null;
  private statChars: HTMLElement | null;
  private statReadtime: HTMLElement | null;
  private btnFocusMode: HTMLButtonElement | null;
  private btnTheme: HTMLButtonElement | null;

  constructor(
    private readonly onToggleFocus: () => void,
    private readonly onCycleTheme: () => void
  ) {
    this.hudElement = document.getElementById('iv-hud');
    this.statWords = document.getElementById('stat-words');
    this.statChars = document.getElementById('stat-chars');
    this.statReadtime = document.getElementById('stat-readtime');
    this.btnFocusMode = document.getElementById('btn-focus-mode') as HTMLButtonElement;
    this.btnTheme = document.getElementById('btn-theme') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.btnFocusMode?.addEventListener('click', () => {
      this.onToggleFocus();
    });

    this.btnTheme?.addEventListener('click', () => {
      this.onCycleTheme();
    });
  }

  public updateStats(stats: DocumentStats): void {
    if (this.statWords) {
      this.statWords.textContent = `${stats.words.toLocaleString()} words`;
    }
    if (this.statChars) {
      this.statChars.textContent = `${stats.chars.toLocaleString()} chars`;
    }
    if (this.statReadtime) {
      this.statReadtime.textContent = `${stats.readingTimeMin} min read`;
    }
  }

  public updateControls(settings: IVWriterSettings): void {
    if (this.btnFocusMode) {
      if (!settings.focus.enabled) {
        this.btnFocusMode.textContent = 'Focus: Off';
        this.btnFocusMode.classList.remove('active');
      } else {
        const modeName = settings.focus.mode === 'paragraph' ? 'Paragraph' : 'Line';
        this.btnFocusMode.textContent = `Focus: ${modeName}`;
        this.btnFocusMode.classList.add('active');
      }
    }

    if (this.btnTheme) {
      const themeCapitalized =
        settings.theme.preset.charAt(0).toUpperCase() + settings.theme.preset.slice(1);
      this.btnTheme.textContent = themeCapitalized;
    }
  }
}
