# iV Writer 설계 문서 가이드

iV Writer(아이브이 라이터)는 VS Code 안에서 동작하는 **집중형 글쓰기 전용 에디터(Focus Writing Editor)** 확장 프로그램입니다.
iA Writer의 본질적인 글쓰기 철학을 계승하면서도 개발자 친화적인 확장성과 VS Code 생태계와의 완벽한 통합을 지향합니다.

---

## 📚 설계 문서 목차

1. **[01. 시스템 아키텍처 (Architecture)](./01_ARCHITECTURE.md)**
   - Extension Host와 Webview 간 통신 구조
   - `vscode.CustomTextEditorProvider` 기반 문서 동기화
   - 상태 관리(State Lifecycle) 및 파일 I/O

2. **[02. 포커스 및 스크롤 엔진 (Focus & Scroll Engine)](./02_FOCUS_ENGINE.md)**
   - Cursor-centered Focus 알고리즘 및 감쇠 수식(Easing)
   - Paragraph / Line / Sentence Focus 모드
   - Typewriter Scrolling (45% 고정 앵커) 및 물리적 스크롤 보정
   - Focus Line Indicator 시각화

3. **[03. 에디터 코어 및 IME/성능 설계 (Editor & IME & Performance)](./03_EDITOR_AND_IME.md)**
   - 에디터 엔진 기술 선정 (CodeMirror 6 기반 커스텀 뷰)
   - 한국어/동아시아어 IME 조합(Composition) 완벽 처리
   - 대용량 문서(10,000+ lines) 부분 렌더링 및 60fps 보장 전략
   - Undo/Redo 히스토리 관리

4. **[04. 디자인 시스템 및 테마 (Design System & Themes)](./04_DESIGN_SYSTEM_AND_THEMES.md)**
   - 글쓰기 전용 타이포그래피 (비례 서체/고정폭 서체, Max Width, 여백)
   - Writing Themes (Paper, Dark, Sepia, Midnight, Custom Theme)
   - 커서 디자인 (Bar, Block, Underline, Blink/Fade/Pulse 애니메이션)
   - Distraction-Free UI (Zen Mode 연동, 상단 Hover HUD, 실시간 Word Count)

5. **[05. 설정 및 확장성 (Settings & Extensibility)](./05_SETTINGS_AND_EXTENSIBILITY.md)**
   - `ivWriter.*` 네임스페이스 기반 VS Code `settings.json` 스키마
   - 키보드 단축키 (Keyboard-First)
   - Writing Presets (iA-like, Paper, Minimal, Dark Writer)
   - 향후 확장 (Git Context, Code Reference, Daily Notes, AI Assistant)

6. **[06. 개발 로드맵 및 테스트 시나리오 (Roadmap & Testing)](./06_ROADMAP_AND_TESTING.md)**
   - Phase 1 ~ 8 단계별 마일스톤
   - MVP 프로토타입 구현 범위
   - 글쓰기 경험 테스트 시나리오 (10분 연속 작성, 한국어 빠른 타이핑, 1만 줄 성능 검증)
