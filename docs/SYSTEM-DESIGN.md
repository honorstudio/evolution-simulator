# 시스템 설계 (System Design)

> 진화 시뮬레이터의 전체 아키텍처 및 시스템 설계

---

## 1. 전체 아키텍처

### 1.1 시스템 구조도

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           사용자 인터페이스                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 메인 뷰     │ │ 관찰 패널   │ │ 재앙 패널   │ │ 통계 패널   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│                           코어 엔진                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     게임 루프 (Game Loop)                        │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │   │
│  │  │ 입력 처리 │→│ 시뮬레이션│→│ 렌더링    │→│ UI 업데이트│        │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                           시스템 레이어                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ 환경 시스템   │ │ 생명 시스템   │ │ AI 시스템    │ │ 물리 시스템   │   │
│  │              │ │              │ │              │ │              │   │
│  │ • 기후       │ │ • 생명체     │ │ • 신경망     │ │ • 이동       │   │
│  │ • 지형       │ │ • 유전자     │ │ • 의사결정   │ │ • 충돌       │   │
│  │ • 대기       │ │ • 번식       │ │ • 학습       │ │ • 에너지     │   │
│  │ • 물 순환    │ │ • 진화       │ │              │ │              │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                           데이터 레이어                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ 월드 데이터   │ │ 개체 데이터   │ │ 히스토리     │ │ 설정         │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                              │                                          │
│                    ┌─────────┴─────────┐                               │
│                    │    IndexedDB      │                               │
│                    └───────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 멀티스레드 구조

```
┌────────────────────────────────────────────────────────────────────────┐
│                          메인 스레드                                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ React UI   │  │ 렌더링     │  │ 입력 처리   │  │ 상태 관리   │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
│         │               │               │               │              │
│         └───────────────┴───────────────┴───────────────┘              │
│                                   │                                     │
│                          SharedArrayBuffer                              │
│                                   │                                     │
│    ┌──────────────────────────────┼──────────────────────────────┐     │
│    │                              │                              │     │
│    ▼                              ▼                              ▼     │
│ ┌──────────────┐           ┌──────────────┐           ┌──────────────┐ │
│ │ Simulation   │           │ AI Worker    │           │ Environment  │ │
│ │ Worker       │           │ Pool         │           │ Worker       │ │
│ │              │           │              │           │              │ │
│ │ • 개체 업데이트│          │ • 신경망 연산 │           │ • 기후 업데이트│ │
│ │ • 충돌 검사   │           │ • 배치 추론   │           │ • 물 순환     │ │
│ │ • 번식 처리   │           │ • 가중치 변이 │           │ • 지형 변화   │ │
│ └──────────────┘           └──────────────┘           └──────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 데이터 구조

### 2.1 월드 데이터

```typescript
// 월드 전체 구조
interface World {
  id: string;
  seed: number;
  config: WorldConfig;

  // 청크 기반 관리
  chunks: ChunkManager;

  // 전역 시스템
  atmosphere: AtmosphereSystem;
  waterCycle: WaterCycleSystem;
  climate: ClimateSystem;

  // 시간
  time: TimeSystem;

  // 생명체 관리
  organisms: OrganismManager;
  species: SpeciesRegistry;
}

// 월드 설정
interface WorldConfig {
  width: number;           // 청크 단위
  height: number;
  chunkSize: number;       // 셀 단위 (기본 32)

  // 생성 파라미터
  oceanLevel: number;      // 해수면 (0-1)
  mountainHeight: number;  // 산 높이
  temperatureRange: [number, number];
}

// 청크 구조
interface WorldChunk {
  x: number;
  y: number;
  id: string;              // "x,y" 형식

  // 지형 데이터
  cells: Cell[][];
  biome: Biome;

  // 로컬 환경
  localClimate: LocalClimate;

  // 개체 관리
  organisms: Set<string>;  // 이 청크의 개체 ID들

  // 상태
  loaded: boolean;
  dirty: boolean;          // 변경사항 있음
  lastUpdate: number;
}

// 셀 구조
interface Cell {
  // 위치
  x: number;
  y: number;

  // 지형
  elevation: number;       // 고도 (0-1)
  terrain: TerrainType;

