# Phase 4: 완성 (Completion)

> 저장/불러오기, UI/UX 개선, 최적화, 밸런싱

## 목표

게임의 완성도를 높이고, 사용자 경험을 개선하며, 성능을 최적화하고, 게임 밸런스를 조정합니다.

---

## 1. 저장/불러오기 시스템 완성

### 1.1 세이브 데이터 구조

```typescript
interface SaveFile {
  // 메타 정보
  meta: {
    version: string;          // 게임 버전
    saveVersion: number;      // 세이브 포맷 버전
    createdAt: number;        // 생성 시각
    updatedAt: number;        // 수정 시각
    playTime: number;         // 플레이 시간 (초)
    name: string;             // 저장 슬롯 이름
    thumbnail: string;        // 미리보기 이미지 (base64)
  };

  // 세계 데이터
  world: {
    seed: number;             // 월드 시드
    config: WorldConfig;
    chunks: CompressedChunk[];
    atmosphere: Atmosphere;
    waterCycle: WaterCycleState;
  };

  // 시간 데이터
  time: {
    currentTick: number;
    currentYear: number;
    speed: number;
  };

  // 생명체 데이터
  organisms: {
    count: number;
    data: CompressedOrganism[];
  };

  // 종 데이터
  species: {
    active: Species[];
    extinct: ExtinctSpecies[];
  };

  // 통계 및 히스토리
  statistics: GameStatistics;
  history: HistoryEvent[];

  // 사용자 설정
  settings: UserSettings;
}
```

### 1.2 데이터 압축

```typescript
interface CompressionManager {
  // 청크 압축
  compressChunk(chunk: WorldChunk): CompressedChunk;
  decompressChunk(data: CompressedChunk): WorldChunk;

  // 생명체 압축
  compressOrganism(organism: Organism): CompressedOrganism;
  decompressOrganism(data: CompressedOrganism): Organism;

  // 신경망 압축
  compressBrain(brain: NeuralNetwork): CompressedBrain;
  decompressBrain(data: CompressedBrain): NeuralNetwork;
}

// 델타 인코딩 - 비슷한 데이터 압축
function deltaEncode(organisms: Organism[]): CompressedOrganism[] {
  const compressed: CompressedOrganism[] = [];

  // 종별로 그룹화
  const grouped = groupBySpecies(organisms);

  for (const [species, members] of grouped) {
    // 대표 개체 저장
    const template = members[0];
    compressed.push(fullEncode(template));

    // 나머지는 차이만 저장
    for (let i = 1; i < members.length; i++) {
      const diff = calculateDiff(template, members[i]);
      compressed.push(deltaOnlyEncode(diff));
    }
  }

  return compressed;
}
```

### 1.3 저장 슬롯 관리

```typescript
interface SaveSlotManager {
  slots: SaveSlot[];
  maxSlots: number;           // 최대 슬롯 수 (10개)

  // 자동 저장
  autoSaveInterval: number;   // 5분
  autoSaveSlot: SaveSlot;

  // 작업
  save(slotIndex: number, name: string): Promise<void>;
  load(slotIndex: number): Promise<void>;
  delete(slotIndex: number): Promise<void>;
  export(slotIndex: number): Promise<Blob>;  // 파일로 내보내기
  import(file: File): Promise<number>;       // 파일에서 가져오기
}

interface SaveSlot {
  index: number;
  isEmpty: boolean;
  meta?: SaveMeta;
  thumbnail?: string;
}

// UI 표시용 메타 정보
interface SaveMeta {
  name: string;
  year: number;
  organisms: number;
  species: number;
  playTime: string;           // "12:34:56" 형식
  savedAt: string;            // "2024-01-01 12:00" 형식
}
```

### 1.4 새 게임 옵션

