# 확장된 AI 시스템

생명체의 신경망 기반 AI 두뇌와 행동 시스템입니다.

## 구조

```
ai/
├── types.ts              # 타입 정의
├── AdvancedBrain.ts      # 신경망 (12→16→8)
├── Memory.ts             # 기억 시스템
├── SensorySystem.ts      # 감각 시스템
├── BehaviorExecutor.ts   # 행동 실행기
├── AIController.ts       # 통합 컨트롤러
└── index.ts              # 모듈 export
```

## 주요 클래스

### 1. AdvancedBrain (신경망)

**입력층 (12개)**
- 시각 (0-3): 먹이, 포식자, 동료, 짝
- 청각 (4-5): 위협 소리, 사회적 소리
- 후각 (6-7): 먹이 냄새, 위험 냄새
- 내부 상태 (8-11): 에너지, 체력, 번식욕, 나이

**은닉층 (16개)**
- 1-3개 레이어 지원
- 활성화 함수: tanh

**출력층 (8개)**
- 이동 방향, 이동 속도
- 공격, 도망, 먹기
- 구애, 번식, 휴식

```typescript
const brain = new AdvancedBrain({
  inputSize: 12,
  hiddenSize: 16,
  outputSize: 8,
  hiddenLayers: 2, // 1-3
});

const input = new Float32Array(12); // 감각 입력
const output = brain.forward(input); // 행동 출력
```

### 2. SensorySystem (감각)

주변 환경을 감지하여 신경망 입력 데이터를 생성합니다.

```typescript
const sensorySystem = new SensorySystem(100); // 감각 범위 100

const sensoryData = sensorySystem.gatherSensoryData(
  selfPosition,
  selfId,
  world,
  internalState
);

const neuralInput = sensorySystem.sensoryDataToNeuralInput(sensoryData);
```

**감지 범위**
- 시각: 기본 범위
- 청각: 1.5배
- 후각: 2배

### 3. MemorySystem (기억)

단기/장기 기억을 저장하고 의사결정에 활용합니다.

```typescript
const memory = new MemorySystem(birthPosition);

// 기억 저장
memory.rememberFood({ x: 100, y: 200 });
memory.rememberDanger({ x: 50, y: 50 });
memory.rememberMate('organism-id-123');

// 기억 조회
const nearestFood = memory.getNearestRememberedFood(currentPosition);
const isDangerous = memory.isDangerousArea(position);
const shouldGoHome = memory.shouldReturnHome(currentPosition);
```

**단기 기억** (최근 경험)
- 먹이 위치 (최대 10개)
- 위험 지역 (최대 10개)
- 만난 짝 ID (최대 5개)

**장기 기억** (반복된 경험)
- 집 영역
- 신뢰할 먹이 위치 (최대 5개)
- 위험 지역 (최대 5개)

### 4. BehaviorExecutor (행동)

신경망 출력을 실제 행동으로 변환합니다.

```typescript
const executor = new BehaviorExecutor();

// 행동 결정
const decision = executor.decideAction(
  neuralOutput,
  sensoryData,
  currentEnergy
);

// 행동 실행
const result = executor.executeAction(
  decision,
  currentPosition,
  currentEnergy
);
```

**에너지 비용**
- 이동: 0.1-0.2
- 먹기: 0.1
- 공격: 0.5
- 도망: 0.3
- 번식: 1.0
- 휴식: -0.1 (회복)

### 5. AIController (통합)

모든 AI 시스템을 통합 관리하는 컨트롤러입니다.

```typescript
const ai = new AIController({
  brainConfig: {
    inputSize: 12,
    hiddenSize: 16,
    outputSize: 8,
    hiddenLayers: 2,
  },
  senseRange: 100,
  birthPosition: { x: 0, y: 0 },
});

// 매 프레임 업데이트
const result = ai.update(
  selfId,
  selfPosition,
  world,
  internalState,
  currentTime
);

// 결과 사용
if (result.movement) {
  organism.move(result.movement.direction, result.movement.speed);
}
organism.consumeEnergy(result.energyCost);
```

## 사용 예시

### 기본 사용

