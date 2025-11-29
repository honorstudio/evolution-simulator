# Phase 3: 생태계 확장 (Ecosystem)

> 대륙 규모, 재앙 시스템, 상세 관찰 도구

## 목표

시뮬레이션을 대륙 규모로 확장하고, 사용자가 재앙을 통해 진화에 영향을 줄 수 있게 하며, 정교한 관찰 도구를 제공합니다.

---

## 1. 대륙 규모 확장

### 1.1 청크 기반 세계 시스템

```typescript
interface WorldChunk {
  id: string;
  x: number;                  // 청크 좌표
  y: number;
  cells: Cell[][];            // 16x16 셀

  // 상태
  loaded: boolean;
  lastUpdate: number;
  organisms: Organism[];

  // 환경 데이터
  localClimate: LocalClimate;
  biome: Biome;
}

interface ChunkManager {
  chunks: Map<string, WorldChunk>;
  activeChunks: Set<string>;  // 활성 청크 (상세 시뮬레이션)
  visibleChunks: Set<string>; // 화면에 보이는 청크

  loadChunk(x: number, y: number): WorldChunk;
  unloadChunk(id: string): void;
  updateChunk(chunk: WorldChunk): void;
}
```

### 1.2 시뮬레이션 레벨

```typescript
enum SimulationLevel {
  FULL,       // 모든 개체 상세 시뮬레이션 (화면 내)
  SIMPLIFIED, // 간소화된 시뮬레이션 (화면 근처)
  STATISTICAL,// 통계적 시뮬레이션 (먼 지역)
  DORMANT     // 휴면 (매우 먼 지역)
}

// 거리에 따른 시뮬레이션 레벨 결정
function getSimulationLevel(chunk: WorldChunk, camera: Camera): SimulationLevel {
  const distance = calculateDistance(chunk, camera.position);

  if (distance < camera.viewRadius) return SimulationLevel.FULL;
  if (distance < camera.viewRadius * 2) return SimulationLevel.SIMPLIFIED;
  if (distance < camera.viewRadius * 5) return SimulationLevel.STATISTICAL;
  return SimulationLevel.DORMANT;
}
```

### 1.3 통계적 시뮬레이션

보이지 않는 지역은 확률로 처리:

```typescript
interface PopulationStatistics {
  species: Species;
  count: number;
  avgFitness: number;
  birthRate: number;
  deathRate: number;
  migrationRate: number;
}

function simulateStatistically(chunk: WorldChunk, deltaTime: number) {
  for (const pop of chunk.populations) {
    // 출생
    const births = Math.floor(pop.count * pop.birthRate * deltaTime);

    // 사망
    const deaths = Math.floor(pop.count * pop.deathRate * deltaTime);

    // 이주
    const emigration = Math.floor(pop.count * pop.migrationRate * deltaTime);

    // 적용
    pop.count = pop.count + births - deaths - emigration;

    // 인접 청크로 이주 처리
    migrateToNeighbors(chunk, pop.species, emigration);
  }
}
```

---

## 2. 고급 환경 시스템

### 2.1 지역별 기후

```typescript
interface LocalClimate {
  // 기본 요소
  temperature: number;        // 현재 온도
  humidity: number;           // 습도
  precipitation: number;      // 강수량
  windSpeed: number;          // 풍속
  windDirection: number;      // 풍향

  // 계절 변화
  seasonalVariation: {
    temperatureRange: [number, number];
    precipitationRange: [number, number];
  };

  // 극한 날씨 확률
  extremeWeatherChance: {
    drought: number;
    flood: number;
    storm: number;
    freeze: number;
  };
}

// 날씨 시뮬레이션
function updateWeather(climate: LocalClimate, season: Season) {
  // 계절에 따른 기본값
  const baseTemp = getSeasonalTemperature(climate, season);

  // 랜덤 변동
  climate.temperature = baseTemp + (Math.random() - 0.5) * 10;

  // 습도 계산 (기온, 강수량, 바람 영향)
  climate.humidity = calculateHumidity(climate);

  // 극한 날씨 체크
  checkExtremeWeather(climate);
}
```

### 2.2 생태계 구역 (Biome)

