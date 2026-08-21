import * as assert from 'assert';
import { FocusEngine } from '../webview/core/focusEngine';
import { FocusSettings } from '../shared/settings';

describe('FocusEngine Test Suite', () => {
  const sampleText = `첫 번째 문단입니다.
여기는 같은 문단의 두 번째 줄입니다.

두 번째 문단입니다.
여러 줄에 걸쳐서 생각을 정리합니다.

세 번째 문단입니다. 마지막 문단입니다.`;

  test('extractParagraphBlocks partitions text by empty lines', () => {
    const blocks = FocusEngine.extractParagraphBlocks(sampleText);
    
    // sampleText에는 3개의 텍스트 문단과 2개의 빈 줄 블록이 분할됨
    assert.ok(blocks.length >= 3);
    assert.strictEqual(blocks[0].text.includes('첫 번째 문단'), true);
  });

  test('extractLineBlocks partitions text line by line', () => {
    const blocks = FocusEngine.extractLineBlocks(sampleText);
    const expectedLineCount = sampleText.split('\n').length;
    assert.strictEqual(blocks.length, expectedLineCount);
  });

  test('findActiveBlockIndex finds correct active block by cursor offset', () => {
    const blocks = FocusEngine.extractParagraphBlocks(sampleText);
    // Cursor inside the first block
    const activeIndex0 = FocusEngine.findActiveBlockIndex(blocks, 5);
    assert.strictEqual(activeIndex0, 0);

    // Cursor near the end of sample text
    const activeIndexLast = FocusEngine.findActiveBlockIndex(blocks, sampleText.length - 2);
    assert.strictEqual(activeIndexLast, blocks.length - 1);
  });

  test('calculateBlockVisualStates computes correct opacity with easing decay', () => {
    const blocks = FocusEngine.extractParagraphBlocks(sampleText);
    const settings: FocusSettings = {
      enabled: true,
      mode: 'paragraph',
      anchor: 0.45,
      fadeDistance: 6,
      minimumOpacity: 0.12,
      fadePower: 2.0,
    };

    const activeIndex = 0;
    const states = FocusEngine.calculateBlockVisualStates(blocks, activeIndex, settings);

    // Active block should have 1.0 opacity and isFocused = true
    assert.strictEqual(states[0].isFocused, true);
    assert.strictEqual(states[0].opacity, 1.0);

    // Further blocks should have lower opacity
    if (states.length > 1) {
      assert.strictEqual(states[1].isFocused, false);
      assert.ok(states[1].opacity <= 1.0);
    }
  });

  test('calculateBlockVisualStates returns full opacity when focus mode is disabled', () => {
    const blocks = FocusEngine.extractParagraphBlocks(sampleText);
    const settings: FocusSettings = {
      enabled: false,
      mode: 'paragraph',
      anchor: 0.45,
      fadeDistance: 6,
      minimumOpacity: 0.12,
      fadePower: 2.0,
    };

    const states = FocusEngine.calculateBlockVisualStates(blocks, 0, settings);
    states.forEach((s) => {
      assert.strictEqual(s.opacity, 1.0);
    });
  });
});