```typescript
interface NewGameOptions {
  // 세계 설정
  worldSize: 'small' | 'medium' | 'large' | 'huge';
  seed?: number;              // 수동 시드 입력

  // 환경 설정
  climate: 'earth-like' | 'hot' | 'cold' | 'random';
  waterCoverage: number;      // 0-100%
  landmassType: 'continents' | 'islands' | 'pangaea';

  // 난이도 (생명 탄생 확률 등)
  difficulty: 'easy' | 'normal' | 'hard';

  // 선택적 설정
  enableDisasters: boolean;
  disasterFrequency: number;
}

// 새 게임 생성
async function createNewGame(options: NewGameOptions): Promise<void> {
  // 1. 진행률 표시 시작
  showProgressBar("세계 생성 중...");

  // 2. 세계 생성
  const world = await generateWorld(options);
  updateProgress(30);

  // 3. 초기 환경 설정
  await initializeEnvironment(world, options);
  updateProgress(60);

  // 4. 원시 수프 배치
  await placePrimordialSoup(world);
  updateProgress(90);

  // 5. 시뮬레이션 시작
  startSimulation(world);
  updateProgress(100);

  hideProgressBar();
}
```

---

## 2. UI/UX 개선

### 2.1 메인 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Evolution Simulator                                           [_][□][×]│
├────────────────────────────────────────────────────────┬────────────────┤
│                                                        │ 📊 대시보드    │
│                                                        │ ──────────────│
│                                                        │ 📅 년도: 1,234,567│
│                                                        │ 🦠 생물: 2.8M  │
│                                                        │ 🏷️ 종: 847    │
│                                                        │ 💀 멸종: 123   │
│                                                        │                │
│               [메인 시뮬레이션 뷰]                      │ ──────────────│
│                                                        │ 🌡️ 환경        │
│                                                        │ 온도: 18.3°C  │
│                                                        │ O₂: 21.2%     │
│                                                        │ CO₂: 0.04%    │
│                                                        │ 습도: 65%     │
│                                                        │                │
│                                                        │ ──────────────│
│                                                        │ 📈 개체수 추이 │
│                                                        │ [미니 그래프] │
├────────────────────────────────────────────────────────┴────────────────┤
│ ◀◀ ◀ [▶] ▶ ▶▶ │ 속도: [━━━━●━━━] 100x │ 🔍 [━━●━━━━] │ 📍 (234, 567) │
├─────────────────────────────────────────────────────────────────────────┤
│ [🗺️ 맵] [🔬 관찰] [🌋 재앙] [📊 통계] [⚙️ 설정] [💾 저장]              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 반응형 패널 시스템

```typescript
interface PanelSystem {
  panels: Panel[];
  layout: 'default' | 'compact' | 'expanded';

  // 패널 조작
  openPanel(type: PanelType): void;
  closePanel(type: PanelType): void;
  togglePanel(type: PanelType): void;

  // 레이아웃
  dockPanel(panel: Panel, position: DockPosition): void;
  floatPanel(panel: Panel, position: Position): void;
  resizePanel(panel: Panel, size: Size): void;
}

enum PanelType {
  DASHBOARD,      // 대시보드
  OBSERVATION,    // 관찰 패널
  SPECIES_LIST,   // 종 목록
  FAMILY_TREE,    // 가계도
  BRAIN_VIEW,     // 신경망 시각화
  DISASTER,       // 재앙 패널
  STATISTICS,     // 통계
  SETTINGS,       // 설정
  SAVE_LOAD       // 저장/불러오기
}
```

### 2.3 관찰 모드 개선

```typescript
interface ObservationMode {
  // 선택 모드
  selectionMode: 'single' | 'species' | 'area';

  // 추적 옵션
  followSelected: boolean;
  showPath: boolean;          // 이동 경로 표시
  showSenseRange: boolean;    // 감각 범위 표시
  showThoughts: boolean;      // AI 판단 말풍선

  // 비교 모드
  compareMode: boolean;
  comparedOrganisms: [Organism, Organism];

  // 필터
  filter: {
    species: Species | null;
    sizeRange: [number, number];
    ageRange: [number, number];
    showOnlyAlive: boolean;
  };
}
```

### 2.4 접근성 및 편의 기능