```typescript
import { AIController } from './organism/ai';

class Organism {
  private ai: AIController;

  constructor(position: Position) {
    this.ai = new AIController({
      brainConfig: {
        inputSize: 12,
        hiddenSize: 16,
        outputSize: 8,
        hiddenLayers: 2,
      },
      senseRange: this.genome.senseRange,
      birthPosition: position,
    });
  }

  update(world: WorldContext, deltaTime: number) {
    const result = this.ai.update(
      this.id,
      this.position,
      world,
      {
        energy: this.energy,
        maxEnergy: this.maxEnergy,
        health: this.health,
        reproductionReady: this.canReproduce(),
        age: this.age,
        maxAge: this.lifespan,
      },
      Date.now()
    );

    // 행동 실행
    this.executeAction(result);
  }

  private executeAction(result: BehaviorResult) {
    if (result.movement) {
      this.velocity.x = result.movement.direction.x * result.movement.speed * this.maxSpeed;
      this.velocity.y = result.movement.direction.y * result.movement.speed * this.maxSpeed;
    }

    this.energy -= result.energyCost;

    // 특수 행동
    if (result.action === 'EAT' && result.targetId) {
      this.tryEat(result.targetId);
    } else if (result.action === 'REPRODUCE' && result.targetId) {
      this.tryReproduce(result.targetId);
    }
  }
}
```

### 번식 (유성 번식)

```typescript
function reproduce(parent1: Organism, parent2: Organism): Organism {
  const childPosition = {
    x: (parent1.position.x + parent2.position.x) / 2,
    y: (parent1.position.y + parent2.position.y) / 2,
  };

  const childAI = parent1.ai.reproduce(parent2.ai, childPosition);

  const child = new Organism(childPosition);
  child.ai = childAI;

  return child;
}
```

### 무성 번식

```typescript
function asexualReproduce(parent: Organism): Organism {
  const childPosition = {
    x: parent.position.x + (Math.random() - 0.5) * 20,
    y: parent.position.y + (Math.random() - 0.5) * 20,
  };

  const childAI = parent.ai.clone(childPosition);

  const child = new Organism(childPosition);
  child.ai = childAI;

  return child;
}
```

### 저장/불러오기

```typescript
// 저장
const aiData = organism.ai.serialize();
localStorage.setItem('organism-ai', aiData);

// 불러오기
const aiData = localStorage.getItem('organism-ai');
if (aiData) {
  organism.ai = AIController.deserialize(aiData);
}
```

## 성능 최적화

### 1. Float32Array 사용
- 메모리 효율적
- 신경망 계산 최적화

### 2. 배치 처리
```typescript
// 여러 개체 한 번에 처리
const organisms = [...]; // 100개
const results = organisms.map(org => org.ai.update(...));
```

### 3. 감각 범위 제한
```typescript
// 필요한 만큼만 감지
ai.setSenseRange(50); // 작은 생물
ai.setSenseRange(200); // 큰 생물
```

## 진화 파라미터

### 돌연변이
```typescript
// 무성 번식: 높은 변이율
brain.mutate(0.1, 0.15); // 10% 확률, 15% 강도

// 유성 번식: 낮은 변이율
brain.mutate(0.05, 0.1); // 5% 확률, 10% 강도
```

### 교배
```typescript
// 50% 확률로 각 레이어 선택
const childBrain = AdvancedBrain.crossover(parent1Brain, parent2Brain);
```

## 디버깅

### AI 상태 확인
```typescript
const stats = ai.getStats();
console.log(stats);
// {
//   brainLayers: 2,
//   memoryCount: {
//     shortTermFood: 3,
//     shortTermDanger: 1,
//     longTermFood: 2,
//     longTermDanger: 0,
//   },
//   hasTerritory: true,
// }
```

### 행동 로그
```typescript
const result = ai.update(...);
console.log(result.action); // 'EAT', 'FLEE', 'MOVE_DIRECTION' 등
console.log(result.message); // '먹이 섭취 시도'
console.log(result.energyCost); // 0.1
```

## 주의사항

1. **메모리 관리**: Float32Array는 복제 시 새로운 객체 생성
2. **에너지 부족**: 항상 에너지 체크 후 행동
3. **감각 범위**: 너무 넓으면 성능 저하
4. **기억 제한**: 자동으로 오래된 기억 삭제됨

## 확장 가능성

### 향후 추가 예정
- NEAT 알고리즘 (토폴로지 진화)
- 강화 학습 (보상 기반)
- 군집 행동 (떼 지어 다니기)
- 감정 시스템 (두려움, 호기심 등)
