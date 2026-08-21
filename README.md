# iV Writer

> **내가 쓰고 있는 문장만 선명하게 남기고, 문서가 그 문장을 중심으로 조용히 움직이는 에디터.**

iV Writer는 VS Code 안에서 동작하는 **집중형 글쓰기 전용 에디터(Focus Writing Editor)** 확장 프로그램입니다.
iA Writer의 글쓰기 철학을 계승하여 일반적인 코드 에디터의 산만함을 제거하고, 사용자가 현재 작성하고 있는 생각과 문장에 완전히 몰입할 수 있는 환경을 제공합니다.

---

## ✨ 핵심 기능 (Features)

- **Cursor-centered Writing**: 화면의 기준점은 문서가 아니라 커서입니다.
- **Typewriter Scrolling**: 커서는 언제나 화면의 45%(설정 가능) 높이에 안정적으로 고정되며, 문서가 부드럽게 흐릅니다.
- **Focus Fading**: 현재 작성 중인 문단(Paragraph Focus) 또는 줄(Line Focus)만 100% 선명하게 남기고, 주변 텍스트는 비선형 Easing 곡선에 따라 자연스럽게 페이딩됩니다.
- **Selection 면제**: 텍스트를 드래그하거나 선택하면 해당 영역은 페이딩에서 면제되어 선명하게 유지됩니다.
- **한국어 IME 완벽 지원**: 빠른 한글 입력이나 복합 음절 조합 중에도 글자 깨짐이나 커서 튐이 전혀 없습니다.
- **글쓰기 전용 4대 테마**:
  - 📄 **Paper**: 따뜻한 린넨 종이 감성 (기본)
  - 🌙 **Dark**: 눈의 피로를 덜어주는 차분한 다크
  - 📜 **Sepia**: 고전 타자기와 클래식 북
  - 🌌 **Midnight**: 심야의 사색을 위한 딥 네이비
- **Writing Presets**: `iA-like`, `Dark Writer`, `Sepia Manuscript`, `Minimal Typewriter`, `Midnight Flow` 등 감성 프리셋 지원.
- **Distraction-Free Auto-Hide HUD**: 평소에는 모든 UI가 숨겨지며, 화면 상단에 마우스를 올릴 때만 단어수/글자수/읽기 예상 시간 HUD가 조용히 나타납니다.
- **개발자 친화 기능**:
  - 📅 **Daily Notes Generator**: `Cmd + Shift + D`로 오늘의 마크다운 일지/노트 자동 생성.
  - 🔗 **Code References**: 문서 내 소스 파일 경로(`src/...`) 클릭 시 VS Code에서 즉시 열기.
  - 📊 **Status Bar & Statistics**: 우측 하단 상태바 및 상세 단어/글자 통계 모달.
  - 🔍 **Integrated Find**: `Cmd + F`로 테마에 일체화된 미니멀 검색 패널 지원.

---

## 📚 상세 설계 문서

자세한 아키텍처 및 알고리즘 설계는 [`docs/`](./docs) 폴더를 참조하세요:

- [01. 시스템 아키텍처](./docs/01_ARCHITECTURE.md)
- [02. 포커스 및 스크롤 엔진](./docs/02_FOCUS_ENGINE.md)
- [03. 에디터 코어 및 IME/성능 설계](./docs/03_EDITOR_AND_IME.md)
- [04. 디자인 시스템 및 테마](./docs/04_DESIGN_SYSTEM_AND_THEMES.md)
- [05. 설정 및 확장성](./docs/05_SETTINGS_AND_EXTENSIBILITY.md)
- [06. 개발 로드맵 및 테스트 시나리오](./docs/06_ROADMAP_AND_TESTING.md)

---

## ⌨️ 단축키 (Keyboard Shortcuts)

| 단축키 (macOS) | 단축키 (Windows) | 동작 |
|:---|:---|:---|
| `Cmd + Shift + W` | `Ctrl + Shift + W` | iV Writer 에디터로 열기 |
| `Cmd + Shift + D` | `Ctrl + Shift + D` | 오늘의 데일리 노트 생성/열기 |
| `Cmd + /` | `Ctrl + /` | Focus Mode 토글 |
| `Cmd + K Cmd + T` | `Ctrl + K Ctrl + T` | 테마 순환 변경 (Paper ➡️ Dark ➡️ Sepia ➡️ Midnight) |
| `Cmd + K Cmd + Z` | `Ctrl + K Ctrl + Z` | Zen Mode 토글 |
| `Cmd + F` | `Ctrl + F` | 문서 내 검색 패널 호출 |

---

## ⚙️ 설정 (`settings.json`)

```json
{
  "ivWriter.focus.enabled": true,
  "ivWriter.focus.mode": "paragraph",
  "ivWriter.focus.anchor": 0.45,
  "ivWriter.theme.preset": "paper",
  "ivWriter.typography.maxWidth": 720,
  "ivWriter.typography.fontSize": 19,
  "ivWriter.typography.lineHeight": 1.85,
  "ivWriter.cursor.animation": "fade",
  "ivWriter.focusLine.style": "background"
}
```

---

## 📄 라이선스

MIT License