```typescript
interface AccessibilitySettings {
  // 시각
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';

  // 성능
  reducedMotion: boolean;
  limitParticles: boolean;
  simpleRendering: boolean;

  // 알림
  showNotifications: boolean;
  notificationDuration: number;
  soundEnabled: boolean;
  soundVolume: number;
}

interface ConvenienceFeatures {
  // 줌 단축키
  zoomPresets: ZoomPreset[];  // 1키: 대륙, 2키: 지역, 3키: 개체

  // 북마크
  bookmarks: Bookmark[];      // 위치 및 개체 북마크

  // 타임랩스
  timelapseMode: boolean;
  timelapseSpeed: number;

  // 스크린샷
  screenshotMode: 'viewport' | 'fullMap' | 'organism';
  screenshotFormat: 'png' | 'jpeg';
}
```

---

## 3. 성능 최적화

### 3.1 렌더링 최적화

```typescript
// 인스턴스 렌더링
class InstancedRenderer {
  private instanceBuffer: WebGLBuffer;
  private maxInstances: number;

  // 같은 종류의 개체를 한 번에 렌더링
  renderInstanced(organisms: Organism[], shader: Shader) {
    // 인스턴스 데이터 준비
    const instanceData = new Float32Array(organisms.length * INSTANCE_SIZE);

    for (let i = 0; i < organisms.length; i++) {
      const offset = i * INSTANCE_SIZE;
      instanceData[offset] = organisms[i].position.x;
      instanceData[offset + 1] = organisms[i].position.y;
      instanceData[offset + 2] = organisms[i].size;
      // ... 색상 등
    }

    // GPU로 전송 및 한 번에 렌더링
    gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, organisms.length);
  }
}

// 컬링 (화면 밖 제외)
function frustumCulling(organisms: Organism[], viewport: Rectangle): Organism[] {
  return organisms.filter(org => isInViewport(org.position, viewport));
}

// LOD 최적화
function optimizedRender(organisms: Organism[], camera: Camera) {
  const visible = frustumCulling(organisms, camera.viewport);

  // LOD별로 그룹화
  const byLOD = groupByLOD(visible, camera.zoom);

  // DOT 레벨: 점으로 일괄 렌더링
  renderDots(byLOD[LODLevel.DOT]);

  // SIMPLE 레벨: 단순 도형
  renderSimpleShapes(byLOD[LODLevel.SIMPLE]);

  // DETAILED 레벨: 상세 렌더링
  for (const org of byLOD[LODLevel.DETAILED]) {
    renderDetailed(org);
  }
}
```

### 3.2 시뮬레이션 최적화

```typescript
// 공간 해시 그리드
class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, Organism[]>;

  insert(organism: Organism) {
    const key = this.getKey(organism.position);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(organism);
  }

  query(position: Position, radius: number): Organism[] {
    const result: Organism[] = [];
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const cell = this.grid.get(`${x},${y}`);
        if (cell) {
          result.push(...cell.filter(org =>
            distance(org.position, position) <= radius
          ));
        }
      }
    }

    return result;
  }
}

// 배치 업데이트
function batchUpdate(organisms: Organism[], deltaTime: number) {
  // SIMD 스타일 배치 처리
  const positions = new Float32Array(organisms.length * 2);
  const velocities = new Float32Array(organisms.length * 2);

  // 데이터 추출
  for (let i = 0; i < organisms.length; i++) {
    positions[i * 2] = organisms[i].position.x;
    positions[i * 2 + 1] = organisms[i].position.y;
    velocities[i * 2] = organisms[i].velocity.x;
    velocities[i * 2 + 1] = organisms[i].velocity.y;
  }

  // 배치 연산
  for (let i = 0; i < positions.length; i++) {
    positions[i] += velocities[i] * deltaTime;
  }

  // 결과 적용
  for (let i = 0; i < organisms.length; i++) {
    organisms[i].position.x = positions[i * 2];
    organisms[i].position.y = positions[i * 2 + 1];
  }
}
```

### 3.3 메모리 최적화

```typescript
// 객체 풀링
class OrganismPool {
  private pool: Organism[] = [];
  private activeCount: number = 0;

  acquire(): Organism {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return new Organism();
  }

  release(organism: Organism) {
    organism.reset();  // 상태 초기화
    this.pool.push(organism);
  }
}

// 메모리 사용량 모니터링
interface MemoryMonitor {
  heapUsed: number;
  heapTotal: number;
  organismCount: number;
  chunkCount: number;

  // 경고 임계값
  warningThreshold: number;
  criticalThreshold: number;

  // 메모리 정리
  garbageCollect(): void;
  unloadDistantChunks(): void;
  compressOldHistory(): void;
}
```

