import { DocumentStats } from '../../shared/messages';
import { IVWriterSettings } from '../../shared/settings';

export interface HUDCallbacks {
  onToggleFocus: () => void;
  onCycleTheme: () => void;
  onAdjustFontSize: (delta: number) => void;
  onOpenSettings: () => void;
}

export class HUDOverlay {
  private topControls: HTMLElement | null;
  private hudElement: HTMLElement | null;
  private statChars: HTMLElement | null;
  private statCharsNoSpace: HTMLElement | null;
  private statWords: HTMLElement | null;
  private statSentences: HTMLElement | null;
  private statReadingTime: HTMLElement | null;

  private btnFocusMode: HTMLButtonElement | null;
  private labelFocus: HTMLElement | null;
  private btnTheme: HTMLButtonElement | null;
  private labelTheme: HTMLElement | null;
  private btnFontDec: HTMLButtonElement | null;
  private btnFontInc: HTMLButtonElement | null;
  private btnSettings: HTMLButtonElement | null;

  private hideTimeout: any = null;

  constructor(private readonly callbacks: HUDCallbacks) {
    this.topControls = document.getElementById('iv-top-controls');
    this.hudElement = document.getElementById('iv-hud');
    this.statChars = document.getElementById('stat-chars');
    this.statCharsNoSpace = document.getElementById('stat-chars-no-space');
    this.statWords = document.getElementById('stat-words');
    this.statSentences = document.getElementById('stat-sentences');
    this.statReadingTime = document.getElementById('stat-reading-time');

    this.btnFocusMode = document.getElementById('btn-focus-mode') as HTMLButtonElement;
    this.labelFocus = document.getElementById('label-focus');
    this.btnTheme = document.getElementById('btn-theme') as HTMLButtonElement;
    this.labelTheme = document.getElementById('label-theme');
    this.btnFontDec = document.getElementById('btn-font-dec') as HTMLButtonElement;
    this.btnFontInc = document.getElementById('btn-font-inc') as HTMLButtonElement;
    this.btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;

    this.bindEvents();
    this.setupAutoVisibility();
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

    this.btnFontDec?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onAdjustFontSize(-1);
    });

    this.btnFontInc?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onAdjustFontSize(1);
    });

    this.btnSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onOpenSettings();
    });

    this.hudElement?.addEventListener('click', () => {
      this.callbacks.onOpenSettings();
    });
  }

  private setupAutoVisibility(): void {
    const showControls = () => {
      this.topControls?.classList.add('visible');
      this.hudElement?.classList.add('visible');

      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.hideTimeout = setTimeout(() => {
        this.topControls?.classList.remove('visible');
        this.hudElement?.classList.remove('visible');
      }, 3000);
    };

    window.addEventListener('mousemove', showControls, { passive: true });
    window.addEventListener('wheel', showControls, { passive: true });
  }

  public hideImmediately(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.topControls?.classList.remove('visible');
    this.hudElement?.classList.remove('visible');
  }

  public updateStats(stats: DocumentStats): void {
    if (this.statChars) {
      this.statChars.textContent = `${stats.chars.toLocaleString()} Characters`;
    }
    if (this.statCharsNoSpace) {
      this.statCharsNoSpace.textContent = `${stats.charsNoSpaces.toLocaleString()} Without Spaces`;
    }
    if (this.statWords) {
      this.statWords.textContent = `${stats.words.toLocaleString()} Words`;
    }
    if (this.statSentences) {
      this.statSentences.textContent = `${stats.sentences.toLocaleString()} Sentences`;
    }
    if (this.statReadingTime) {
      this.statReadingTime.textContent = `${stats.readingTimeFormatted || '00:00:00'} Reading Time`;
    }
  }

  public updateControls(settings: IVWriterSettings): void {
    if (this.labelFocus) {
      if (!settings.focus.enabled) {
        this.labelFocus.textContent = 'Focus: Off';
        this.btnFocusMode?.classList.remove('active');
      } else {
        const modeText =
          settings.focus.mode === 'paragraph'
            ? 'Paragraph'
            : settings.focus.mode === 'sentence'
            ? 'Sentence'
            : 'Line';
        this.labelFocus.textContent = `Focus: ${modeText}`;
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
