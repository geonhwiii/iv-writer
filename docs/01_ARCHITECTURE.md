# 01. 시스템 아키텍처 (Architecture)

## 1. 개요

iV Writer는 VS Code의 **Custom Text Editor API (`vscode.CustomTextEditorProvider`)**와 **Webview**를 기반으로 작동하는 집중형 글쓰기 확장 프로그램입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code Host                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ IVWriterEditorProvider (CustomTextEditorProvider)     │  │
│  │  - TextDocument 생명주기 관리 (Dirty, Undo/Redo)       │  │
│  │  - File System I/O 및 Auto-Save 처리                  │  │
│  │  - VS Code Settings (`ivWriter.*`) 감시 및 전달       │  │
│  │  - Extension Commands (Toggle Focus, Zen Mode 등)     │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ postMessage (Bidirectional)   │
│                             ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Webview Context (iV Writer Renderer)                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Focus Engine (순수 연산: Cursor/Paragraph 계산)   │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │ Scroll Engine (Typewriter Smooth Scroll)        │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │ Editor Core (CodeMirror 6 Custom Facet/View)    │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │ UI & Theme Engine (Typography, Fading, HUD)     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 핵심 컴포넌트 구조

### 2.1 Extension Host (`src/extension/`)
- **`IVWriterEditorProvider`**:
  - `vscode.CustomTextEditorProvider` 구현체
  - `.md`, `.markdown`, `.txt` 파일에 대해 커스텀 에디터 뷰 바인딩
  - `vscode.TextDocument`의 버퍼 변경 사항을 Webview로 전달하고, Webview의 입력을 `vscode.WorkspaceEdit`으로 반영하여 VS Code 자체 실행 취소/다시 실행 및 저장 흐름 유지
- **`ConfigManager`**:
  - `workspace.onDidChangeConfiguration` 이벤트를 감지하여 `ivWriter.*` 설정 변경을 실시간으로 활성 Webview에 브로드캐스트
- **`CommandManager`**:
  - `iv-writer.toggleFocusMode`, `iv-writer.toggleZenMode`, `iv-writer.changeTheme`, `iv-writer.toggleHUD` 등 단축키 및 커맨드 등록

### 2.2 Webview UI & Engine (`src/webview/`)
- **`EditorCore`**:
  - 텍스트 입력, 커서 위치 추적, 텍스트 버퍼 유지
  - CodeMirror 6 기반으로 한국어 IME 조합, 라인/문단 토큰화, 가상 스크롤 렌더링을 담당
- **`FocusEngine`**:
  - 현재 커서 위치(문단, 줄)를 바탕으로 뷰포트 내 모든 라인/문단의 상대 거리와 Easing 기반 시각 상태(Opacity, Focus Line) 계산
  - UI 렌더러와 분리된 **순수 연산 모듈**로 테스트 용이성 극대화
- **`ScrollEngine`**:
  - 현재 포커스 라인의 수직 위치를 뷰포트의 `focusAnchor`(기본 45%)에 고정하기 위한 부드러운 타자기 스크롤(Typewriter Scroll) 좌표 계산 및 보간(Interpolation)
- **`HUDOverlay`**:
  - 상단 마우스 호버 시 자연스럽게 나타나는 미니멀 헤더 (단어수, 글자수, 읽기 예상 시간, 상태 인디케이터)
- **`ThemeManager`**:
  - Paper, Dark, Sepia, Midnight 및 사용자 커스텀 테마를 CSS Custom Property(변수)로 동적 주입

### 2.3 공통 타입 및 브릿지 (`src/shared/`)
- Webview와 Extension Host 간 통신에 사용되는 타입 안전(Type-safe) 메시지 프로토콜 정의

---

## 3. 통신 프로토콜 (Message Protocol)

Extension Host와 Webview 간에는 JSON 기반 메시지 인터페이스를 통해 비동기 통신을 수행합니다.

### 3.1 Host ➡️ Webview (`HostToWebviewMessage`)

```typescript
export type HostToWebviewMessage =
  | {
      type: 'INIT';
      payload: {
        documentUri: string;
        content: string;
        settings: IVWriterSettings;
        theme: string;
        isReadonly: boolean;
      };
    }
  | {
      type: 'DOC_CHANGED';
      payload: {
        content: string;
        version: number;
      };
    }
  | {
      type: 'CONFIG_CHANGED';
      payload: {
        settings: Partial<IVWriterSettings>;
      };
    }
  | {
      type: 'EXECUTE_COMMAND';
      payload: {
        command: 'toggleFocus' | 'toggleHUD' | 'cycleTheme' | 'setAnchor';
        params?: unknown;
      };
    };
```