  // 환경
  temperature: number;     // 켈빈
  moisture: number;        // 수분 (0-1)
  nutrients: number;       // 영양분 (0-1)
  sunlight: number;        // 일조량 (0-1)

  // 물
  waterDepth: number;      // 수심 (0이면 육지)
  waterFlow: Vector2D;     // 물 흐름 방향/속도

  // 식생
  vegetation: number;      // 식생 밀도 (0-1)
}
```

### 2.2 생명체 데이터

```typescript
// 기본 생명체
interface Organism {
  id: string;
  speciesId: string;

  // 위치
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;

  // 상태
  energy: number;
  health: number;
  age: number;
  isAlive: boolean;

  // 유전자
  genome: Genome;

  // AI
  brain: NeuralNetwork;

  // 번식
  reproductionCooldown: number;
  offspringCount: number;

  // 관계
  parentIds: [string | null, string | null];

  // 메타
  generation: number;
  birthTick: number;
  chunkId: string;
}

// 유전자 구조
interface Genome {
  // 신체 유전자
  body: BodyGenome;

  // 뇌 유전자 (신경망 구조)
  brain: BrainGenome;

  // 외형 유전자
  appearance: AppearanceGenome;

  // 행동 유전자
  behavior: BehaviorGenome;

  // 돌연변이 설정
  mutationRate: number;
}

interface BodyGenome {
  size: number;
  speed: number;
  stamina: number;
  metabolismRate: number;
  lifespan: number;

  // 감각
  visionRange: number;
  visionAngle: number;
  hearingRange: number;
  smellRange: number;

  // 특수 능력
  photosynthesis: number;  // 광합성 능력
  carnivory: number;       // 육식 능력
  herbivory: number;       // 초식 능력
  toxicity: number;        // 독성
  defense: number;         // 방어력
}

interface BrainGenome {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
  activationFunction: 'relu' | 'tanh' | 'sigmoid';
  initialWeightsSeed: number;
}

interface AppearanceGenome {
  // 형태
  bodyShape: 'blob' | 'elongated' | 'spherical' | 'branching';
  symmetry: 'radial' | 'bilateral' | 'asymmetric';
  segments: number;

  // 색상
  primaryColor: HSL;
  secondaryColor: HSL;
  pattern: PatternType;

  // 부속물
  appendages: AppendageGene[];
}
```

### 2.3 종 데이터

```typescript
interface Species {
  id: string;
  name: string;            // 자동 생성된 학명

  // 창시자 정보
  founderId: string;
  foundedAt: number;       // 틱

  // 대표 유전자 (평균)
  representativeGenome: Genome;

  // 통계
  statistics: SpeciesStatistics;

  // 진화 트리
  parentSpeciesId: string | null;
  childSpeciesIds: string[];

  // 상태
  isExtinct: boolean;
  extinctAt?: number;
}

interface SpeciesStatistics {
  // 현재 상태
  population: number;
  avgFitness: number;
  geneticDiversity: number;

  // 히스토리 (샘플링)
  populationHistory: TimeSeriesData;
  traitHistory: Map<string, TimeSeriesData>;

  // 생태적 정보
  preySpecies: string[];
  predatorSpecies: string[];
  habitat: Biome[];
}
```

---

## 3. 시스템 상세 설계

### 3.1 게임 루프

```typescript
class GameLoop {
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_TIMESTEP = 1000 / 60; // 60 UPS

  private running: boolean = false;
  private speed: number = 1;

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(currentTime: number) {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 시뮬레이션 스피드 적용
    this.accumulator += deltaTime * this.speed;

    // 고정 시간 간격으로 업데이트
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.update(this.FIXED_TIMESTEP);
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    // 렌더링 (가변 프레임)
    const interpolation = this.accumulator / this.FIXED_TIMESTEP;
    this.render(interpolation);

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number) {
    // 1. 환경 업데이트
    environmentSystem.update(dt);

    // 2. 생명체 AI 결정
    aiSystem.processDecisions();

    // 3. 물리/이동 업데이트
    physicsSystem.update(dt);

    // 4. 상호작용 처리 (먹기, 공격 등)
    interactionSystem.update();

    // 5. 생명 주기 (출생, 사망)
    lifecycleSystem.update();

    // 6. 통계 업데이트
    statisticsSystem.update();

    // 7. 시간 진행
    timeSystem.tick();
  }

