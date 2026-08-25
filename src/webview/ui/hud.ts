import { DocumentStats } from '../../shared/messages';
import { IVWriterSettings } from '../../shared/settings';

export interface HUDCallbacks {
  onToggleFocus: () => void;
  onToggleCenterLock: () => void;
  onCycleTheme: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onTogglePreview: () => void;
  onInsertFormat: (formatType: string) => void;
  onReopenDefault: () => void;
  onCloseTab: () => void;
  onToggleFullscreen: () => void;
}

export class HUDOverlay {
  private topNav: HTMLElement | null;
  private formatBar: HTMLElement | null;

  private dotRed: HTMLButtonElement | null;
  private dotYellow: HTMLButtonElement | null;
  private dotGreen: HTMLButtonElement | null;

  private btnPreview: HTMLButtonElement | null;
  private iconPlay: SVGElement | null;
  private iconEdit: SVGElement | null;

  private btnFmtBody: HTMLButtonElement | null;

  private btnFmtHeading: HTMLButtonElement | null;
  private labelFmtHeading: HTMLElement | null;
  private menuFmtHeading: HTMLElement | null;

  private btnFmtList: HTMLButtonElement | null;
  private labelFmtList: HTMLElement | null;
  private menuFmtList: HTMLElement | null;

  private btnFmtFocus: HTMLButtonElement | null;
  private labelFmtFocus: HTMLElement | null;
  private btnFmtLock: HTMLButtonElement | null;
  private labelFmtLock: HTMLElement | null;
  private btnFmtTheme: HTMLButtonElement | null;
  private labelFmtTheme: HTMLElement | null;

  private btnStats: HTMLButtonElement | null;
  private statWordsCount: HTMLElement | null;

  private autoHideTimeout: any = null;
  private isHoveringHUD: boolean = false;
  private isEditorFocused: boolean = true;

  constructor(private readonly callbacks: HUDCallbacks) {
    this.topNav = document.querySelector('.iv-top-nav');
    this.formatBar = document.querySelector('.iv-format-bar');

    this.dotRed = document.getElementById('dot-red') as HTMLButtonElement;
    this.dotYellow = document.getElementById('dot-yellow') as HTMLButtonElement;
    this.dotGreen = document.getElementById('dot-green') as HTMLButtonElement;

    this.btnPreview = document.getElementById('btn-preview') as HTMLButtonElement;
    this.iconPlay = document.getElementById('icon-play') as unknown as SVGElement;
    this.iconEdit = document.getElementById('icon-edit') as unknown as SVGElement;

    this.btnFmtBody = document.getElementById('btn-fmt-body') as HTMLButtonElement;

    this.btnFmtHeading = document.getElementById('btn-fmt-heading') as HTMLButtonElement;
    this.labelFmtHeading = document.getElementById('label-fmt-heading');
    this.menuFmtHeading = document.getElementById('menu-fmt-heading');

    this.btnFmtList = document.getElementById('btn-fmt-list') as HTMLButtonElement;
    this.labelFmtList = document.getElementById('label-fmt-list');
    this.menuFmtList = document.getElementById('menu-fmt-list');

    this.btnFmtFocus = document.getElementById('btn-fmt-focus') as HTMLButtonElement;
    this.labelFmtFocus = document.getElementById('label-fmt-focus');
    this.btnFmtLock = document.getElementById('btn-fmt-lock') as HTMLButtonElement;
    this.labelFmtLock = document.getElementById('label-fmt-lock');
    this.btnFmtTheme = document.getElementById('btn-fmt-theme') as HTMLButtonElement;
    this.labelFmtTheme = document.getElementById('label-fmt-theme');

    this.btnStats = document.getElementById('btn-stats') as HTMLButtonElement;
    this.statWordsCount = document.getElementById('stat-words-count');

    this.bindEvents();
    this.initAutoHide();
  }

