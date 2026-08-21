import * as assert from 'assert';
import { FocusEngine } from '../webview/core/focusEngine';

describe('FocusEngine Test Suite (iA Writer Focus Algorithms)', () => {
  const sampleText = `첫 번째 문장입니다. 두 번째 문장입니다! 세 번째 문장인가요?

새로운 문단입니다. 여기도 또 다른 문장입니다.`;

  test('extractSentenceRanges accurately separates sentences by punctuation', () => {
    const ranges = FocusEngine.extractSentenceRanges(sampleText);
    assert.ok(ranges.length >= 5);

    // 첫 번째 문장 검증
    const s1 = sampleText.slice(ranges[0].from, ranges[0].to);
    assert.strictEqual(s1.includes('첫 번째 문장입니다.'), true);

    // 두 번째 문장 검증
    const s2 = sampleText.slice(ranges[1].from, ranges[1].to);
    assert.strictEqual(s2.includes('두 번째 문장입니다!'), true);
  });

  test('extractParagraphRanges accurately separates paragraphs by empty lines', () => {
    const ranges = FocusEngine.extractParagraphRanges(sampleText);
    assert.strictEqual(ranges.length, 2);

    const p1 = sampleText.slice(ranges[0].from, ranges[0].to);
    assert.strictEqual(p1.includes('첫 번째 문장입니다.'), true);

    const p2 = sampleText.slice(ranges[1].from, ranges[1].to);
    assert.strictEqual(p2.includes('새로운 문단입니다.'), true);
  });

  test('findActiveRange correctly locates active sentence by cursor position', () => {
    const ranges = FocusEngine.extractSentenceRanges(sampleText);
    
    // 커서가 첫 번째 문장 안에 있을 때
    const activeRange0 = FocusEngine.findActiveRange(ranges, 5);
    assert.strictEqual(activeRange0.from, ranges[0].from);
    assert.strictEqual(activeRange0.to, ranges[0].to);

    // 커서가 두 번째 문장 안에 있을 때
    const secondSentenceStart = ranges[1].from + 2;
    const activeRange1 = FocusEngine.findActiveRange(ranges, secondSentenceStart);
    assert.strictEqual(activeRange1.from, ranges[1].from);
    assert.strictEqual(activeRange1.to, ranges[1].to);
  });

  test('calculateDimmedRanges creates exact outer ranges for dimming', () => {
    const activeRange = { from: 10, to: 20 };
    const totalLength = 50;
    const dimmed = FocusEngine.calculateDimmedRanges(totalLength, activeRange);

    assert.strictEqual(dimmed.length, 2);
    assert.deepStrictEqual(dimmed[0], { from: 0, to: 10 });
    assert.deepStrictEqual(dimmed[1], { from: 20, to: 50 });
  });
});