### 3.4 프로파일링 도구

```typescript
interface Profiler {
  // 프레임 타이밍
  frameTime: number;
  fps: number;
  fpsHistory: number[];

  // 시스템별 시간
  timings: {
    simulation: number;
    rendering: number;
    ai: number;
    physics: number;
    environment: number;
  };

  // 병목 감지
  bottleneck: string | null;

  // 디버그 오버레이
  showOverlay: boolean;
}

// 디버그 오버레이 표시
function renderDebugOverlay(profiler: Profiler) {
  return `
    FPS: ${profiler.fps.toFixed(1)}
    Frame: ${profiler.frameTime.toFixed(2)}ms
    ──────────────
    Simulation: ${profiler.timings.simulation.toFixed(2)}ms
    Rendering: ${profiler.timings.rendering.toFixed(2)}ms
    AI: ${profiler.timings.ai.toFixed(2)}ms
    Physics: ${profiler.timings.physics.toFixed(2)}ms
    ──────────────
    Organisms: ${organismCount}
    Chunks: ${loadedChunks}
    Memory: ${(heapUsed / 1024 / 1024).toFixed(1)}MB
  `;
}
```

---

## 4. 게임 밸런싱

### 4.1 생존 밸런스

```typescript
interface BalanceParameters {
  // 에너지 경제
  energyFromFood: number;       // 먹이당 에너지
  energyFromPhotosynthesis: number;
  metabolismCost: number;       // 기초 대사 비용
  movementCost: number;         // 이동 비용
  reproductionCost: number;     // 번식 비용

  // 생존율
  baseSurvivalRate: number;     // 기본 생존율
  starvationThreshold: number;  // 굶주림 임계값
  predationSuccessRate: number; // 포식 성공률

  // 번식
  maturityAge: number;          // 성숙 나이
  reproductionCooldown: number; // 번식 쿨다운
  offspringCount: number;       // 자손 수
}

// 밸런스 조정 도구
class BalanceTuner {
  parameters: BalanceParameters;

  // 시뮬레이션 결과 분석
  analyzePopulationStability(): AnalysisResult {
    return {
      isStable: this.checkPopulationStability(),
      bottlenecks: this.findBottlenecks(),
      recommendations: this.generateRecommendations()
    };
  }

  // 자동 밸런싱
  autoBalance() {
    const analysis = this.analyzePopulationStability();

    if (analysis.bottlenecks.includes('starvation')) {
      this.parameters.energyFromFood *= 1.1;
    }

    if (analysis.bottlenecks.includes('overpopulation')) {
      this.parameters.reproductionCooldown *= 1.2;
    }
  }
}
```

### 4.2 진화 밸런스

```typescript
interface EvolutionBalance {
  // 돌연변이
  mutationRate: number;         // 돌연변이 확률
  mutationMagnitude: number;    // 변이 크기
  beneficialMutationChance: number;

  // 선택 압력
  selectionPressure: number;    // 선택 강도
  geneticDriftStrength: number; // 유전적 부동

  // 종 분화
  speciationThreshold: number;  // 종 분화 임계값
  reproductiveIsolation: number;
}

// 진화 속도 조절
function adjustEvolutionSpeed(current: EvolutionBalance, targetSpeed: number) {
  // 빠른 진화 원하면
  if (targetSpeed > 1) {
    current.mutationRate *= targetSpeed;
    current.selectionPressure *= targetSpeed;
  }
  // 느린 진화 원하면
  else {
    current.mutationRate *= targetSpeed;
    current.geneticDriftStrength *= (2 - targetSpeed);
  }
}
```

### 4.3 재앙 밸런스

