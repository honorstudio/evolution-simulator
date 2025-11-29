# MCP (Model Context Protocol) 설정 가이드

이 문서는 Evolution Simulator 개발에 유용한 MCP 서버 설정 방법을 안내합니다.

## 현재 사용 중인 MCP

### 1. Playwright MCP (이미 설치됨)
브라우저 자동화 및 테스트용

```json
// Claude Code 설정에 이미 포함됨
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-playwright"]
    }
  }
}
```

**사용 가능한 도구:**
- `mcp__playwright__browser_navigate` - URL 이동
- `mcp__playwright__browser_snapshot` - 접근성 스냅샷
- `mcp__playwright__browser_take_screenshot` - 스크린샷
- `mcp__playwright__browser_click` - 클릭
- `mcp__playwright__browser_type` - 텍스트 입력

---

## 추천 추가 MCP

### 2. Context7 (이미 설치됨)
최신 라이브러리 문서 조회

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@anthropic/mcp-context7"]
    }
  }
}
```

**사용 예시:**
```
"context7으로 PixiJS v8 문서 찾아줘"
"TensorFlow.js 신경망 생성 방법 조회해줘"
```

### 3. Memory MCP (선택적)
세션 간 정보 유지

```bash
# 설치
npm install -g @anthropic/mcp-memory
```

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["@anthropic/mcp-memory"]
    }
  }
}
```

**사용 사례:**
- 프로젝트 진행 상황 기억
- 자주 사용하는 코드 패턴 저장
- 버그 해결 히스토리 관리

### 4. Filesystem Extended (선택적)
대용량 파일 처리

```bash
# 설치
npm install -g @anthropic/mcp-filesystem
```

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@anthropic/mcp-filesystem", "--root", "/path/to/project"]
    }
  }
}
```

---

## 게임 개발 특화 MCP (참고용)

### PlayCanvas MCP
WebGL 3D 엔진 연동 (이 프로젝트에서는 PixiJS 사용으로 불필요)

```json
{
  "mcpServers": {
    "playcanvas": {
      "command": "npx",
      "args": ["@anthropic/mcp-playcanvas"]
    }
  }
}
```

### Genesis World MCP
물리 시뮬레이션 연구용 (고급 기능)

---

## MCP 설정 파일 위치

### macOS/Linux
```
~/.claude/claude_desktop_config.json
```

또는 Claude Code CLI 사용 시:
```
~/.claude.json
```

### 설정 예시

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-playwright"]
    },
    "context7": {
      "command": "npx",
      "args": ["@anthropic/mcp-context7"]
    }
  }
}
```

---

## 프로젝트에서 MCP 활용 가이드

### 1. 브라우저 테스트 (Playwright)

```markdown
# 게임 UI 테스트
1. mcp__playwright__browser_navigate로 localhost:5173 접속
2. mcp__playwright__browser_snapshot으로 현재 상태 확인
3. mcp__playwright__browser_click으로 버튼 클릭
4. mcp__playwright__browser_take_screenshot으로 결과 캡처
```

### 2. 라이브러리 문서 조회 (Context7)

```markdown
# PixiJS 사용법 조회
1. mcp__context7__resolve-library-id로 "pixijs" 검색
2. mcp__context7__get-library-docs로 문서 조회
```

### 3. 개발 서버 실행 확인

```bash
# 먼저 개발 서버 시작
npm run dev

# Playwright로 접속 확인
# mcp__playwright__browser_navigate → http://localhost:5173
```

---

## 주의사항

1. **npx 명령어 대신 MCP 도구 사용**: Playwright 관련 작업은 `npx playwright` 대신 `mcp__playwright__*` 도구 사용
2. **MCP 서버 재시작**: 설정 변경 후 Claude Code 재시작 필요
3. **권한 문제**: 일부 MCP는 파일 시스템 접근 권한 필요

---

## 문제 해결

### MCP 연결 실패 시
```bash
# MCP 서버 수동 테스트
npx @anthropic/mcp-playwright --help
```

### 도구가 나타나지 않을 때
1. Claude Code 재시작
2. 설정 파일 JSON 문법 확인
3. 패키지 재설치

### 타임아웃 발생 시
- 네트워크 상태 확인
- MCP 서버 로그 확인
