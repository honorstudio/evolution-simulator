# UI 컴포넌트

Evolution Simulator의 React UI 레이어입니다.

## 구조

```
ui/
├── GameContext.tsx          # Game 인스턴스 공유 Context
├── hooks/                   # 커스텀 훅
│   ├── useGame.ts          # Game 인스턴스 접근
│   ├── useStats.ts         # 실시간 통계
│   └── useTimeControl.ts   # 시간 컨트롤
├── components/              # 재사용 컴포넌트
│   └── GameCanvas.tsx      # PixiJS 캔버스
└── panels/                  # UI 패널
    ├── TimeControlPanel.tsx # 시간 컨트롤 패널
    ├── StatsPanel.tsx       # 통계 패널
    └── OrganismInfoPanel.tsx# 개체 정보 패널
```

## 사용법

### 1. GameProvider로 앱 감싸기

```tsx
import { GameProvider } from './ui/GameContext';

function App() {
  return (
    <GameProvider>
      {/* 앱 컴포넌트들 */}
    </GameProvider>
  );
}
```

### 2. 훅 사용하기

```tsx
import { useGame, useStats, useTimeControl } from './ui/hooks';

function MyComponent() {
  const { game, isReady } = useGame();
  const stats = useStats();
  const { isPaused, speed, togglePause, changeSpeed } = useTimeControl();

  return (
    <div>
      <p>생명체: {stats.organisms}</p>
      <p>속도: {speed}x</p>
      <button onClick={togglePause}>
        {isPaused ? '재생' : '일시정지'}
      </button>
    </div>
  );
}
```

### 3. 컴포넌트 가져오기

```tsx
import { GameCanvas } from './ui/components';
import { TimeControlPanel, StatsPanel, OrganismInfoPanel } from './ui/panels';

function App() {
  return (
    <div>
      <GameCanvas />
      <TimeControlPanel />
      <StatsPanel />
      <OrganismInfoPanel organismId={selectedId} />
    </div>
  );
}
```

## 주의사항

- `GameProvider`는 앱의 최상위에 한 번만 사용하세요
- `useGame` 등의 훅은 `GameProvider` 내부에서만 사용 가능합니다
- `GameCanvas`는 자동으로 게임을 시작/정지합니다
