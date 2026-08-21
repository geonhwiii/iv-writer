import { EditorView } from '@codemirror/view';

export class ScrollEngine {
  private animationFrameId: number | null = null;
  private currentScrollTop: number = 0;
  private targetScrollTop: number = 0;
  private animationStartTime: number = 0;
  private startScrollTop: number = 0;
  private duration: number = 180; // ms
  private isUserScrolling: boolean = false;
  private userScrollTimeout: any = null;

  constructor(
    private readonly view: EditorView,
    private anchorRatio: number = 0.45,
    private enabled: boolean = true
  ) {
    this.currentScrollTop = this.view.scrollDOM.scrollTop;
    this.setupScrollListener();
  }

  public setAnchor(ratio: number): void {
    this.anchorRatio = Math.max(0.1, Math.min(0.9, ratio));
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private setupScrollListener(): void {
    this.view.scrollDOM.addEventListener('wheel', () => {
      this.isUserScrolling = true;
      if (this.userScrollTimeout) {
        clearTimeout(this.userScrollTimeout);
      }
      this.userScrollTimeout = setTimeout(() => {
        this.isUserScrolling = false;
      }, 500);
    }, { passive: true });
  }

  /**
   * 커서 위치를 뷰포트의 앵커(기본 45%) 위치로 정렬하는 스크롤 계산 및 실행
   */
  public scrollToCursor(immediate: boolean = false): void {
    if (!this.enabled || this.isUserScrolling) {
      return;
    }

    const cursorPos = this.view.state.selection.main.head;
    const coords = this.view.coordsAtPos(cursorPos);
    if (!coords) {
      return;
    }

    const scrollDOM = this.view.scrollDOM;
    const viewportHeight = scrollDOM.clientHeight;
    if (viewportHeight <= 0) {
      return;
    }

    const anchorY = viewportHeight * this.anchorRatio;
    const scrollRect = scrollDOM.getBoundingClientRect();
    
    // 현재 커서의 뷰포트 상단 기준 Y 위치
    const cursorRelativeY = coords.top - scrollRect.top;
    const offset = cursorRelativeY - anchorY;

    // 미세한 3px 이내 차이는 스크롤 스킵 (떨림 방지)
    if (Math.abs(offset) < 4 && !immediate) {
      return;
    }

    const newTargetScrollTop = Math.max(0, scrollDOM.scrollTop + offset);

    if (immediate) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      scrollDOM.scrollTop = newTargetScrollTop;
      this.currentScrollTop = newTargetScrollTop;
      return;
    }

    this.startSmoothScroll(newTargetScrollTop);
  }

  private startSmoothScroll(target: number): void {
    const scrollDOM = this.view.scrollDOM;
    this.startScrollTop = scrollDOM.scrollTop;
    this.targetScrollTop = target;
    this.animationStartTime = performance.now();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const step = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(1.0, elapsed / this.duration);
      
      // easeOutCubic Easing
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextScrollTop = this.startScrollTop + (this.targetScrollTop - this.startScrollTop) * ease;

      scrollDOM.scrollTop = nextScrollTop;
      this.currentScrollTop = nextScrollTop;

      if (progress < 1.0) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.animationFrameId = null;
        scrollDOM.scrollTop = this.targetScrollTop;
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
