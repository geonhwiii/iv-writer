import { FocusSettings, FocusMode } from '../../shared/settings';

export interface BlockRange {
  index: number;
  from: number;
  to: number;
  text: string;
}

export interface BlockVisualState {
  index: number;
  from: number;
  to: number;
  distance: number;
  opacity: number;
  isFocused: boolean;
}

export class FocusEngine {
  /**
   * 전체 텍스트에서 빈 줄(\n\n)을 기준으로 문단(Paragraph) 블록들을 추출합니다.
   */
  public static extractParagraphBlocks(docText: string): BlockRange[] {
    const blocks: BlockRange[] = [];
    const lines = docText.split('\n');
    let currentBlockFrom = 0;
    let currentBlockLines: string[] = [];
    let blockIndex = 0;
    let charOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBlank = line.trim().length === 0;

      if (isBlank) {
        if (currentBlockLines.length > 0) {
          const blockContent = currentBlockLines.join('\n');
          blocks.push({
            index: blockIndex++,
            from: currentBlockFrom,
            to: currentBlockFrom + blockContent.length,
            text: blockContent,
          });
          currentBlockLines = [];
        }
        // Blank line itself is an empty block
        blocks.push({
          index: blockIndex++,
          from: charOffset,
          to: charOffset + line.length,
          text: line,
        });
        currentBlockFrom = charOffset + line.length + 1;
      } else {
        if (currentBlockLines.length === 0) {
          currentBlockFrom = charOffset;
        }
        currentBlockLines.push(line);
      }

      charOffset += line.length + 1; // +1 for '\n'
    }

    if (currentBlockLines.length > 0) {
      const blockContent = currentBlockLines.join('\n');
      blocks.push({
        index: blockIndex++,
        from: currentBlockFrom,
        to: currentBlockFrom + blockContent.length,
        text: blockContent,
      });
    }

    return blocks;
  }

  /**
   * 줄(Line) 단위 블록들을 추출합니다.
   */
  public static extractLineBlocks(docText: string): BlockRange[] {
    const blocks: BlockRange[] = [];
    const lines = docText.split('\n');
    let charOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      blocks.push({
        index: i,
        from: charOffset,
        to: charOffset + line.length,
        text: line,
      });
      charOffset += line.length + 1;
    }

    return blocks;
  }

  /**
   * 커서 위치(cursorPos)가 속한 활성 블록 인덱스를 찾습니다.
   */
  public static findActiveBlockIndex(blocks: BlockRange[], cursorPos: number): number {
    if (blocks.length === 0) {
      return 0;
    }

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (cursorPos >= b.from && cursorPos <= b.to) {
        return i;
      }
    }

    // 커서가 마지막 위치에 있는 경우
    if (cursorPos >= blocks[blocks.length - 1].to) {
      return blocks.length - 1;
    }

    return 0;
  }

  /**
   * 비선형 Easing Curve 기반으로 각 블록의 투명도(Opacity)를 계산합니다.
   */
  public static calculateBlockVisualStates(
    blocks: BlockRange[],
    activeBlockIndex: number,
    settings: FocusSettings
  ): BlockVisualState[] {
    if (!settings.enabled) {
      return blocks.map((b) => ({
        index: b.index,
        from: b.from,
        to: b.to,
        distance: 0,
        opacity: 1.0,
        isFocused: b.index === activeBlockIndex,
      }));
    }

    const { fadeDistance, minimumOpacity, fadePower } = settings;

    return blocks.map((b) => {
      const distance = Math.abs(b.index - activeBlockIndex);
      const isFocused = distance === 0;

      let opacity = 1.0;
      if (!isFocused) {
        const normalized = Math.min(1.0, distance / fadeDistance);
        // Easing decay: 1.0 - (normalized ^ power) * (1.0 - minOpacity)
        opacity = Math.max(
          minimumOpacity,
          1.0 - Math.pow(normalized, fadePower) * (1.0 - minimumOpacity)
        );
      }

      return {
        index: b.index,
        from: b.from,
        to: b.to,
        distance,
        opacity: Number(opacity.toFixed(3)),
        isFocused,
      };
    });
  }
}
