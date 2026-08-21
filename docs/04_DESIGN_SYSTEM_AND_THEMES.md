# 04. 디자인 시스템 및 테마 (Design System & Themes)

## 1. 디자인 철학

iV Writer는 **시각적 군더더기를 완전히 덜어내고, 오직 글과 생각에만 몰입할 수 있는 최고의 아날로그 종이 감성**을 디지털 화면에 구현합니다.

---

## 2. 타이포그래피 시스템 (Typography)

```
┌─────────────────────────────────────────────────────────────┐
│                          Max Width                          │
│               ◄──────────────────────────────►              │
│                                                             │
│       어제부터 이 프로젝트에 대해 계속 생각하고 있었다.            │
│       무엇을 만들 것인지보다 왜 만들고 싶은지가               │
│       더 중요했다.                                          │
│                                                             │
│       그래서 오늘은 처음부터 다시 생각해보기로 했다.          │
│       █                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 주요 타이포그래피 토큰 및 기본값

| 속성 | 기본값 | 선택 옵션 / 범위 | 비고 |
|:---|:---|:---|:---|
| **Font Family** | `iA Writer Duo`, `Pretendard`, `system-ui` | 사용자 지정 폰트 지원 | 한글 가독성 최적화 서체 권장 |
| **Font Size** | `19px` | `14px` ~ `32px` | 편안한 가독성 크기 |
| **Line Height** | `1.85` | `1.5` ~ `2.4` | 글쓰기 최적의 황금 행간 |
| **Letter Spacing** | `-0.01em` | `-0.05em` ~ `0.05em` | 자연스러운 자간 |
| **Paragraph Spacing** | `1.6em` | `1.0em` ~ `2.5em` | 문단과 문단 사이의 호흡 공간 |
| **Content Max Width** | `720px` | `560px`, `640px`, `720px`, `800px`, `960px`, `Full` | 시선 이동 피로도를 최소화하는 너비 |

---

## 3. 글쓰기 전용 테마 (Writing Themes)

VS Code의 기존 IDE 테마와 독립적으로 동작하는 **글쓰기 전용 4대 테마**와 **사용자 정의 테마(Custom Theme)**를 제공합니다.

### 3.1 4대 내장 테마 프리셋

#### 1. Paper (따뜻한 종이 감성 - 기본 라이트 모드)
- **Background**: `#F7F4EB` (따뜻한 천연 린넨 아이보리)
- **Foreground**: `#2C2825` (농도 짙은 목탄 그레이)
- **Faded Foreground**: `#A8A39D` (부드러운 연필 선)
- **Cursor**: `#1E88E5` 또는 `#2C2825` (선명한 딥 블루 or 목탄)
- **Focus Tint**: `rgba(214, 168, 95, 0.08)` (은은한 웜 앰버)

#### 2. Dark (눈의 피로를 덜어주는 현대적 다크)
- **Background**: `#18181A` (차분하고 깊은 매트 블랙)
- **Foreground**: `#E4E4E7` (선명하고 편안한 오프 화이트)
- **Faded Foreground**: `#52525B` (어둠 속에 가라앉은 먹색)
- **Cursor**: `#38BDF8` (청량한 스카이 블루)
- **Focus Tint**: `rgba(255, 255, 255, 0.04)`

#### 3. Sepia (고전 타자기와 클래식 북 느낌)
- **Background**: `#F3E9D2` (오래된 양장본 황동 종이색)
- **Foreground**: `#443627` (클래식 세피아 브라운)
- **Faded Foreground**: `#A39281`
- **Cursor**: `#C96868` (빈티지 로즈)
- **Focus Tint**: `rgba(180, 130, 80, 0.07)`

#### 4. Midnight (깊은 밤의 사색을 위한 딥 네이비)
- **Background**: `#0F172A` (깊은 심야의 나이트 네이비)
- **Foreground**: `#E2E8F0` (차분한 실버 블루)
- **Faded Foreground**: `#475569`
- **Cursor**: `#818CF8` (몽환적인 인디고)
- **Focus Tint**: `rgba(99, 102, 241, 0.06)`

### 3.2 CSS Custom Properties 구조

```css
:root {
  --iv-bg: #F7F4EB;
  --iv-fg: #2C2825;
  --iv-fg-faded: #A8A39D;
  --iv-cursor-color: #2C2825;
  --iv-focus-indicator: rgba(214, 168, 95, 0.08);
  --iv-selection-bg: rgba(66, 153, 225, 0.25);
  --iv-max-width: 720px;
  --iv-font-size: 19px;
  --iv-line-height: 1.85;
}
```

---

## 4. 커서 디자인 (Cursor Customization)

커서는 글쓴이의 생각이 찍히는 가장 핵심적인 인터랙티브 앵커입니다.

```
│  (Bar: 2px, 기본)      █  (Block)      _  (Underline)
```

### 4.1 커서 파라미터
- **Style**: `bar` (기본), `block`, `underline`
- **Width**: `1px`, `2px` (기본), `3px`, `4px`
- **Animation**:
  - `fade`: 호흡하듯 부드럽게 밝아졌다 어두워지는 감성적인 페이드 애니메이션 (추천)
  - `pulse`: 박동하듯 미세하게 커졌다 작아지는 펄스
  - `blink`: 클래식 깜빡임
  - `solid`: 깜빡이지 않는 고정형 커서
- **Speed**: `slow` (1200ms), `normal` (800ms), `fast` (500ms), `off`

---

## 5. 방해 요소 없는 UI (Distraction-Free HUD)

평소에는 일체의 버튼, 메뉴, 상태 표시줄이 화면에서 사라집니다.

```
[마우스가 화면 상단 60px 영역으로 진입할 때만 나타나는 헤더]
┌─────────────────────────────────────────────────────────────┐
│ ✦ iV Writer    •  1,248 단어  •  5,412 자  •  약 5분 읽기   ⚙ │
└─────────────────────────────────────────────────────────────┘
```

- **Auto-Hide Header HUD**:
  - 마우스 호버 시 0.2s 딜레이 후 부드러운 `translateY(0)` 및 `opacity: 1` 등장
  - 마우스가 벗어나면 1.5초 후 조용히 사라짐
- **Live Statistics**:
  - 한국어/영어 복합 단어 카운팅 (공백 포함 글자수, 공백 제외 글자수, 표준 성인 분당 독서속도 기준 예상 읽기 시간 계산)
- **Zen Mode 연동**:
  - 단축키 하나로 VS Code의 Activity Bar, Side Bar, Panel, Status Bar, Minimap, Tabs를 일괄 숨김/복원
