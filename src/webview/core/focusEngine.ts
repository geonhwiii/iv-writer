import { FocusMode } from '../../shared/settings';

export interface TextRange {
  from: number;
  to: number;
}

export class FocusEngine {
  /**
   * 텍스트에서 마침표(., !, ?), 개행문자(\n), 한국어 마침부호를 기준으로
   * 정밀한 문장(Sentence) 단위 범위들을 추출합니다. (iA Writer 시그니처)
   */
  public static extractSentenceRanges(text: string): TextRange[] {
    const ranges: TextRange[] = [];
    if (!text || text.length === 0) {
      return [{ from: 0, to: 0 }];
    }

    let start = 0;
    const len = text.length;

    for (let i = 0; i < len; i++) {
      const char = text[i];

      // 개행 문자는 무조건 문장 경계
      if (char === '\n') {
        if (i > start) {
          ranges.push({ from: start, to: i });
        }
        start = i + 1;
        continue;
      }

      // 마침표, 물음표, 느낌표 판별
      if (char === '.' || char === '!' || char === '?' || char === '…') {
        // 다음 글자가 공백, 개행, 따옴표이거나 문자열 끝인 경우 문장 종결로 처리
        const nextChar = i + 1 < len ? text[i + 1] : '';
        const isEnd =
          i + 1 >= len ||
          nextChar === ' ' ||
          nextChar === '\t' ||
          nextChar === '\n' ||
          nextChar === '"' ||
          nextChar === "'" ||
          nextChar === ')' ||
          nextChar === '」' ||
          nextChar === '”';

        if (isEnd) {
          // 따옴표나 닫는 괄호가 바로 뒤에 붙은 경우 포함
          let end = i + 1;
          while (end < len && (text[end] === '"' || text[end] === "'" || text[end] === ')' || text[end] === '」' || text[end] === '”')) {
            end++;
          }
          ranges.push({ from: start, to: end });
          // 다음 문장의 시작은 공백을 건너뛴 위치
          while (end < len && (text[end] === ' ' || text[end] === '\t')) {
            end++;
          }
          start = end;
          i = end - 1;
        }
      }
    }

    if (start < len) {
      ranges.push({ from: start, to: len });
    }

    return ranges.length > 0 ? ranges : [{ from: 0, to: len }];
  }

  /**
   * 빈 줄(\n\n)을 기준으로 문단(Paragraph) 범위들을 추출합니다.
   */
  public static extractParagraphRanges(text: string): TextRange[] {
    const ranges: TextRange[] = [];
    if (!text || text.length === 0) {
      return [{ from: 0, to: 0 }];
    }

    const lines = text.split('\n');
    let currentStart = 0;
    let inParagraph = false;
    let charOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBlank = line.trim().length === 0;

      if (!isBlank) {
        if (!inParagraph) {
          currentStart = charOffset;
          inParagraph = true;
        }
      } else {
        if (inParagraph) {
          ranges.push({ from: currentStart, to: charOffset - 1 });
          inParagraph = false;
        }
      }

      charOffset += line.length + 1; // +1 for '\n'
    }

    if (inParagraph) {
      ranges.push({ from: currentStart, to: text.length });
    }

    return ranges.length > 0 ? ranges : [{ from: 0, to: text.length }];
  }

  /**
   * 줄(\n) 단위 범위들을 추출합니다.
   */
  public static extractLineRanges(text: string): TextRange[] {
    const ranges: TextRange[] = [];
    if (!text || text.length === 0) {
      return [{ from: 0, to: 0 }];
    }

    const lines = text.split('\n');
    let charOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      ranges.push({
        from: charOffset,
        to: charOffset + line.length,
      });
      charOffset += line.length + 1;
    }

    return ranges;
  }

  /**
   * 커서 위치가 속한 활성 Range를 찾습니다.
   */
  public static findActiveRange(ranges: TextRange[], cursorPos: number): TextRange {
    if (ranges.length === 0) {
      return { from: 0, to: 0 };
    }

    for (const r of ranges) {
      if (cursorPos >= r.from && cursorPos <= r.to) {
        return r;
      }
    }

    // 커서가 마지막에 있는 경우
    if (cursorPos >= ranges[ranges.length - 1].to) {
      return ranges[ranges.length - 1];
    }

    return ranges[0];
  }

  /**
   * 전체 텍스트에서 활성 Range를 제외한 나머지 딤(Dimmed) 영역들의 범위를 계산합니다.
   */
  public static calculateDimmedRanges(totalLength: number, activeRange: TextRange): TextRange[] {
    const dimmed: TextRange[] = [];

    // 1. 활성 범위 이전 영역
    if (activeRange.from > 0) {
      dimmed.push({ from: 0, to: activeRange.from });
    }

    // 2. 활성 범위 이후 영역
    if (activeRange.to < totalLength) {
      dimmed.push({ from: activeRange.to, to: totalLength });
    }

    return dimmed;
  }
}
