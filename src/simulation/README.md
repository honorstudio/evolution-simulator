# 시뮬레이션 엔진

Evolution Simulator의 핵심 시뮬레이션 로직을 담당하는 모듈입니다.

## 구조

```
src/simulation/
├── config.ts          # 시뮬레이션 설정
├── Time.ts            # 시간 관리 (속도 조절, 일시정지)
├── Statistics.ts      # 통계 추적
├── SimulationEngine.ts # 메인 엔진
└── index.ts           # 모듈 내보내기
```

## 사용법

### 기본 사용

```typescript
import { Game } from './Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

// 초기화 및 시작
await game.init();
game.start();
```

### 커스텀 설정

```typescript
import { Game } from './Game';
import { FAST_EVOLUTION_CONFIG } from './simulation/config';

const game = new Game(canvas);
await game.init();

// 빠른 진화 모드로 시작
game.newGame(FAST_EVOLUTION_CONFIG);
game.start();
```

### 게임 컨트롤

```typescript
// 일시정지
game.togglePause();

// 속도 조절 (0.1x ~ 10x)
game.setSpeed(2.0); // 2배속

// 통계 확인
const simulation = game.getSimulation();
const stats = simulation.getStatistics();
console.log(`개체 수: ${stats.organismCount}`);
```

## 주요 클래스

### TimeManager

게임 속도와 시간 흐름을 관리합니다.

```typescript
const timeManager = simulation.getTimeManager();

// 속도 조절
timeManager.setSpeed(2.0); // 2배속

// 일시정지
timeManager.pause();
timeManager.resume();
timeManager.togglePause();

// 시간 확인
const tick = timeManager.getTick(); // 총 경과 틱
const formatted = timeManager.formatTimeShort(); // "1년 120일"
```

### StatisticsTracker

게임 통계를 수집하고 히스토리를 관리합니다.

```typescript
const tracker = simulation.getStatisticsTracker();

// 현재 통계
const stats = tracker.getCurrentStats();

// 히스토리 (차트용)
const history = tracker.getHistory();
const populationTrend = tracker.getPopulationTrend();

// 요약 정보
const summary = tracker.getSummary();
console.log(`최고 개체 수: ${summary.peak}`);
```

### SimulationEngine

시뮬레이션의 핵심 엔진입니다.

```typescript
const simulation = new SimulationEngine();

// 새 게임
simulation.newGame(config);

// 시작/정지
simulation.start();
simulation.stop();

// 매 프레임 업데이트
simulation.update(deltaTime);

// 하위 시스템 접근
const world = simulation.getWorld();
const organismManager = simulation.getOrganismManager();
const timeManager = simulation.getTimeManager();
```

## 게임 루프 흐름

```
1. requestAnimationFrame
   ↓
2. Delta 계산 (현재 시간 - 이전 시간)
   ↓
3. TimeManager.update(delta)
   - 게임 속도 적용
   - 일시정지 처리
   - 조정된 delta 반환
   ↓
4. SimulationEngine.update(adjustedDelta)
   ├─ 환경 업데이트 (World)
   ├─ 생명체 업데이트 (OrganismManager)
   │  ├─ AI (센싱, 사고, 행동)
   │  ├─ 물리 (이동, 충돌)
   │  └─ 생명 (에너지, 번식, 사망)
   ├─ 음식 생성
   └─ 통계 수집
   ↓
5. Renderer.render()
   ├─ 지형 렌더링
   ├─ 생명체 렌더링
   └─ UI 렌더링
   ↓
6. 다음 프레임으로
```

## 설정 옵션

### SimulationConfig

```typescript
interface SimulationConfig {
  worldWidth: number; // 월드 너비
  worldHeight: number; // 월드 높이
  initialOrganisms: number; // 초기 생명체 수
  initialFood: number; // 초기 음식 수
  foodSpawnRate: number; // 음식 생성 확률 (0~1)
  mutationRate: number; // 돌연변이 확률 (0~1)
  energyCostPerTick: number; // 틱당 에너지 소모
  reproductionEnergyCost: number; // 번식 에너지 비용
}
```

### 프리셋

- **DEFAULT_CONFIG**: 균형잡힌 기본 설정
- **FAST_EVOLUTION_CONFIG**: 빠른 진화 관찰용
- **HARDCORE_CONFIG**: 생존 난이도 높음

## 성능 고려사항

### 프레임 독립성

- Delta time을 사용해 프레임레이트와 무관하게 동작
- 60fps 기준으로 최적화됨
- 낮은 fps에서도 게임 로직은 정상 작동

### 메모리 관리

- 통계 히스토리 자동 제한 (최대 1000개)
- 10틱마다 샘플링하여 저장

### 목표 성능

- **60 FPS** 유지
- **10,000개 이상** 동시 생명체 지원
- **낮은 메모리 사용량** (객체 풀링 활용)

## TODO

현재 구현된 부분:

- [x] TimeManager - 시간 관리
- [x] StatisticsTracker - 통계 추적
- [x] SimulationEngine - 엔진 기본 구조
- [x] Game - 게임 루프

아직 구현 필요:

- [ ] World - 환경 시스템
- [ ] OrganismManager - 생명체 관리
- [ ] Renderer - 렌더링 시스템
- [ ] Physics - 물리 엔진
- [ ] AI - 행동 시스템

## 디버깅

개발자 도구 콘솔에서 게임 상태를 확인할 수 있습니다:

```javascript
// 전역으로 game 인스턴스 노출 (개발용)
window.game = game;

// 콘솔에서
game.getSimulation().getStatistics(); // 통계 확인
game.getFPS(); // FPS 확인
game.togglePause(); // 일시정지
```

## 참고

자세한 예제는 `src/examples/game-example.ts`를 참고하세요.
