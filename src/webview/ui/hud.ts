import { DocumentStats } from '../../shared/messages';
import { IVWriterSettings } from '../../shared/settings';

export interface HUDCallbacks {
  onToggleFocus: () => void;
  onCycleTheme: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onInsertFormat: (formatType: string) => void;
}

export class HUDOverlay {
  private btnFocusMode: HTMLButtonElement | null;
  private labelFocus: HTMLElement | null;
  private btnTheme: HTMLButtonElement | null;
  private labelTheme: HTMLElement | null;
  private btnSearch: HTMLButtonElement | null;
  private btnSettings: HTMLButtonElement | null;
  private btnStats: HTMLButtonElement | null;
  private statWordsCount: HTMLElement | null;

  constructor(private readonly callbacks: HUDCallbacks) {
    this.btnFocusMode = document.getElementById('btn-focus-mode') as HTMLButtonElement;
    this.labelFocus = document.getElementById('label-focus');
    this.btnTheme = document.getElementById('btn-theme') as HTMLButtonElement;
    this.labelTheme = document.getElementById('label-theme');
    this.btnSearch = document.getElementById('btn-search') as HTMLButtonElement;
    this.btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;
    this.btnStats = document.getElementById('btn-stats') as HTMLButtonElement;
    this.statWordsCount = document.getElementById('stat-words-count');

    this.bindEvents();
  }

  private bindEvents(): void {
    this.btnFocusMode?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onToggleFocus();
    });

    this.btnTheme?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onCycleTheme();
    });

    this.btnSearch?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onOpenSearch();
    });

    this.btnSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onOpenSettings();
    });

    this.btnStats?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onOpenSettings();
    });

    // Format Bar Buttons
    const formatButtons = document.querySelectorAll('.iv-fmt-item');
    formatButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const fmt = (btn as HTMLElement).getAttribute('data-fmt');
        if (fmt) {
          this.callbacks.onInsertFormat(fmt);
        }
      });
    });
  }

  public updateStats(stats: DocumentStats): void {
    if (this.statWordsCount) {
      this.statWordsCount.textContent = `${stats.words.toLocaleString()} 단어`;
    }
  }

  public updateControls(settings: IVWriterSettings): void {
    if (this.labelFocus) {
      if (!settings.focus.enabled) {
        this.labelFocus.textContent = '포커스 끄기';
        this.btnFocusMode?.classList.remove('active');
      } else {
        const modeText =
          settings.focus.mode === 'sentence'
            ? '문장 포커스'
            : settings.focus.mode === 'paragraph'
            ? '문단 포커스'
            : '줄 포커스';
        this.labelFocus.textContent = modeText;
        this.btnFocusMode?.classList.add('active');
      }
    }

    if (this.labelTheme) {
      const themeText =
        settings.theme.preset === 'paper'
          ? 'Paper'
          : settings.theme.preset === 'dark'
          ? 'Dark'
          : settings.theme.preset === 'sepia'
          ? 'Sepia'
          : 'Midnight';
      this.labelTheme.textContent = themeText;
    }
  }
}
