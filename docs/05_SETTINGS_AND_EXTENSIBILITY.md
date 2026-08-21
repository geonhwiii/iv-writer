# 05. 설정 및 확장성 (Settings & Extensibility)

## 1. VS Code 설정 스키마 (`settings.json`)

iV Writer의 모든 설정은 VS Code 표준 설정 시스템(`ivWriter.*`)과 완전히 연동되며, 실시간으로 에디터 뷰에 반영됩니다.

```json
{
  // ── [Focus Engine 설정] ──
  "ivWriter.focus.enabled": true,
  "ivWriter.focus.mode": "paragraph",
  "ivWriter.focus.anchor": 0.45,
  "ivWriter.focus.fadeDistance": 6,
  "ivWriter.focus.minimumOpacity": 0.12,
  "ivWriter.focus.fadePower": 2.0,
  "ivWriter.focus.transitionDuration": 200,

  // ── [타이포그래피 및 레이아웃] ──
  "ivWriter.typography.fontFamily": "system-ui, -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif",
  "ivWriter.typography.fontSize": 19,
  "ivWriter.typography.lineHeight": 1.85,
  "ivWriter.typography.letterSpacing": -0.01,
  "ivWriter.typography.paragraphSpacing": 1.6,
  "ivWriter.typography.maxWidth": 720,

  // ── [테마 및 색상] ──
  "ivWriter.theme.preset": "paper",
  "ivWriter.theme.custom": {
    "background": "#F7F4EB",
    "foreground": "#2C2825",
    "fadedForeground": "#A8A39D",
    "cursor": "#2C2825",
    "focusLine": "rgba(214, 168, 95, 0.08)"
  },

  // ── [커서 설정] ──
  "ivWriter.cursor.style": "bar",
  "ivWriter.cursor.width": 2,
  "ivWriter.cursor.animation": "fade",
  "ivWriter.cursor.speed": "normal",

  // ── [포커스 라인 인디케이터] ──
  "ivWriter.focusLine.enabled": true,
  "ivWriter.focusLine.style": "background",
  "ivWriter.focusLine.opacity": 0.04,

  // ── [에디터 동작 및 자동저장] ──
  "ivWriter.editor.autoSaveDebounce": 500,
  "ivWriter.editor.hideHeaderHUD": true,
  "ivWriter.editor.enableZenModeOnOpen": false
}
```

---

## 2. 키보드 단축키 (Keyboard-First Navigation)

마우스에 손을 대지 않고 글쓰기 흐름을 제어할 수 있는 직관적인 단축키 체계를 제공합니다.

| 단축키 (macOS) | 단축키 (Windows/Linux) | 명령 ID | 동작 설명 |
|:---|:---|:---|:---|
| `Cmd + Shift + W` | `Ctrl + Shift + W` | `iv-writer.openWriterMode` | 현재 활성 마크다운/텍스트 문서를 iV Writer 모드로 열기 |
| `Cmd + /` | `Ctrl + /` | `iv-writer.toggleFocusMode` | 포커스 모드 (Paragraph ↔ Off) 즉시 토글 |
| `Cmd + Shift + F` | `Ctrl + Shift + F` | `iv-writer.cycleFocusMode` | Focus Mode 순환 (Paragraph ➡️ Line ➡️ Sentence ➡️ Off) |
| `Cmd + K Cmd + Z` | `Ctrl + K Ctrl + Z` | `iv-writer.toggleZenMode` | Zen Mode (모든 사이드바/패널 일괄 숨김) 토글 |
| `Cmd + K Cmd + T` | `Ctrl + K Ctrl + T` | `iv-writer.cycleTheme` | 테마 변경 (Paper ➡️ Dark ➡️ Sepia ➡️ Midnight) |
| `Cmd + F` | `Ctrl + F` | `iv-writer.find` | 문서 내 검색 모달 호출 (검색 매칭 시 포커스 유지) |

---

## 3. 글쓰기 프리셋 (Writing Presets)

복잡한 설정 없이 원클릭으로 이상적인 글쓰기 환경을 불러올 수 있는 내장 프리셋을 지원합니다.

1. **iA-like (원작의 정수)**:
   - Font: `iA Writer Duo` 스타일, Paragraph Focus, 720px 너비, 45% 앵커, Fade 커서.
2. **Paper (따뜻한 원고지)**:
   - Paper 테마, 세리프/따뜻한 산세리프 폰트, 넓은 줄간격(2.0), 은은한 앰버 포커스 인디케이터.
3. **Dark Writer (심야 몰입)**:
   - Deep Dark 테마, 펄스 블루 커서, Line Focus, 640px 좁은 칼럼.
4. **Minimal Typewriter (완전한 타자기)**:
   - Fading 최소화, 50% 중앙 고정 앵커, Block 커서, Solid Blink.

---

## 4. 개발자를 위한 글쓰기 확장 기능 (Developer-Oriented Extensions)

### 4.1 코드 파일 참조 (Code References)
문서 작성 중 프로젝트 내부 소스 코드를 언급할 때 자동 링킹 및 점프를 지원합니다.
- 예: `src/auth/session.ts` 또는 `[auth logic](file:///src/auth/session.ts#L40)`
- 클릭 또는 단축키 이동 시 VS Code의 분할 뷰나 백그라운드 탭으로 즉시 열기.

### 4.2 Git 컨텍스트 연동 (Git-aware Writing)
- 상단 HUD에 현재 Git Branch 및 변경 상태(`feature/auth-refactor • 3 commits ahead`)를 미니멀하게 표시.
- 작업 로그 및 커밋 메시지 초안을 현재 문서에서 바로 추출하는 편의 기능.

### 4.3 데일리 노트 및 TIL 자동화 (Daily Notes Generator)
- `Cmd + Shift + D` 입력 시 오늘 날짜의 마크다운 파일(`notes/YYYY-MM-DD.md`)을 템플릿과 함께 자동 생성하여 즉시 iV Writer 모드로 진입.

### 4.4 AI 글쓰기 보조 (AI Writing Assistant - 향후)
- 집중을 방해하는 챗봇 창 대신, 문단 단위 인라인 제안(`Cmd + K`):
  - 문장 다듬기(Improve), 간결하게(Shorten), 문법/맞춤법 검사(Grammar), 톤 변경(Tone).
  - 변경 전/후 Diff를 인라인으로 확인하고 `Tab`(수락) 또는 `Esc`(거절)로 처리.