```typescript
enum Biome {
  // 수계
  DEEP_OCEAN,
  SHALLOW_OCEAN,
  CORAL_REEF,
  FRESHWATER_LAKE,
  RIVER,
  WETLAND,

  // 열대
  TROPICAL_RAINFOREST,
  TROPICAL_DRY_FOREST,
  SAVANNA,

  // 온대
  TEMPERATE_FOREST,
  TEMPERATE_GRASSLAND,
  MEDITERRANEAN,

  // 한대
  BOREAL_FOREST,
  TUNDRA,
  ICE_CAP,

  // 건조
  HOT_DESERT,
  COLD_DESERT,

  // 고산
  ALPINE,
  VOLCANIC
}

interface BiomeConfig {
  biome: Biome;

  // 환경 범위
  temperatureRange: [number, number];
  humidityRange: [number, number];
  elevationRange: [number, number];

  // 기본 식생
  baseVegetation: PlantType[];
  vegetationDensity: number;

  // 특수 조건
  specialConditions: string[];
}
```

### 2.3 물 순환 시스템

```typescript
interface WaterCycle {
  // 전역 수분 순환
  evaporationRate: number;    // 증발률
  precipitationPattern: number[][]; // 강수 패턴 맵

  // 지역별 수계
  waterBodies: WaterBody[];
  groundwater: number[][];    // 지하수 맵
  rivers: River[];

  // 시뮬레이션
  update(deltaTime: number): void;
}

interface River {
  source: Position;           // 발원지
  path: Position[];           // 경로
  flowRate: number;           // 유량
  mouth: Position;            // 하구
  delta: boolean;             // 삼각주 형성 여부
}

// 하천 시뮬레이션
function simulateRiver(river: River, rainfall: number) {
  // 상류 강수량에 따른 유량 변화
  river.flowRate = calculateFlowRate(river, rainfall);

  // 침식 및 퇴적
  updateErosion(river);
  updateDeposition(river);

  // 범람 체크
  if (river.flowRate > river.capacity) {
    triggerFlooding(river);
  }
}
```

---

## 3. 재앙 시스템

### 3.1 재앙 타입

```typescript
enum DisasterType {
  // 지질학적
  METEOR_IMPACT,      // 운석 충돌
  VOLCANIC_ERUPTION,  // 화산 폭발
  EARTHQUAKE,         // 지진
  TSUNAMI,            // 쓰나미

  // 기후
  ICE_AGE,            // 빙하기
  GLOBAL_WARMING,     // 지구 온난화
  DROUGHT,            // 가뭄
  MEGA_FLOOD,         // 대홍수
  MEGA_STORM,         // 초대형 폭풍

  // 생물학적
  PANDEMIC,           // 전염병
  INVASIVE_SPECIES,   // 침입종

  // 대기
  OXYGEN_SPIKE,       // 산소 급증
  OXYGEN_DEPLETION,   // 산소 고갈
  TOXIC_GAS,          // 독성 가스

  // 기타
  RADIATION_SURGE,    // 방사능 증가
  SOLAR_FLARE         // 태양 폭발
}
```

### 3.2 재앙 구현

```typescript
interface Disaster {
  type: DisasterType;
  position?: Position;        // 국지적 재앙의 경우
  radius?: number;            // 영향 범위
  intensity: number;          // 강도 (0-1)
  duration: number;           // 지속 시간
  startTime: number;          // 시작 시점

  // 효과
  effects: DisasterEffect[];
}

interface DisasterEffect {
  type: 'temperature' | 'atmosphere' | 'terrain' | 'organisms';
  modifier: number;
  condition?: (target: any) => boolean;
}

// 운석 충돌 예시
const meteorImpact: Disaster = {
  type: DisasterType.METEOR_IMPACT,
  position: { x: 500, y: 300 },
  radius: 50,
  intensity: 0.8,
  duration: 100,
  startTime: currentTime,
  effects: [
    // 충돌 지점 즉시 파괴
    { type: 'terrain', modifier: -1 },
    // 전역 온도 하락 (먼지구름)
    { type: 'temperature', modifier: -15 },
    // 광합성 감소
    { type: 'atmosphere', modifier: -0.3 }
  ]
};
```

### 3.3 재앙 UI 패널

```typescript
interface DisasterPanel {
  availableDisasters: DisasterType[];
  selectedDisaster: DisasterType | null;
  placementMode: boolean;

  // 강도 조절
  intensitySlider: number;

  // 재앙 히스토리
  history: AppliedDisaster[];
}

// 재앙 적용
function applyDisaster(type: DisasterType, position: Position, intensity: number) {
  const disaster = createDisaster(type, position, intensity);

  // 즉시 효과
  applyImmediateEffects(disaster);

  // 지속 효과 등록
  registerOngoingEffects(disaster);

  // 히스토리 기록
  recordDisasterHistory(disaster);
}
```

