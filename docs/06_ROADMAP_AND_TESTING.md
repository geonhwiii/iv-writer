# 06. 개발 로드맵 및 테스트 시나리오 (Roadmap & Testing)

## 1. 단계별 개발 로드맵 (Phased Roadmap)

```
Phase 1: Writing Core ──> Phase 2: Focus & Scroll ──> Phase 3: Typography & Themes
       │                         │                                  │
       ▼                         ▼                                  ▼
Phase 4: Cursor & HUD ───> Phase 5: Polish & IME  ───> Phase 6: Dev & AI Expansions
```

### 🎯 Phase 1 — Writing Core (기본 에디터 뼈대)
- [ ] VS Code Extension 프로젝트 구조 설정 및 빌드 환경 정비 (`esbuild`)
- [ ] `CustomTextEditorProvider` 등록 (`.md`, `.txt` 전용 바인딩)
- [ ] Webview 템플릿 및 CodeMirror 6 기반 에디터 마운트
- [ ] 문서 불러오기, 텍스트 편집, 변경 사항 호스트 동기화 및 자동 저장
- [ ] VS Code 연동 기본 Undo / Redo 검증

### 🎯 Phase 2 — iV Writer Focus Experience (핵심 UX 엔진)
- [ ] **Focus Engine** 구현: 커서 위치 기준 문단/줄 분할 및 거리별 비선형 Easing Opacity 계산
- [ ] **Typewriter Scroll Engine** 구현: 뷰포트 45% 앵커 고정 및 부드러운 스크롤 애니메이션
- [ ] Paragraph Focus 및 Line Focus 모드 전환 지원
- [ ] Focus Line Indicator (은은한 백그라운드 틴트 및 보더) 적용

### 🎯 Phase 3 — Typography & Writing Themes (타이포그래피 및 테마)
- [ ] Paper, Dark, Sepia, Midnight 4대 테마 팔레트 및 CSS 변수 바인딩
- [ ] 글쓰기 최적 폰트 시스템(Font Family, Line Height 1.85, Max Width 720px)
- [ ] 사용자 커스텀 테마 지원 및 `settings.json` 실시간 연동

### 🎯 Phase 4 — Cursor & Minimal HUD (인터랙션 및 UI)
- [ ] 커서 커스터마이징 (Bar/Block/Underline, Fade/Pulse 애니메이션)
- [ ] 상단 Auto-Hide Header HUD (단어수, 글자수, 읽기 시간, 미니멀 설정 메뉴)
- [ ] Zen Mode 일괄 토글 명령 구현

### 🎯 Phase 5 — IME 완벽화 및 대용량 성능 최적화
- [ ] 한국어/동아시아어 IME 조합(composition) 중 커서 튐 / 글자 쪼개짐 제로화
- [ ] 10,000줄 이상 대용량 원고 가상 렌더링 성능 검증 (<16ms 입력 지연, 60fps)
- [ ] Selection(선택 영역) 및 Search(Cmd+F) 시 포커스 보정

### 🎯 Phase 6 — 개발자 특화 기능 및 AI 어시스턴트
- [ ] 소스 코드 참조 링킹 (`src/...` 클릭 점프)
- [ ] Git Branch 및 작업 상태 HUD 연계
- [ ] 데일리 노트 자동 생성 기능
- [ ] 인라인 AI 글쓰기 보조 (`Cmd + K` Rewrite/Grammar)

---

## 2. 1차 MVP 프로토타입 목표

> **첫 번째 프로토타입의 단 하나의 성공 기준:**
> "텍스트를 입력하면 커서가 화면 45% 위치에 조용히 고정되고, 지나간 문단이 자연스럽게 페이딩되어 10분 동안 화면의 존재를 잊고 글쓰기에만 온전히 몰입할 수 있는가?"

---

## 3. 핵심 글쓰기 경험 테스트 시나리오 (UX Test Suite)

기능적 단위 테스트 외에 실제 사람이 글을 쓰는 환경에서의 체감 품질을 정밀하게 테스트합니다.

### 🧪 Test 1 — 10분 연속 글쓰기 (Flow & Immersion Test)
- **절차**: 10분 동안 마우스 조작 없이 장문의 한국어 에세이를 연속 작성.
- **검증 항목**:
  - [ ] 시선이 화면 45% 앵커에 편안하게 머무르는가?
  - [ ] 문단이 넘어갈 때 스크롤이 시각적 방해 없이 호흡하듯 이동하는가?
  - [ ] 페이딩된 이전 문단들이 의식되지 않으면서도 필요할 때 주변 맥락으로 잘 읽히는가?

### 🧪 Test 2 — 고속 타이핑 및 버스트 입력 (Burst Typing Test)
- **절차**: 분당 500타 이상의 고속으로 줄바꿈과 텍스트를 연타 입력.
- **검증 항목**:
  - [ ] 스크롤 애니메이션 큐가 밀려 화면이 덜컹거리거나 지연이 발생하지 않는가?
  - [ ] 커서 위치가 순간적으로 위아래로 튀지 않고 매끄럽게 유지되는가?

### 🧪 Test 3 — 한국어 IME 조합 정밀 검증 (Korean IME Stress Test)
- **절차**: 받침이 많은 한글 복합 단어 및 긴 문장을 빠르게 입력하고 편집/삭제 반복.
- **검증 항목**:
  - [ ] `compositionupdate` 도중 글자가 분리되거나 커서가 한 글자 앞으로 튕기지 않는가?
  - [ ] 백스페이스 입력 시 한글 음절 단위 삭제가 부드럽게 처리되는가?
  - [ ] 조합 중인 마지막 글자 상태에서 엔터 입력 시 개행과 포커스 이동이 정확한가?

### 🧪 Test 4 — 10,000줄 대용량 원고 스트레스 테스트 (Large Document Benchmark)
- **절차**: 10,000줄 이상의 대용량 마크다운 문서를 열고 중간 지점에서 집중 편집.
- **검증 항목**:
  - [ ] 초기 렌더링 시간이 100ms 이내인가?
  - [ ] 타이핑 반응 지연이 16ms(1 frame) 미만인가?
  - [ ] 메모리 누수 없이 스크롤이 60fps를 일정하게 유지하는가?