  private initAutoHide(): void {
    // Top nav hover state
    this.topNav?.addEventListener('mouseenter', () => {
      this.isHoveringHUD = true;
      this.showHUD(0);
    });
    this.topNav?.addEventListener('mouseleave', () => {
      this.isHoveringHUD = false;
    });

    // Bottom format bar hover state
    this.formatBar?.addEventListener('mouseenter', () => {
      this.isHoveringHUD = true;
      this.showHUD(0);
    });
    this.formatBar?.addEventListener('mouseleave', () => {
      this.isHoveringHUD = false;
    });

    // Window mouse move: show HUD when mouse approaches top or bottom edge
    window.addEventListener('mousemove', (e: MouseEvent) => {
      const y = e.clientY;
      const windowHeight = window.innerHeight;
      if (y <= 48 || y >= windowHeight - 48) {
        this.showHUD(3000);
      }
    });

    // Scroll & Wheel: Reveal HUD during scrolling, auto-hide after 2s of inactivity
    window.addEventListener(
      'wheel',
      () => {
        this.showHUD(2000);
      },
      { passive: true }
    );

    // Focus out / Blur: Reveal HUD completely when user unfocuses editor
    window.addEventListener('blur', () => {
      this.isEditorFocused = false;
      this.showHUD(0);
    });

    // Focus in: Mark focused
    window.addEventListener('focus', () => {
      this.isEditorFocused = true;
    });

    // Typing / Keydown: Instantly hide HUD while actively writing
    window.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        // Ignore modifier keys alone
        if (['Meta', 'Control', 'Alt', 'Shift', 'CapsLock', 'Escape'].includes(e.key)) {
          return;
        }
        // If dropdown menu is open and Escape pressed, close menu and show HUD
        if (e.key === 'Escape' && this.isAnyMenuOpen()) {
          this.closeAllMenus();
          this.showHUD(2000);
          return;
        }
        // When user types text, immerse into writing by hiding HUD
        if (this.isEditorFocused && !this.isHoveringHUD && !this.isAnyMenuOpen()) {
          this.hideHUD();
        }
      },
      { passive: true }
    );
  }

  public showHUD(autoHideDelayMs: number = 0): void {
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }
    this.topNav?.classList.remove('iv-hud-hidden');
    this.formatBar?.classList.remove('iv-hud-hidden');

    if (autoHideDelayMs > 0 && this.isEditorFocused && !this.isHoveringHUD && !this.isAnyMenuOpen()) {
      this.autoHideTimeout = setTimeout(() => {
        this.hideHUD();
      }, autoHideDelayMs);
    }
  }

  public hideHUD(): void {
    if (this.isHoveringHUD || this.isAnyMenuOpen() || !this.isEditorFocused) {
      return;
    }
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }
    this.topNav?.classList.add('iv-hud-hidden');
    this.formatBar?.classList.add('iv-hud-hidden');
  }

  private isAnyMenuOpen(): boolean {
    return (
      (this.menuFmtHeading?.classList.contains('open') ?? false) ||
      (this.menuFmtList?.classList.contains('open') ?? false)
    );
  }

  private bindEvents(): void {
    // Window Traffic Light Controls
    this.dotRed?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onReopenDefault();
    });

    this.dotYellow?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onCloseTab();
    });

    this.dotGreen?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onToggleFullscreen();
    });

    // Top Preview Toggle Button
    this.btnPreview?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onTogglePreview();
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      this.closeAllMenus();
    });

    // Body (본문) Toggle Button
    this.btnFmtBody?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeAllMenus();
      this.callbacks.onInsertFormat('p');
      this.setBlockFormatActive('p');
    });

    // Heading Dropdown Toggle
    this.btnFmtHeading?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = this.menuFmtHeading?.classList.contains('open');
      this.closeAllMenus();
      if (!wasOpen) {
        this.menuFmtHeading?.classList.add('open');
      }
    });

    // List Dropdown Toggle
    this.btnFmtList?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = this.menuFmtList?.classList.contains('open');
      this.closeAllMenus();
      if (!wasOpen) {
        this.menuFmtList?.classList.add('open');
      }
    });

    // Dropdown Items Click Handlers (Guaranteed Immediate Execution!)
    const headingItems = this.menuFmtHeading?.querySelectorAll('.iv-dropdown-item');
    headingItems?.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.getAttribute('data-val');
        if (val) {
          this.callbacks.onInsertFormat(val);
          this.setBlockFormatActive(val);
        }
        this.closeAllMenus();
      });
    });

    const listItems = this.menuFmtList?.querySelectorAll('.iv-dropdown-item');
    listItems?.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.getAttribute('data-val');
        if (val) {
          this.callbacks.onInsertFormat(val);
          this.setBlockFormatActive(val);
        }
        this.closeAllMenus();
      });
    });

    // Bottom Format Bar Actions (Focus, Lock & Theme)
    this.btnFmtFocus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeAllMenus();
      this.callbacks.onToggleFocus();
    });

    this.btnFmtLock?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeAllMenus();
      this.callbacks.onToggleCenterLock();
    });

    this.btnFmtTheme?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeAllMenus();
      this.callbacks.onCycleTheme();
    });

    this.btnStats?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeAllMenus();
      this.callbacks.onOpenSettings();
    });

    // Inline Format Buttons (Bold, Italic, Strike)
    const formatButtons = document.querySelectorAll('.iv-fmt-item[data-fmt]');
    formatButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const fmt = (btn as HTMLElement).getAttribute('data-fmt');
        if (fmt) {
          e.preventDefault();
          this.callbacks.onInsertFormat(fmt);
        }
      });
    });
  }

  private closeAllMenus(): void {
    this.menuFmtHeading?.classList.remove('open');
    this.menuFmtList?.classList.remove('open');
  }

  public setBlockFormatActive(format: string): void {
    if (format === 'p') {
      this.btnFmtBody?.classList.add('active');
      this.btnFmtHeading?.classList.remove('active');
      this.btnFmtList?.classList.remove('active');
      if (this.labelFmtHeading) {
        this.labelFmtHeading.textContent = '제목 1';
      }
      if (this.labelFmtList) {
        this.labelFmtList.textContent = '목록';
      }
    } else if (format.startsWith('h')) {
      this.btnFmtBody?.classList.remove('active');
      this.btnFmtHeading?.classList.add('active');
      this.btnFmtList?.classList.remove('active');
      const num = format.replace('h', '');
      if (this.labelFmtHeading) {
        this.labelFmtHeading.textContent = `제목 ${num}`;
      }
    } else if (format === 'list' || format === 'numlist' || format === 'task' || format === 'numtask') {
      this.btnFmtBody?.classList.remove('active');
      this.btnFmtHeading?.classList.remove('active');
      this.btnFmtList?.classList.add('active');
      if (this.labelFmtList) {
        const labelMap: Record<string, string> = {
          list: '목록',
          numlist: '순서가 지정된 목록',
          task: '작업',
          numtask: '순서가 지정된 작업',
        };
        this.labelFmtList.textContent = labelMap[format] || '목록';
      }
    } else {
      this.btnFmtBody?.classList.remove('active');
      this.btnFmtHeading?.classList.remove('active');
      this.btnFmtList?.classList.remove('active');
    }
  }

  public setPreviewMode(isPreview: boolean): void {
    if (this.btnPreview) {
      if (isPreview) {
        this.btnPreview.classList.add('active');
        this.btnPreview.title = '편집 모드로 돌아가기 (Cmd+Shift+V)';
        if (this.iconPlay) {
          this.iconPlay.style.display = 'none';
        }
        if (this.iconEdit) {
          this.iconEdit.style.display = 'block';
        }
      } else {
        this.btnPreview.classList.remove('active');
        this.btnPreview.title = '마크다운 미리보기 모드 토글 (Cmd+Shift+V)';
        if (this.iconPlay) {
          this.iconPlay.style.display = 'block';
        }
        if (this.iconEdit) {
          this.iconEdit.style.display = 'none';
        }
      }
    }
  }

  public updateStats(stats: DocumentStats): void {
    if (this.statWordsCount) {
      this.statWordsCount.textContent = `${stats.words.toLocaleString()} 단어`;
    }
  }

  public updateControls(settings: IVWriterSettings): void {
    const focusText = !settings.focus.enabled
      ? '포커스: 끄기'
      : settings.focus.mode === 'sentence'
        ? '포커스: 문장'
        : settings.focus.mode === 'paragraph'
          ? '포커스: 문단'
          : '포커스: 줄';

    if (this.labelFmtFocus) {
      this.labelFmtFocus.textContent = focusText;
    }

    const isCenterLocked = settings.focus.anchor > 0.1;
    const lockText = isCenterLocked ? '타자기: 중앙' : '타자기: 자유';
    if (this.labelFmtLock) {
      this.labelFmtLock.textContent = lockText;
    }
    if (this.btnFmtLock) {
      if (isCenterLocked) {
        this.btnFmtLock.classList.add('active');
      } else {
        this.btnFmtLock.classList.remove('active');
      }
    }

    const themeCapitalized =
      settings.theme.preset.charAt(0).toUpperCase() + settings.theme.preset.slice(1);
    const themeText = `테마: ${themeCapitalized}`;

    if (this.labelFmtTheme) {
      this.labelFmtTheme.textContent = themeText;
    }
  }
}