### 3.4 진화적 압력

재앙이 진화에 미치는 영향:

```typescript
interface EvolutionaryPressure {
  // 환경 압력
  temperaturePressure: number;
  humidityPressure: number;
  radiationPressure: number;

  // 생존 압력
  predationPressure: number;
  starvationPressure: number;
  diseasePressure: number;

  // 적합도 계산에 반영
  calculateFitness(organism: Organism): number;
}

// 재앙 후 적응
function postDisasterAdaptation(population: Species[], disaster: Disaster) {
  for (const species of population) {
    // 재앙에 취약한 특성을 가진 개체 필터링
    const survivors = species.organisms.filter(org =>
      calculateSurvivalChance(org, disaster) > Math.random()
    );

    // 생존자 기반 재구성
    species.organisms = survivors;

    // 병목 효과 - 유전적 다양성 감소
    species.geneticDiversity = calculateDiversity(survivors);
  }
}
```

---

## 4. 상세 관찰 도구

### 4.1 개체 추적 시스템

```typescript
interface OrganismTracker {
  trackedOrganism: Organism | null;
  followMode: boolean;        // 카메라 추적

  // 실시간 데이터
  realtimeData: {
    position: Position;
    velocity: Vector2D;
    energy: number;
    currentAction: string;
    brainActivity: number[];
  };

  // 히스토리
  positionHistory: Position[];
  actionHistory: Action[];
  energyHistory: number[];
}

// 관찰 패널 데이터
interface ObservationData {
  // 기본 정보
  id: string;
  species: Species;
  generation: number;
  age: number;
  lifespan: number;

  // 신체 상태
  energy: number;
  health: number;
  hunger: number;
  reproductiveUrge: number;

  // 유전 정보
  genome: Genome;
  parentIds: [string, string];
  childrenCount: number;

  // AI 상태
  currentThought: string;
  brainVisualization: BrainViz;

  // 행동 로그
  recentActions: ActionLog[];
}
```

### 4.2 신경망 시각화

```typescript
interface BrainVisualization {
  // 뉴런 상태
  inputNeurons: NeuronState[];
  hiddenNeurons: NeuronState[];
  outputNeurons: NeuronState[];

  // 연결 강도
  connections: ConnectionState[];

  // 활성화 히트맵
  activationHistory: number[][];
}

interface NeuronState {
  id: number;
  label: string;
  activation: number;        // 현재 활성화 값 (0-1)
  position: { x: number; y: number }; // 시각화 위치
}

interface ConnectionState {
  from: number;
  to: number;
  weight: number;
  signalStrength: number;    // 현재 신호 강도
}

// 신경망 실시간 렌더링
function renderBrainActivity(brain: BrainVisualization, ctx: CanvasRenderingContext2D) {
  // 연결선 그리기 (가중치에 따른 두께/색상)
  for (const conn of brain.connections) {
    const color = conn.weight > 0 ? 'green' : 'red';
    const opacity = Math.abs(conn.signalStrength);
    drawConnection(ctx, conn, color, opacity);
  }

  // 뉴런 그리기 (활성화에 따른 밝기)
  for (const neuron of [...brain.inputNeurons, ...brain.hiddenNeurons, ...brain.outputNeurons]) {
    drawNeuron(ctx, neuron);
  }
}
```

### 4.3 가계도 시스템

```typescript
interface FamilyTree {
  rootOrganism: Organism;

  // 세대별 구조
  generations: Generation[];

  // 관계
  parentLinks: Map<string, [string, string]>;
  childLinks: Map<string, string[]>;

  // 시각화 설정
  maxGenerationsUp: number;   // 조상 몇 세대까지
  maxGenerationsDown: number; // 후손 몇 세대까지
}

interface Generation {
  level: number;
  organisms: OrganismNode[];
}

interface OrganismNode {
  organism: Organism;
  isAlive: boolean;
  x: number;                  // 트리 내 위치
  y: number;
  highlighted: boolean;
}

// 가계도 렌더링
function renderFamilyTree(tree: FamilyTree, ctx: CanvasRenderingContext2D) {
  // 세대별로 배치
  for (const gen of tree.generations) {
    for (const node of gen.organisms) {
      // 노드 그리기
      drawOrganismNode(ctx, node);

      // 부모 연결선
      const parents = tree.parentLinks.get(node.organism.id);
      if (parents) {
        drawParentConnections(ctx, node, parents);
      }
    }
  }
}
```

