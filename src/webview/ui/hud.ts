import { DocumentStats } from '../../shared/messages';
import { IVWriterSettings } from '../../shared/settings';

export class HUDOverlay {
  private hudElement: HTMLElement | null;
  private statChars: HTMLElement | null;
  private statCharsNoSpace: HTMLElement | null;
  private statWords: HTMLElement | null;
  private statSentences: HTMLElement | null;
  private statReadingTime: HTMLElement | null;
  private hideTimeout: any = null;

  constructor(
    private readonly onToggleFocus?: () => void,
    private readonly onCycleTheme?: () => void,
    private readonly onOpenSettings?: () => void
  ) {
    this.hudElement = document.getElementById('iv-hud');
    this.statChars = document.getElementById('stat-chars');
    this.statCharsNoSpace = document.getElementById('stat-chars-no-space');
    this.statWords = document.getElementById('stat-words');
    this.statSentences = document.getElementById('stat-sentences');
    this.statReadingTime = document.getElementById('stat-reading-time');

    this.setupAutoVisibility();
  }

  private setupAutoVisibility(): void {
    // Show on mousemove or wheel, then hide after 3 seconds
    const showHUD = () => {
      if (!this.hudElement) {
        return;
      }
      this.hudElement.classList.add('visible');

      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.hideTimeout = setTimeout(() => {
        this.hudElement?.classList.remove('visible');
      }, 2500);
    };

    window.addEventListener('mousemove', showHUD, { passive: true });
    window.addEventListener('wheel', showHUD, { passive: true });

    // Click on HUD to open settings/actions
    this.hudElement?.addEventListener('click', () => {
      this.onOpenSettings?.();
    });
  }

  public hideImmediately(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
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

  public updateControls(_settings: IVWriterSettings): void {
    // Clean minimal HUD has no cluttered buttons
  }
}