  private render(interpolation: number) {
    renderer.clear();
    renderer.renderWorld(world, interpolation);
    renderer.renderOrganisms(organisms, interpolation);
    renderer.renderUI();
  }
}
```

### 3.2 환경 시스템

```typescript
class EnvironmentSystem {
  private atmosphere: AtmosphereState;
  private climateGrid: ClimateCell[][];

  update(dt: number) {
    // 대기 순환
    this.updateAtmosphere(dt);

    // 기후 업데이트 (청크별)
    this.updateClimate(dt);

    // 물 순환
    this.updateWaterCycle(dt);

    // 계절 변화
    this.updateSeason();
  }

  private updateAtmosphere(dt: number) {
    // 광합성으로 인한 O2 증가
    const photosynthesisO2 = this.calculatePhotosynthesisOutput();
    this.atmosphere.oxygen += photosynthesisO2 * dt;

    // 호흡으로 인한 O2 감소, CO2 증가
    const respiration = this.calculateRespirationOutput();
    this.atmosphere.oxygen -= respiration.o2Consumed * dt;
    this.atmosphere.carbonDioxide += respiration.co2Produced * dt;

    // 온실 효과
    const greenhouseEffect = this.atmosphere.carbonDioxide * GREENHOUSE_FACTOR;
    this.atmosphere.globalTemperature += greenhouseEffect;
  }

  getEnvironmentAt(x: number, y: number): LocalEnvironment {
    const cell = this.getCell(x, y);
    return {
      temperature: cell.temperature,
      humidity: cell.moisture,
      oxygen: this.atmosphere.oxygen,
      sunlight: this.calculateSunlight(x, y),
      terrain: cell.terrain,
      waterDepth: cell.waterDepth
    };
  }
}
```

### 3.3 생명체 관리 시스템

```typescript
class OrganismManager {
  private organisms: Map<string, Organism> = new Map();
  private spatialIndex: SpatialHashGrid;
  private pool: ObjectPool<Organism>;

  // 개체 추가
  spawn(genome: Genome, position: Vector2D, parents?: [string, string]): Organism {
    const organism = this.pool.acquire();

    organism.id = generateId();
    organism.genome = genome;
    organism.position = position;
    organism.brain = this.createBrain(genome.brain);
    organism.parentIds = parents || [null, null];
    organism.generation = this.calculateGeneration(parents);

    this.organisms.set(organism.id, organism);
    this.spatialIndex.insert(organism);

    // 종 분류
    speciesRegistry.classify(organism);

    return organism;
  }

  // 개체 제거
  kill(id: string, cause: DeathCause) {
    const organism = this.organisms.get(id);
    if (!organism) return;

    organism.isAlive = false;

    // 통계 기록
    statisticsSystem.recordDeath(organism, cause);

    // 분해 (영양분 반환)
    this.decompose(organism);

    // 제거
    this.organisms.delete(id);
    this.spatialIndex.remove(organism);
    this.pool.release(organism);
  }

  // 번식
  reproduce(parent1: Organism, parent2?: Organism): Organism | null {
    // 에너지 체크
    if (parent1.energy < parent1.genome.body.reproductionCost) {
      return null;
    }

    // 유전자 생성
    const childGenome = parent2
      ? this.crossover(parent1.genome, parent2.genome)
      : this.clone(parent1.genome);

    // 돌연변이
    this.mutate(childGenome);

    // 에너지 소비
    parent1.energy -= parent1.genome.body.reproductionCost;
    if (parent2) {
      parent2.energy -= parent2.genome.body.reproductionCost * 0.5;
    }

    // 자식 생성
    const offset = randomOffset(parent1.genome.body.size * 2);
    const childPosition = addVectors(parent1.position, offset);

    return this.spawn(
      childGenome,
      childPosition,
      [parent1.id, parent2?.id || null]
    );
  }