### 4.4 종 통계 대시보드

```typescript
interface SpeciesStatistics {
  species: Species;

  // 시계열 데이터
  populationHistory: TimeSeriesData;
  avgSizeHistory: TimeSeriesData;
  avgSpeedHistory: TimeSeriesData;
  avgIntelligenceHistory: TimeSeriesData;

  // 현재 분포
  geographicDistribution: HeatmapData;

  // 먹이사슬 위치
  foodChainPosition: number;
  preySpecies: Species[];
  predatorSpecies: Species[];

  // 유전적 다양성
  geneticDiversity: number;
  dominantTraits: Trait[];

  // 진화 이벤트
  evolutionEvents: EvolutionEvent[];
}

interface EvolutionEvent {
  time: number;
  type: 'speciation' | 'extinction' | 'adaptation' | 'mutation';
  description: string;
  significance: number;
}
```

### 4.5 전체 생태계 대시보드

```typescript
interface EcosystemDashboard {
  // 요약 통계
  summary: {
    totalOrganisms: number;
    totalSpecies: number;
    totalPlants: number;
    totalAnimals: number;
    extinctSpecies: number;
  };

  // 환경 상태
  environment: {
    globalTemperature: number;
    atmosphericO2: number;
    atmosphericCO2: number;
    seaLevel: number;
  };

  // 생물다양성 지수
  biodiversityIndex: number;

  // 에너지 흐름
  energyFlow: {
    solarInput: number;
    photosynthesis: number;
    herbivoreConsumption: number;
    carnivoreConsumption: number;
    decomposition: number;
  };

  // 최근 이벤트
  recentEvents: EcosystemEvent[];

  // 그래프 데이터
  charts: {
    populationOverTime: ChartData;
    speciesDiversity: ChartData;
    temperatureHistory: ChartData;
    atmosphereHistory: ChartData;
  };
}
```

---

## 5. 멀티스레드 최적화

### 5.1 Web Worker 구조

```typescript
// 메인 스레드
interface MainThread {
  renderLoop(): void;
  handleInput(): void;
  updateUI(): void;
  communicateWithWorkers(): void;
}

// 시뮬레이션 워커
interface SimulationWorker {
  processChunk(chunk: WorldChunk): ChunkResult;
  updateOrganisms(organisms: Organism[]): Organism[];
}

// AI 워커
interface AIWorker {
  computeBrains(organisms: Organism[]): Action[];
  trainNetwork(data: TrainingData): void;
}

// 환경 워커
interface EnvironmentWorker {
  updateClimate(chunks: WorldChunk[]): ClimateUpdate;
  simulateWater(waterSystem: WaterCycle): WaterUpdate;
}
```

### 5.2 데이터 공유

```typescript
// SharedArrayBuffer로 공유 메모리
const sharedBuffer = new SharedArrayBuffer(BUFFER_SIZE);

// 개체 위치 배열 (고속 접근)
const positionArray = new Float32Array(sharedBuffer, 0, MAX_ORGANISMS * 2);

// 개체 상태 배열
const stateArray = new Uint8Array(sharedBuffer, POSITION_OFFSET, MAX_ORGANISMS);

// Atomics로 동기화
Atomics.store(stateArray, index, newState);
Atomics.load(stateArray, index);
```

---

## 6. Phase 3 완료 기준

### 필수 기능 체크리스트

- [ ] 청크 기반 대륙 규모 세계
- [ ] 통계적 시뮬레이션 (원거리)
- [ ] 다양한 생태계 구역 (Biome)
- [ ] 물 순환 시스템
- [ ] 재앙 시스템 (최소 8종)
- [ ] 개체 상세 추적
- [ ] 신경망 실시간 시각화
- [ ] 가계도 시스템
- [ ] 종 통계 대시보드
- [ ] 생태계 전체 대시보드
- [ ] 멀티스레드 최적화

### 성능 지표

1. 1,000,000+ 개체 시뮬레이션 (통계적 포함)
2. 화면 내 10,000개체에서 30fps 이상
3. 청크 로드/언로드 지연 100ms 이하
4. 재앙 발생 시 프레임 드롭 최소화

---

## 7. 다음 단계 (Phase 4 예고)

Phase 3 완료 후:
- 저장/불러오기 완성
- UI/UX 개선
- 성능 최종 최적화
- 밸런싱 및 테스트
