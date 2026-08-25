import { EditorView } from '@codemirror/view';

export class ScrollEngine {
  private animationFrameId: number | null = null;
  private currentScrollTop: number = 0;
  private targetScrollTop: number = 0;
  private animationStartTime: number = 0;
  private startScrollTop: number = 0;
  private duration: number = 140; // ms for ultra-smooth responsive typewriter scrolling
  private isUserScrolling: boolean = false;
  private userScrollTimeout: any = null;

  constructor(
    private readonly view: EditorView,
    private anchorRatio: number = 0.50, // Screen vertical 50% center
    private enabled: boolean = true
  ) {
    this.currentScrollTop = this.view.scrollDOM.scrollTop;
    this.setupScrollListener();
  }

  public setAnchor(ratio: number): void {
    this.anchorRatio = Math.max(0.2, Math.min(0.8, ratio));
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resetUserScroll(): void {
    this.isUserScrolling = false;
    if (this.userScrollTimeout) {
      clearTimeout(this.userScrollTimeout);
      this.userScrollTimeout = null;
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
      }, 700);
    }, { passive: true });
  }

  /**
   * 커서 위치를 뷰포트의 정중앙(50%) 위치로 정렬하는 스크롤 계산 및 실행.
   * 엔터를 치면 새 줄이 정중앙에 오고 이전 줄들이 위로 스르륵 밀려 올라갑니다.
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

    // 미세한 2px 이내 차이는 떨림 방지
    if (Math.abs(offset) < 2 && !immediate) {
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
      
      // easeOutQuad Easing
      const ease = 1 - (1 - progress) * (1 - progress);
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