  // 근처 개체 조회
  getNearby(position: Vector2D, radius: number): Organism[] {
    return this.spatialIndex.query(position, radius);
  }
}
```

### 3.4 AI 시스템

```typescript
class AISystem {
  private workerPool: AIWorkerPool;

  async processDecisions() {
    const organisms = Array.from(organismManager.organisms.values())
      .filter(o => o.isAlive);

    // 배치로 나누어 워커에 분배
    const batches = this.splitIntoBatches(organisms, BATCH_SIZE);

    const promises = batches.map((batch, index) =>
      this.workerPool.process(index % this.workerPool.size, batch)
    );

    const results = await Promise.all(promises);

    // 결과 적용
    for (const batchResult of results) {
      for (const decision of batchResult) {
        this.applyDecision(decision);
      }
    }
  }

  private gatherInputs(organism: Organism): number[] {
    const env = environmentSystem.getEnvironmentAt(
      organism.position.x,
      organism.position.y
    );

    const nearby = organismManager.getNearby(
      organism.position,
      organism.genome.body.visionRange
    );

    // 입력 벡터 구성
    return [
      // 내부 상태
      organism.energy / organism.genome.body.maxEnergy,
      organism.health / 100,
      organism.age / organism.genome.body.lifespan,
      organism.reproductionCooldown > 0 ? 0 : 1,

      // 환경
      env.temperature / 400,  // 정규화
      env.humidity,
      env.sunlight,
      env.waterDepth > 0 ? 1 : 0,

      // 감지된 개체 (가장 가까운 먹이, 포식자, 동료, 짝)
      ...this.encodeSensoryInput(organism, nearby)
    ];
  }

  private applyDecision(decision: AIDecision) {
    const organism = organismManager.organisms.get(decision.organismId);
    if (!organism) return;

    // 이동
    if (decision.move) {
      const moveForce = {
        x: Math.cos(decision.moveDirection) * decision.moveSpeed,
        y: Math.sin(decision.moveDirection) * decision.moveSpeed
      };
      organism.velocity = addVectors(organism.velocity, moveForce);
    }

    // 행동
    switch (decision.action) {
      case 'eat':
        this.tryEat(organism, decision.target);
        break;
      case 'attack':
        this.tryAttack(organism, decision.target);
        break;
      case 'reproduce':
        this.tryReproduce(organism, decision.target);
        break;
      case 'flee':
        this.flee(organism, decision.fleeFrom);
        break;
    }
  }
}
```

### 3.5 재앙 시스템

```typescript
class DisasterSystem {
  private activeDisasters: Disaster[] = [];

  apply(type: DisasterType, config: DisasterConfig) {
    const disaster = this.createDisaster(type, config);

    // 즉시 효과
    this.applyImmediateEffects(disaster);

    // 지속 효과 등록
    if (disaster.duration > 0) {
      this.activeDisasters.push(disaster);
    }

    // 이벤트 기록
    historySystem.recordEvent({
      type: 'disaster',
      subtype: type,
      tick: timeSystem.currentTick,
      details: config
    });
  }

  update(dt: number) {
    for (const disaster of this.activeDisasters) {
      // 효과 적용
      this.applyOngoingEffects(disaster, dt);

      // 시간 감소
      disaster.remainingDuration -= dt;
    }

    // 완료된 재앙 제거
    this.activeDisasters = this.activeDisasters.filter(
      d => d.remainingDuration > 0
    );
  }

  private applyImmediateEffects(disaster: Disaster) {
    switch (disaster.type) {
      case DisasterType.METEOR_IMPACT:
        // 충돌 지점 파괴
        this.destroyArea(disaster.position, disaster.radius);
        // 전역 온도 하락 (먼지구름)
        environmentSystem.modifyGlobalTemperature(-disaster.intensity * 20);
        // 화재 발생
        this.startFires(disaster.position, disaster.radius * 2);
        break;

      case DisasterType.VOLCANIC_ERUPTION:
        // 용암 분출
        this.spawnLava(disaster.position, disaster.intensity);
        // 화산재
        environmentSystem.addAtmosphericParticles(disaster.intensity);
        break;

      case DisasterType.PANDEMIC:
        // 전염병 시작
        this.startPandemic(disaster.targetSpecies, disaster.lethality);
        break;
    }
  }

