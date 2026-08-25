import { EditorView } from '@codemirror/view';

export class ScrollEngine {
  private anchorRatio: number = 0.50; // 50% Screen vertical center
  private enabled: boolean = true;

  constructor(
    private readonly view: EditorView,
    anchorRatio: number = 0.50,
    enabled: boolean = true
  ) {
    this.anchorRatio = anchorRatio;
    this.enabled = enabled;
  }

  public setAnchor(ratio: number): void {
    this.anchorRatio = ratio;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public resetUserScroll(): void {
    // Reset
  }

  /**
   * 커서 위치를 뷰포트의 정중앙(50%) 위치로 즉각 정렬하는 타자기 스크롤.
   * 엔터를 치면 새 줄이 화면 50% 중앙에 오고 윗줄들이 위로 밀려 올라갑니다.
   */
  public scrollToCursor(_immediate: boolean = false): void {
    if (!this.enabled || this.anchorRatio < 0.1) {
      return;
    }

    requestAnimationFrame(() => {
      const cursorPos = this.view.state.selection.main.head;
      const coords = this.view.coordsAtPos(cursorPos);
      if (!coords) {
        return;
      }

      const scroller = this.view.scrollDOM;
      const scrollerRect = scroller.getBoundingClientRect();
      if (scrollerRect.height <= 0) {
        return;
      }

      // Cursor's current vertical position relative to scroller viewport
      const cursorY = coords.top - scrollerRect.top;
      const targetCenterY = scrollerRect.height * this.anchorRatio;
      const offset = cursorY - targetCenterY;

      if (Math.abs(offset) > 1.5) {
        scroller.scrollTop += offset;
      }
    });
  }

  public destroy(): void {
    // Cleanup
  }
}