### 3.2 Webview ➡️ Host (`WebviewToHostMessage`)

```typescript
export type WebviewToHostMessage =
  | {
      type: 'READY';
    }
  | {
      type: 'TEXT_EDIT';
      payload: {
        content: string;
        changes: Array<{
          from: number;
          to: number;
          text: string;
        }>;
      };
    }
  | {
      type: 'CURSOR_ACTIVITY';
      payload: {
        line: number;
        column: number;
        selectionLength: number;
      };
    }
  | {
      type: 'STATS_UPDATE';
      payload: {
        words: number;
        chars: number;
        readingTimeMin: number;
      };
    }
  | {
      type: 'LOG';
      payload: {
        level: 'info' | 'warn' | 'error';
        message: string;
      };
    };
```

---

## 4. 디렉토리 구조

```
iv-writer/
├── docs/                        # 상세 설계 및 가이드 문서
│   ├── README.md
│   ├── 01_ARCHITECTURE.md
│   ├── 02_FOCUS_ENGINE.md
│   ├── 03_EDITOR_AND_IME.md
│   ├── 04_DESIGN_SYSTEM_AND_THEMES.md
│   ├── 05_SETTINGS_AND_EXTENSIBILITY.md
│   └── 06_ROADMAP_AND_TESTING.md
├── src/
│   ├── extension/               # VS Code Extension Host
│   │   ├── extension.ts         # 엔트리 포인트
│   │   ├── editorProvider.ts    # CustomTextEditorProvider 구현체
│   │   ├── configManager.ts     # VS Code 설정 관리
│   │   └── commandManager.ts    # 단축키 및 명령 등록
│   ├── webview/                 # Webview UI 및 에디터 렌더러
│   │   ├── index.html           # Webview 템플릿
│   │   ├── main.ts              # Webview 엔트리 포인트
│   │   ├── core/                # 에디터 및 엔진 코어
│   │   │   ├── editor.ts        # CodeMirror 6 셋업 및 래퍼
│   │   │   ├── focusEngine.ts   # Focus 연산 엔진
│   │   │   ├── scrollEngine.ts  # Typewriter 스크롤 엔진
│   │   │   └── imeHandler.ts    # 한글 IME 조합 보정
│   │   ├── styles/              # CSS 디자인 시스템
│   │   │   ├── main.css         # 글로벌 리셋 및 레이아웃
│   │   │   ├── typography.css   # 폰트, 줄간격, 너비
│   │   │   ├── themes.css       # Paper, Dark, Sepia, Midnight
│   │   │   ├── focus.css        # Fading, Focus Zone 애니메이션
│   │   │   └── cursor.css       # 커서 애니메이션 (Fade, Pulse, Blink)
│   │   └── ui/                  # HUD 및 오버레이 컴포넌트
│   │       ├── hud.ts           # 상단 단어수 및 메타데이터 뷰
│   │       └── notification.ts  # 미니멀 알림 배너
│   └── shared/                  # 호스트-웹뷰 공통 타입 및 상수
│       ├── messages.ts          # IPC 메시지 타입 정의
│       ├── settings.ts          # 설정 인터페이스
│       └── constants.ts         # 기본값 상수 (45% 앵커, 720px 너비 등)
├── esbuild.js                   # Extension 및 Webview 번들링 스크립트
├── package.json                 # 익스텐션 매니페스트 및 기여점(Contributes)
└── tsconfig.json                # TypeScript 컴파일 설정
```

---

## 5. 빌드 및 패키징 전략

- **번들러**: `esbuild`
  - `src/extension/extension.ts` ➡️ `dist/extension.js` (Node 환경)
  - `src/webview/main.ts` + `src/webview/styles/*.css` ➡️ `dist/webview/index.js`, `dist/webview/index.css` (Browser 환경)
- **보안 (Content Security Policy)**:
  - Webview는 로컬 리소스만 로드할 수 있도록 엄격한 CSP (`vscode-webview-resource:`) 적용
  - 인라인 스크립트는 Nonce를 통해 안전하게 실행