```typescript
interface DisasterBalance {
  // 빈도
  naturalDisasterFrequency: number;
  minTimeBetweenDisasters: number;

  // 강도 범위
  intensityRange: [number, number];

  // 회복
  recoveryRate: number;         // 환경 회복 속도
  populationRecoveryRate: number;

  // 영향
  extinctionThreshold: number;  // 멸종 임계 인구
}

// 재앙 효과 조절
function calibrateDisasterEffects(disaster: Disaster, balance: DisasterBalance) {
  // 너무 강하면 완화
  if (estimateExtinctions(disaster) > balance.extinctionThreshold) {
    disaster.intensity *= 0.8;
  }

  // 회복 가능하도록 보장
  disaster.duration = Math.min(
    disaster.duration,
    calculateMaxRecoverableDuration(balance.recoveryRate)
  );
}
```

---

## 5. 테스트 및 QA

### 5.1 자동화 테스트

```typescript
// 단위 테스트
describe('Organism', () => {
  test('should consume energy over time', () => {
    const org = createTestOrganism();
    const initialEnergy = org.energy;

    updateOrganism(org, 100);  // 100틱 경과

    expect(org.energy).toBeLessThan(initialEnergy);
  });

  test('should reproduce when conditions met', () => {
    const org = createTestOrganism({ energy: 100, mature: true });

    const offspring = attemptReproduction(org);

    expect(offspring).not.toBeNull();
    expect(org.energy).toBeLessThan(100);
  });
});

// 통합 테스트
describe('Ecosystem', () => {
  test('should reach stable state', async () => {
    const world = createTestWorld();
    addInitialOrganisms(world, 1000);

    // 10000틱 시뮬레이션
    for (let i = 0; i < 10000; i++) {
      updateWorld(world);
    }

    const population = countOrganisms(world);
    expect(population).toBeGreaterThan(100);
    expect(population).toBeLessThan(10000);
  });
});
```

### 5.2 스트레스 테스트

```typescript
interface StressTest {
  // 대량 개체 테스트
  testMassivePopulation(count: number): TestResult;

  // 장시간 실행 테스트
  testLongRunning(hours: number): TestResult;

  // 극한 재앙 테스트
  testExtremeDisaster(): TestResult;

  // 메모리 누수 테스트
  testMemoryLeak(): TestResult;
}

// 성능 벤치마크
interface Benchmark {
  name: string;
  iterations: number;
  results: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
}
```

---

## 6. Phase 4 완료 기준

### 필수 기능 체크리스트

- [ ] 저장/불러오기 완전 구현
- [ ] 10개 저장 슬롯
- [ ] 자동 저장
- [ ] 새 게임 옵션
- [ ] UI 반응형 패널
- [ ] 접근성 설정
- [ ] 인스턴스 렌더링
- [ ] 공간 해시 최적화
- [ ] 객체 풀링
- [ ] 밸런스 파라미터 조정
- [ ] 프로파일러/디버그 모드

### 품질 지표

1. 크래시 없이 24시간 연속 실행
2. 메모리 누수 없음
3. 저장/불러오기 100% 성공
4. 다양한 브라우저 호환 (Chrome, Firefox, Safari, Edge)
5. 모든 재앙 시나리오 테스트 통과

---

## 7. 출시 준비

### 7.1 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 최적화 체크
npm run analyze

# 배포
npm run deploy
```

### 7.2 문서화

- 사용자 가이드
- 키보드 단축키 목록
- FAQ
- 알려진 이슈

### 7.3 향후 업데이트 계획

- 멀티플레이어 (공유 세계)
- 모바일 지원
- 추가 재앙 타입
- 생태계 시나리오
- 도전 과제 시스템

---

## 완료 시 예상 결과물

1. **완성된 웹 게임**
   - 빈 세계에서 시작하는 진화 시뮬레이션
   - 수백만 개체 동시 시뮬레이션
   - 실시간 관찰 및 분석 도구
   - 재앙을 통한 진화 개입

2. **안정적인 성능**
   - 60fps 유지 (일반 환경)
   - 30fps 이상 (대규모 시뮬레이션)
   - 메모리 효율적 관리

3. **풍부한 콘텐츠**
   - 다양한 생태계
   - 복잡한 먹이사슬
   - 눈에 보이는 진화
   - 다양한 재앙 시나리오