  private destroyArea(center: Vector2D, radius: number) {
    // 해당 영역의 모든 생명체 제거
    const affected = organismManager.getNearby(center, radius);
    for (const org of affected) {
      const distance = calculateDistance(org.position, center);
      const survivalChance = distance / radius;

      if (Math.random() > survivalChance) {
        organismManager.kill(org.id, DeathCause.DISASTER);
      }
    }

    // 지형 변경
    worldManager.modifyTerrain(center, radius, TerrainType.CRATER);
  }
}
```

---

## 4. 데이터 흐름

### 4.1 시뮬레이션 데이터 흐름

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 환경 상태    │────▶│ 생명체 감각  │────▶│ AI 입력     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 상태 업데이트│◀────│ 행동 실행    │◀────│ AI 결정     │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ 통계 수집    │────▶│ UI 업데이트  │
└─────────────┘     └─────────────┘
```

### 4.2 렌더링 파이프라인

```
┌─────────────────────────────────────────────────────────────┐
│                      렌더링 파이프라인                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 컬링 (Culling)                                         │
│     ┌─────────────────────────────────────────────────┐    │
│     │ 카메라 뷰포트 밖의 청크/개체 제외                 │    │
│     └─────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  2. LOD 결정                                               │
│     ┌─────────────────────────────────────────────────┐    │
│     │ 거리/줌에 따라 세부 수준 결정                     │    │
│     │ DOT → SIMPLE → MEDIUM → DETAILED                 │    │
│     └─────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  3. 배치 정렬                                              │
│     ┌─────────────────────────────────────────────────┐    │
│     │ 같은 텍스처/셰이더끼리 그룹화                     │    │
│     └─────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  4. 렌더링 실행                                            │
│     ┌─────────────────────────────────────────────────┐    │
│     │ a. 배경 (지형, 물)                               │    │
│     │ b. 식물                                          │    │
│     │ c. 동물 (LOD별 인스턴스 렌더링)                  │    │
│     │ d. 효과 (파티클, 날씨)                           │    │
│     │ e. UI 오버레이                                   │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 확장성 설계

### 5.1 모듈화 구조

```typescript
// 시스템 인터페이스
interface ISystem {
  name: string;
  priority: number;  // 업데이트 순서

  init(): Promise<void>;
  update(dt: number): void;
  cleanup(): void;
}

// 시스템 매니저
class SystemManager {
  private systems: Map<string, ISystem> = new Map();

  register(system: ISystem) {
    this.systems.set(system.name, system);
  }

  async initAll() {
    const sorted = Array.from(this.systems.values())
      .sort((a, b) => a.priority - b.priority);

    for (const system of sorted) {
      await system.init();
    }
  }

  updateAll(dt: number) {
    const sorted = Array.from(this.systems.values())
      .sort((a, b) => a.priority - b.priority);

    for (const system of sorted) {
      system.update(dt);
    }
  }
}

// 사용 예
systemManager.register(new EnvironmentSystem());    // priority: 1
systemManager.register(new AISystem());             // priority: 2
systemManager.register(new PhysicsSystem());        // priority: 3
systemManager.register(new LifecycleSystem());      // priority: 4
systemManager.register(new StatisticsSystem());     // priority: 5
```

### 5.2 이벤트 시스템

```typescript
type EventType =
  | 'organism.born'
  | 'organism.died'
  | 'organism.reproduced'
  | 'species.created'
  | 'species.extinct'
  | 'disaster.started'
  | 'disaster.ended'
  | 'environment.changed';

interface GameEvent {
  type: EventType;
  timestamp: number;
  data: any;
}

class EventBus {
  private listeners: Map<EventType, Set<Function>> = new Map();

