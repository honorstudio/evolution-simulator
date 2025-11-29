# UI 설치 가이드

Evolution Simulator의 React UI가 구현되었습니다!

## 구현된 파일들

### 1. GameContext
- `/src/ui/GameContext.tsx` - Game 인스턴스 공유

### 2. 커스텀 훅
- `/src/ui/hooks/useGame.ts` - Game 접근
- `/src/ui/hooks/useStats.ts` - 실시간 통계
- `/src/ui/hooks/useTimeControl.ts` - 시간 컨트롤

### 3. 컴포넌트
- `/src/ui/components/GameCanvas.tsx` - PixiJS 렌더링 캔버스

### 4. 패널
- `/src/ui/panels/TimeControlPanel.tsx` - 시간 컨트롤 패널
- `/src/ui/panels/StatsPanel.tsx` - 통계 패널
- `/src/ui/panels/OrganismInfoPanel.tsx` - 개체 정보 패널

### 5. 스타일
- `/src/ui/panels/TimeControlPanel.css`
- `/src/ui/panels/StatsPanel.css`
- `/src/ui/panels/OrganismInfoPanel.css`

### 6. 업데이트된 App.tsx
- `/src/App-new.tsx` - 새로운 App 컴포넌트

## 설치 방법

### 방법 1: 터미널에서 파일 교체

```bash
cd "/Users/honorstudio/Desktop/dev/AI training/evolution-simulator"

# 기존 App.tsx 백업
mv src/App.tsx src/App.old.tsx

# 새 App.tsx 적용
mv src/App-new.tsx src/App.tsx
```

### 방법 2: 수동 복사

1. `src/App-new.tsx` 파일을 열기
2. 전체 내용 복사
3. `src/App.tsx` 파일을 열기
4. 전체 내용을 붙여넣기
5. 저장

## 실행 방법

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:5173 접속

## UI 구조

```
┌─────────────────────────────────────────────────────────────┐
│  Evolution Simulator            [TimeControlPanel]          │
├─────────────────────────────────────────────────────────────┤
│                                              │ [StatsPanel] │
│                                              │              │
│           [GameCanvas - PixiJS]              │  - 생명체    │
│                                              │  - 음식      │
│                                              │  - 출생/사망 │
│                                              │              │
│                                              ├──────────────┤
│                                              │ [OrganismInfo│
│                                              │  Panel]      │
│                                              │              │
│                                              │  - 에너지    │
│                                              │  - 유전자    │
│                                              │  - 뇌 정보   │
└─────────────────────────────────────────────────────────────┘
```

## 기능

### TimeControlPanel
- ⏸️ 일시정지/재생 버튼
- 속도 조절 (0.5x, 1x, 2x, 5x, 10x)
- 경과 시간 표시 (년, 일, 틱)
- FPS 표시

### StatsPanel
- 실시간 통계 표시
  - 생명체 수
  - 음식 수
  - 출생/사망 수
  - 평균 에너지
  - 평균 수명
  - 최대 개체수

### OrganismInfoPanel
- 선택된 개체의 상세 정보
  - 에너지 바
  - 나이, 세대
  - 유전자 정보
  - 뇌 구조
- (개체 클릭 기능은 추후 구현)

## 다음 단계

### 1. 개체 클릭 선택 기능
- InputHandler에 클릭 이벤트 추가
- 클릭된 개체 ID를 App state로 전달
- OrganismInfoPanel에 실제 데이터 연동

### 2. 추가 UI 패널
- 세계 정보 패널 (온도, 대기 상태)
- 종 목록 패널
- 재앙 트리거 버튼

### 3. 성능 최적화
- 통계 업데이트 빈도 조절
- 불필요한 리렌더링 방지
- 메모이제이션 적용

## 문제 해결

### Game 클래스를 찾을 수 없음
```
Module not found: Can't resolve '../Game'
```
→ `/src/Game.ts` 파일이 있는지 확인

### SimulationEngine 메서드 오류
```
Property 'getStatistics' does not exist
```
→ SimulationEngine에 해당 메서드 추가 필요

### Canvas가 표시되지 않음
→ Renderer와 World가 제대로 초기화되었는지 확인
→ 브라우저 콘솔에서 에러 메시지 확인

## 참고 자료

- `/src/ui/README.md` - UI 컴포넌트 상세 설명
- `/docs/SYSTEM-DESIGN.md` - 시스템 설계 문서
- `/docs/TECH-STACK.md` - 기술 스택
