<p align="center">
  <img src="assets/logo.png" width="120" alt="iV Writer Logo" />
</p>

<h1 align="center">iV Writer</h1>

<p align="center">
  <em>iA Writer 스타일의 타이포그래피와 몰입형 글쓰기 환경을 제공하는 VS Code 마크다운 에디터.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square&logo=visual-studio-code&logoColor=white" alt="VS Code" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
</p>

---

## ✨ 주요 기능

- **포커스 모드 (Focus Mode)**: 현재 작성 중인 문장 또는 문단만 또렷하게 남기고, 주변 문장은 자연스럽게 딤 처리합니다. (`Cmd + /`)
- **타자기 모드 (Typewriter Center Lock)**: 커서를 항상 화면 중앙(50%)에 안정적으로 고정하여 시선 이동 없이 편안하게 작성합니다.
- **헤딩 마크다운 아웃덴트 (Outdented Headings)**: 헤딩 기호(`#`, `##` 등)가 본문 좌측 여백으로 분리 배치되어, 모든 텍스트가 시작선에 완벽하게 수직 1열 정렬됩니다.
- **스마트 자동 숨김 (Auto-Hide HUD)**: 글을 타이핑하는 동안에는 상하단 툴바가 자동으로 숨겨져 몰입을 돕고, 스크롤하거나 창에서 포커스가 벗어나면 다시 나타납니다.
- **서식 드롭다운 바**: 본문, 제목(H1~H6), 목록(글머리 기호, 순서형, 체크리스트), 볼드, 이탈릭, 취소선 서식을 마우스로 손쉽게 지정할 수 있습니다.
- **마크다운 미리보기 (Markdown Preview)**: 우측 상단 재생 버튼 또는 `Cmd + Shift + V`를 눌러 렌더링된 마크다운 결과물을 즉시 확인합니다.
- **4가지 글쓰기 테마**:
  - 📄 **Paper**: 따뜻한 린넨 종이 감성 (기본)
  - 🌙 **Dark**: 눈의 피로를 덜어주는 차분한 다크
  - 📜 **Sepia**: 고전 타자기 감성의 클래식 세피아
  - 🌌 **Midnight**: 딥 네이비 감성의 심야 테마
- **한국어 IME 완벽 지원**: 빠른 한글 입력이나 복합 음절 조합 시 글자 깨짐 및 커서 튐 없이 부드럽게 동작합니다.
- **데일리 노트 생성**: `Cmd + Shift + D`로 오늘의 마크다운 일지/노트를 자동 생성합니다.

---

## ⌨️ 단축키

| 단축키 (macOS)    | 단축키 (Windows)   | 동작                                    |
| :---------------- | :----------------- | :-------------------------------------- |
| `Cmd + Shift + W` | `Ctrl + Shift + W` | iV Writer 에디터로 열기                 |
| `Cmd + Shift + V` | `Ctrl + Shift + V` | 마크다운 미리보기 모드 토글             |
| `Cmd + /`         | `Ctrl + /`         | 포커스 모드 토글 (문장 ➡️ 문단 ➡️ 끄기) |
| `Cmd + Shift + D` | `Ctrl + Shift + D` | 오늘의 데일리 노트 생성/열기            |
| `Cmd + F`         | `Ctrl + F`         | 테마 일체형 검색 패널 열기              |

---

## 🖥️ 상단/하단 인터페이스

- **좌측 상단 3색 버튼**:
  - 🔴 **빨간색**: iV Writer를 닫고 VS Code 기본 텍스트 에디터로 전환
  - 🟡 **노란색**: 현재 에디터 탭 닫기
  - 🟢 **초록색**: iV Writer 전용 전체화면 모드 토글
- **우측 상단 버튼**:
  - `▶` / `✏️`: 마크다운 렌더링 미리보기 토글
- **하단 서식 바**:
  - `[본문]`: 일반 본문 서식으로 전환
  - `[제목 1 ↕]`: 제목 1~6 단계 선택 팝업
  - `[목록 ↕]`: 글머리 기호, 번호 목록, 작업 목록 선택 팝업
  - `포커스 ↕`, `타자기 ↕`, `테마 ↕`, `단어 통계 ↕` 즉시 변경 지원

---

## 📄 라이선스

MIT License