  on(type: EventType, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  off(type: EventType, callback: Function) {
    this.listeners.get(type)?.delete(callback);
  }

  emit(event: GameEvent) {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
  }
}

// 사용 예
eventBus.on('organism.died', (event) => {
  statisticsSystem.recordDeath(event.data);
  uiSystem.showNotification(`${event.data.species} 개체 사망`);
});
```

---

## 6. 메모리 관리

### 6.1 객체 풀링

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number) {
    this.factory = factory;
    this.reset = reset;

    // 초기 풀 생성
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T) {
    this.reset(obj);
    this.pool.push(obj);
  }

  get availableCount(): number {
    return this.pool.length;
  }
}

// 사용 예
const organismPool = new ObjectPool<Organism>(
  () => new Organism(),
  (org) => {
    org.id = '';
    org.energy = 0;
    org.isAlive = false;
    // ... 초기화
  },
  10000  // 초기 10000개 생성
);
```

### 6.2 청크 언로딩

```typescript
class ChunkManager {
  private loadedChunks: Map<string, WorldChunk> = new Map();
  private readonly MAX_LOADED_CHUNKS = 100;

  loadChunk(x: number, y: number): WorldChunk {
    const id = `${x},${y}`;

    if (this.loadedChunks.has(id)) {
      return this.loadedChunks.get(id)!;
    }

    // 청크 로드
    const chunk = this.loadFromStorage(id) || this.generateChunk(x, y);
    this.loadedChunks.set(id, chunk);

    // 메모리 관리
    if (this.loadedChunks.size > this.MAX_LOADED_CHUNKS) {
      this.unloadDistantChunks();
    }

    return chunk;
  }

  private unloadDistantChunks() {
    const camera = cameraSystem.getPosition();
    const chunks = Array.from(this.loadedChunks.entries());

    // 거리순 정렬
    chunks.sort((a, b) => {
      const distA = this.chunkDistance(a[0], camera);
      const distB = this.chunkDistance(b[0], camera);
      return distB - distA;
    });

    // 가장 먼 청크들 언로드
    const toUnload = chunks.slice(0, chunks.length - this.MAX_LOADED_CHUNKS);
    for (const [id, chunk] of toUnload) {
      this.saveToStorage(chunk);
      this.loadedChunks.delete(id);
    }
  }
}
```

---

## 7. 파일 구조

```
evolution-simulator/
├── public/
│   └── index.html
├── src/
│   ├── core/
│   │   ├── GameLoop.ts
│   │   ├── SystemManager.ts
│   │   └── EventBus.ts
│   ├── systems/
│   │   ├── EnvironmentSystem.ts
│   │   ├── OrganismManager.ts
│   │   ├── AISystem.ts
│   │   ├── PhysicsSystem.ts
│   │   ├── LifecycleSystem.ts
│   │   ├── DisasterSystem.ts
│   │   └── StatisticsSystem.ts
│   ├── world/
│   │   ├── ChunkManager.ts
│   │   ├── WorldGenerator.ts
│   │   ├── TerrainGenerator.ts
│   │   └── ClimateSystem.ts
│   ├── entities/
│   │   ├── Organism.ts
│   │   ├── Genome.ts
│   │   ├── Species.ts
│   │   └── NeuralNetwork.ts
│   ├── rendering/
│   │   ├── Renderer.ts
│   │   ├── Camera.ts
│   │   ├── LODSystem.ts
│   │   └── ProceduralGenerator.ts
│   ├── ui/
│   │   ├── components/
│   │   ├── panels/
│   │   └── hooks/
│   ├── workers/
│   │   ├── simulationWorker.ts
│   │   ├── aiWorker.ts
│   │   └── environmentWorker.ts
│   ├── storage/
│   │   ├── SaveManager.ts
│   │   └── Database.ts
│   ├── utils/
│   │   ├── math.ts
│   │   ├── noise.ts
│   │   ├── random.ts
│   │   └── pool.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── docs/
│   ├── README.md
│   ├── PHASE1-FOUNDATION.md
│   ├── PHASE2-EVOLUTION.md
│   ├── PHASE3-ECOSYSTEM.md
│   ├── PHASE4-COMPLETION.md
│   ├── TECH-STACK.md
│   └── SYSTEM-DESIGN.md
├── tests/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

이 문서는 프로젝트의 전체적인 시스템 설계를 담고 있습니다.
개발 진행에 따라 상세 내용이 추가되거나 수정될 수 있습니다.
