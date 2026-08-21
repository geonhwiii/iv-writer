# 02. 포커스 및 스크롤 엔진 (Focus & Scroll Engine)

## 1. 개요

iV Writer의 핵심 차별점은 **Cursor-centered Focus**와 **Typewriter Scrolling**입니다.
문서가 화면에 고정되어 있고 사용자가 스크롤하는 기존 에디터와 달리, **현재 생각과 커서가 화면의 기준(Focus Zone)에 고정되고 문서가 부드럽게 흘러가도록** 만듭니다.

---

## 2. 포커스 상태 모델 (Focus State Model)

Focus Engine은 UI 렌더링에 의존하지 않는 순수 계산 계층입니다.

```typescript
export type FocusMode = 'paragraph' | 'line' | 'sentence';

export interface FocusSettings {
  enabled: boolean;
  mode: FocusMode;
  anchor: number;           // 0.2 ~ 0.7 (기본: 0.45 = 화면 높이의 45%)
  fadeDistance: number;     // fading이 최대로 적용되는 거리 (단위: 문단 or 줄)
  minimumOpacity: number;   // 최소 투명도 (기본: 0.12)
  fadePower: number;        // Easing 지수 (기본: 1.8 ~ 2.0)
  transitionDuration: number; // 포커스 이동 시 부드러운 전환 시간 (ms, 기본: 200)
}

export interface FocusState {
  currentLine: number;
  currentParagraph: number;
  currentSentence?: number;
  anchorY: number;          // 뷰포트 기준 목표 픽셀 Y 좌표
  activeRange: {
    from: number;
    to: number;
  };
}

export interface BlockVisualState {
  index: number;
  distance: number;         // 포커스 블록으로부터의 상대적 거리 (0 = 현재 포커스)
  opacity: number;          // 계산된 투명도 (0.0 ~ 1.0)
  isFocused: boolean;       // 현재 포커스 여부
}
```

---

## 3. 포커스 페이딩 (Focus Fading) 수학적 계산

### 3.1 페이딩 감쇠 공식
선형 감쇠(Linear attenuation) 대신 인간의 시각 인지에 자연스러운 비선형 파워 커브(Power Easing Curve)를 적용합니다.

$$\text{distance} = | \text{blockIndex} - \text{currentBlockIndex} |$$

$$\text{normalized} = \min\left(1.0, \frac{\text{distance}}{\text{fadeDistance}}\right)$$

$$\text{opacity} = \max\left(\text{minimumOpacity}, 1.0 - \text{Math.pow}(\text{normalized}, \text{fadePower}) \times (1.0 - \text{minimumOpacity})\right)$$

### 3.2 거리별 Opacity 프로파일 예시 (`fadeDistance = 6`, `minOpacity = 0.10`, `fadePower = 2.0`)

| 거리 ($d$) | 정규화 거리 ($d/6$) | Opacity | 시각적 느낌 |
|:---:|:---:|:---:|:---|
| **0** | 0.00 | **1.00** | 현재 작성 중인 텍스트 (완전 선명) |
| **1** | 0.16 | **0.97** | 직전/직후의 직접적 맥락 |
| **2** | 0.33 | **0.90** | 한 눈에 들어오는 주변 맥락 |
| **3** | 0.50 | **0.77** | 조용히 물러나 있는 이전 단락 |
| **4** | 0.67 | **0.59** | 배경으로 전환 시작 |
| **5** | 0.83 | **0.37** | 아스라한 잔상 |
| **6+** | 1.00 | **0.10** | 시야 방해를 제거한 최소 가독성 유지 |

---

## 4. 포커스 모드 분할 전략

### 4.1 Paragraph Focus (기본 추천 모드)
글쓰기에서는 개별 줄(Line)보다 생각의 완결 단위인 문단(Paragraph)이 자연스럽습니다.
- **문단 정의**: 빈 줄(`\n\n`)로 구분된 텍스트 덩어리.
- 여러 줄로 줄바꿈(Soft Wrap)된 긴 문단이라도 전체 문단이 동일하게 `opacity = 1.0`을 유지합니다.

### 4.2 Line Focus
시나리오 대본, 시, 짧은 메모 작성 등 문장 한 줄 한 줄에 초점을 맞추는 모드입니다.
- 커서가 위치한 개별 라인만 `1.0`, 윗줄과 아랫줄부터 점진적 페이딩.

### 4.3 Sentence Focus (향후 확장)
문단 내에서도 현재 작성 중인 마침표(`.`, `!`, `?`) 단위의 문장만 100% 선명하게 표시하고 문단 내 다른 문장들은 미세 페이딩(0.4~0.6) 처리.

---

## 5. 타자기 스크롤 엔진 (Typewriter Scroll Engine)

### 5.1 원리
에디터 뷰포트의 높이를 $H$라 할 때, 사용자가 설정한 `focusAnchor` 비율(기본 $0.45$)에 현재 커서 라인의 수직 중심 위치를 고정합니다.

$$\text{anchorY} = H \times \text{focusAnchor}$$

$$\text{targetScrollTop} = \text{cursorLineTop} - \text{anchorY} + \frac{\text{lineHeight}}{2}$$

```
┌──────────────────────────────────────────────┐ ── 0px (Viewport Top)
│ 이전에 작성한 내용 (Fading 0.10)                │
│ 이전에 작성한 내용 (Fading 0.37)                │
│                                              │
│ ───────────────────────────────────────────  │ ── Focus Anchor (45%)
│ 현재 작성하고 있는 문단 (Opacity 1.00)          │
│ █ (커서 위치)                                 │
│ ───────────────────────────────────────────  │
│                                              │
│ 앞으로 작성할 여백 공간 (Breathing Room)        │
└──────────────────────────────────────────────┘ ── H px (Viewport Bottom)
```

### 5.2 부드러운 스크롤 애니메이션 (Smooth Physics)
브라우저의 불연속적인 `scrollIntoView()`를 쓰지 않고, 프레임 기반 커스텀 Easing(기본 `easeOutCubic`) 보간을 적용합니다.

```typescript
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
```

- **타이핑 연타 최적화 (Burst Typing)**:
  사용자가 빠르게 타이핑할 때는 애니메이션 큐가 누적되어 화면이 덜컹거리지 않도록, 현재 진행 중인 애니메이션의 목표치(`targetScrollTop`)를 즉시 갱신하고 애니메이션 시작 시점을 부드럽게 이어받는 **Velocity Continuity** 알고리즘을 사용합니다.
- **하단 여백(Overscroll / Breathing Space)**:
  문서의 마지막 줄에서도 45% 앵커 위치에 커서가 올 수 있도록, 에디터 하단에 `(1.0 - focusAnchor) * ViewportHeight` 이상의 넉넉한 가상 패딩을 보장합니다.

---

## 6. 포커스 라인 인디케이터 (Focus Line Indicator)

현재 작성 위치를 명확히 인지할 수 있도록 은은한(Subtle) 시각적 표시를 지원합니다.

### 6.1 인디케이터 스타일 옵션
1. **`background`**: 현재 문단/줄 영역에 2~5% 수준의 부드러운 테마 강조 배경색(Tint) 적용
2. **`left-border`**: 텍스트 좌측 여백에 2px 너비의 부드러운 수직 바 배치
3. **`underline`**: 현재 라인 아래에 미세한 수평선
4. **`none`**: 인디케이터 없이 오직 페이딩만으로 시선 유도 (완전 미니멀)

> **디자인 원칙**: 포커스 라인은 텍스트 자체보다 눈에 띄어서는 안 되며, 시선이 자연스럽게 머무를 수 있는 무의식적 가이드 역할을 해야 합니다.
