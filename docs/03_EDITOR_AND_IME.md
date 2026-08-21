# 03. 에디터 코어 및 IME/성능 설계 (Editor, IME & Performance)

## 1. 에디터 엔진 기술 선정

집중형 글쓰기 에디터(iV Writer)의 렌더러 코어를 위해 세 가지 아키텍처 방안을 검토했습니다.

| 항목 | A. 순수 `contenteditable` | B. Monaco Editor | **C. CodeMirror 6 (채택)** |
|:---|:---|:---|:---|
| **장점** | 구조가 가볍고 커스텀 DOM 제어가 가장 자유로움 | VS Code와의 높은 친화성, 풍부한 기본 기능 | 모듈화 구조, 경량성, 완벽한 커스텀 ViewPlugin/Facet, 현대적인 IME 제어 |
| **단점** | 브라우저별 불일치, 복잡한 Undo/Redo 스택, 긴 문서 성능 저하 | IDE 냄새가 강함, 글쓰기 전용 레이아웃/Fading 애니메이션 커스터마이징이 매우 까다로움 | 약간의 초기 러닝커브 |
| **결론** | 프로토타입 참고용 | 부적합 | **최적의 아키텍처로 채택** |

### CodeMirror 6 채택 이유
1. **불변 상태(Immutable State) 및 트랜잭션 모델**: 모든 텍스트 변경과 선택 영역 변경이 `Transaction`을 통해 명시적으로 추적되므로, VS Code의 `vscode.TextDocument`와 1:1 양방향 정밀 동기화가 용이합니다.
2. **뷰 가상화(View Virtualization)**: 10,000줄 이상의 방대한 원고에서도 현재 뷰포트 주변의 DOM만 효율적으로 유지하여 60fps와 <16ms의 초저지연 타이핑을 보장합니다.
3. **데코레이션(Decoration) 및 ViewPlugin**: 줄/문단 단위의 Opacity 페이딩, Focus Line 배경, 커스텀 커서 스타일을 CodeMirror 6의 `ViewPlugin` 및 `Decoration` 시스템으로 우아하게 결합할 수 있습니다.

---

## 2. 한국어/동아시아어 IME 조합(Composition) 완벽 처리

글쓰기 앱에서 한국어 입력 시 글자가 분리되거나(`ㅎㅏㄴㄱㅡㄹ`), 스크롤이나 포커스 계산 도중 조합이 강제 종료되어 커서가 튀는 현상은 치명적인 결함입니다.

```
[사용자 키 입력: '한']
  │
  ├─> compositionstart : IME 조합 모드 활성화 (isComposing = true)
  │     └─ 포커스 연산 락(Lock) 또는 조합 중인 텍스트 경계 보호
  │
  ├─> compositionupdate : 임시 글자 조합 중 ('ㅎ' -> '하' -> '한')
  │     └─ Scroll Engine: 앵커 보정 시 조합 중인 DOM 노드를 강제 재배치하지 않음
  │
  └─> compositionend : 최종 글자 확정 (isComposing = false)
        └─ Document State 최종 동기화 및 Focus/Scroll 타겟 리프레시
```

### 2.1 주요 방어 설계
1. **조합 중 DOM 재렌더링 방지**:
   - `compositionstart`부터 `compositionend`까지는 CodeMirror의 에디터 DOM 트리 변경이나 Decorator 전면 재계산을 억제하고, 오직 CSS 레이어의 Opacity 필터만 부드럽게 유지합니다.
2. **Backtrack 방지 커서 좌표 추출**:
   - 한글 조합 중 `editorView.coordsAtPos()` 호출 시 브라우저별(WebKit/Chromium) 사소한 캐럿 위치 오차를 보정하여 스크롤 앵커가 위아래로 미세하게 떨리는 현상(Jitter)을 방지합니다.
3. **Undo/Redo 경계 보호**:
   - IME 조합 단위가 중간에 끊겨서 비정상적인 Undo 히스토리가 생성되지 않도록 트랜잭션 어노테이션을 격리합니다.

---

## 3. 대용량 문서 성능 및 렌더링 최적화

### 3.1 성능 목표
- **문서 크기**: 10,000+ 라인 (소설 1권 분량, 30만 자 이상)
- **타이핑 지연 (Typing Latency)**: **< 16ms** (1 프레임 이내 반응)
- **스크롤 애니메이션 프레임**: **60fps 고정**

### 3.2 최적화 기법
1. **React State를 통한 문서 전체 리렌더링 금지**:
   - 에디터 본체는 React의 VDOM 렌더 사이클에서 완전히 분리되어 독립된 CodeMirror 6 인스턴스로 구동됩니다.
   - 단어 수 통계, HUD, 테마 스위처 등 주변 UI만 경량 상태 관리로 바인딩합니다.
2. **뷰포트 기반 증분 계산 (Incremental Viewport Calculation)**:
   - 10,000줄 전체의 Opacity를 매 프레임 계산하지 않고, 현재 화면에 보이는 `fromLine` ~ `toLine` (약 50~100줄) 범위에 대해서만 Focus Engine의 `BlockVisualState`를 슬라이싱하여 계산합니다.
3. **CSS GPU 하드웨어 가속**:
   - Fading 및 스크롤 전환에 `transform: translate3d(...)` 및 `will-change: opacity`를 전략적으로 활용하여 CPU 병목을 제거합니다.

---

## 4. Undo / Redo 및 VS Code 통합

1. **VS Code와의 히스토리 연계**:
   - 에디터 내에서의 `Cmd + Z` / `Cmd + Shift + Z`는 로컬 에디터 스택뿐 아니라 VS Code Host의 `WorkspaceEdit` 시스템과 긴밀히 통신하여, 파일 외부 수정이나 다른 탭과의 교차 작업에서도 히스토리가 손상되지 않도록 보장합니다.
2. **자동 저장(Auto-save) 디바운스**:
   - 사용자의 타이핑 중단을 감지하여 500ms(설정 가능) 디바운스 타이머 후 호스트로 변경분을 전송하여 디스크에 조용히 저장합니다. 사용자는 저장을 의식할 필요가 없습니다.
