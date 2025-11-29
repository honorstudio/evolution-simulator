import { Organism } from './Organism';
import { Food, spawnFoodRandom } from './Food';
import { createRandomGenome, DietType, createPhytoplanktonGenome, createZooplanktonGenome } from './Genome';
import {
  MulticellularTraits,
  CellType,
  BodySymmetry,
  GermLayerCount,
} from './multicellular/types';
import { type EnvironmentData } from './multicellular/MulticellularManager';
import { areSexesCompatible } from './reproduction/helpers';
import type { WorldContext, OrganismData, FoodData } from './ai/SensorySystem';

/**
 * 간단한 공간 해시 그리드 (Organism 전용)
 * O(n²) 검색을 O(n)에 가깝게 줄여 성능 향상
 */
class OrganismSpatialHash {
  private cellSize: number;
  private grid: Map<string, Organism[]>;

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(organism: Organism): void {
    const key = this.getKey(organism.x, organism.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(organism);
  }

  /**
   * 특정 위치 주변의 생명체 조회
   */
  query(x: number, y: number, radius: number): Organism[] {
    const results: Organism[] = [];

    // 검색 영역의 셀 범위 계산
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    const radiusSquared = radius * radius;

    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cell = this.grid.get(key);
        if (!cell) continue;

        for (const organism of cell) {
          const dx = organism.x - x;
          const dy = organism.y - y;
          if (dx * dx + dy * dy <= radiusSquared) {
            results.push(organism);
          }
        }
      }
    }

    return results;
  }
}

/**
 * 간단한 공간 해시 그리드 (Food 전용)
 */
class FoodSpatialHash {
  private cellSize: number;
  private grid: Map<string, Food[]>;

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(food: Food): void {
    const key = this.getKey(food.x, food.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(food);
  }

  query(x: number, y: number, radius: number): Food[] {
    const results: Food[] = [];

    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    const radiusSquared = radius * radius;

    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cell = this.grid.get(key);
        if (!cell) continue;

        for (const food of cell) {
          if (food.isConsumed) continue;
          const dx = food.x - x;
          const dy = food.y - y;
          if (dx * dx + dy * dy <= radiusSquared) {
            results.push(food);
          }
        }
      }
    }

    return results;
  }
}

/**
 * 생명체 통계 정보
 */
export interface OrganismStats {
  totalOrganisms: number;
  aliveOrganisms: number;
  totalFood: number;
  availableFood: number;
  averageEnergy: number;
  averageAge: number;
  generation: number;
  // 추가 통계
  births: number;      // 이번 틱 출생
  deaths: number;      // 이번 틱 사망
  totalBirths: number; // 누적 출생
  totalDeaths: number; // 누적 사망
  plantCount: number;  // 식물 수
  animalCount: number; // 동물 수
  // 식단별 수
  herbivoreCount: number;  // 초식동물 수
  carnivoreCount: number;  // 육식동물 수
  omnivoreCount: number;   // 잡식동물 수
  // 플랑크톤 수
  phytoplanktonCount: number; // 식물성 플랑크톤 수
  zooplanktonCount: number;   // 동물성 플랑크톤 수
  // 추가 정보
  averageSpeed: number;    // 평균 속도
  averageSize: number;     // 평균 크기
  oldestAge: number;       // 가장 나이 많은 개체
  highestEnergy: number;   // 가장 에너지 높은 개체
  // Phase 2: 다세포 통계
  multicellularCount: number;  // 다세포 생물 수
  singleCellCount: number;     // 단세포 생물 수
}

/**
 * 생명체 매니저
 * 모든 생명체와 음식을 관리하고 시뮬레이션 진행
 */
export class OrganismManager {
  private organisms: Organism[] = [];
  private foods: Food[] = [];
  private generation: number = 0;

  // 월드 크기
  private worldWidth: number;
  private worldHeight: number;

  // 음식 자동 생성 설정 (비활성화됨 - 광합성 기반 생태계)
  // @ts-expect-error 레거시 호환성 유지
  private _foodSpawnRate: number = 0.1;
  private maxFood: number = 200;
  // @ts-expect-error 레거시 호환성 유지
  private _foodAccumulator: number = 0;

  // 통계 추적
  private tickBirths: number = 0;      // 이번 틱 출생
  private tickDeaths: number = 0;      // 이번 틱 사망
  private totalBirths: number = 0;     // 누적 출생
  private totalDeaths: number = 0;     // 누적 사망

  // 공간 해시 (성능 최적화)
  private organismHash: OrganismSpatialHash;
  private foodHash: FoodSpatialHash;

  // Phase 2: 다세포 진화 설정
  private multicellularEvolutionEnabled: boolean = true;
  private multicellularEvolutionCheckInterval: number = 5000; // 5초마다 체크
  private lastMulticellularCheck: number = 0;

  // Phase 2: 환경 데이터 (시뮬레이션에서 업데이트됨)
  private environmentData: EnvironmentData = {
    temperature: 0.5,
    sunlight: 0.7,
    foodAvailability: 0.5,
  };

  constructor(worldWidth: number = 2000, worldHeight: number = 2000) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // 공간 해시 초기화 (셀 크기는 일반적인 센서 범위의 2배 정도)
    this.organismHash = new OrganismSpatialHash(150);
    this.foodHash = new FoodSpatialHash(100);
  }

  /**
   * 원시 생명체 생성 (광합성 생물만)
   * 산소가 없는 원시 지구에서는 동물이 생존 불가
   */
  spawnPrimordialOrganisms(count: number): void {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const genome = createRandomGenome();

      // 원시 광합성 생물 (시아노박테리아 유사)
      genome.kingdom = 'plant';
      genome.diet = 'photosynthetic';
      genome.locomotion = 'sessile'; // 고착성
      genome.hue = 80 + Math.random() * 60; // 초록~노란색
      genome.saturation = 60 + Math.random() * 30;
      genome.size = 0.3 + Math.random() * 0.3; // 작은 크기
      genome.appearance.glow = 0.3 + Math.random() * 0.3;
      genome.habitat = 'water'; // 물에서만 생존

      const organism = new Organism(x, y, genome, undefined, undefined, this.useAdvancedAI);
      this.organisms.push(organism);
    }

    console.log(`🦠 ${count}개의 원시 광합성 생물 생성 완료`);
  }

  /**
   * 지정된 위치에 원시 생명체 생성 (물 타일 위치)
   * @param positions - 스폰할 위치 배열 [{x, y}, ...]
   */
  spawnPrimordialOrganismsAtPositions(positions: { x: number; y: number }[]): void {
    for (const pos of positions) {
      const genome = createRandomGenome();

      // 원시 광합성 생물 (시아노박테리아 유사)
      genome.kingdom = 'plant';
      genome.diet = 'photosynthetic';
      genome.locomotion = 'floating'; // 떠다니는 플랑크톤
      genome.hue = 80 + Math.random() * 60; // 초록~노란색
      genome.saturation = 60 + Math.random() * 30;
      genome.size = 0.3 + Math.random() * 0.3; // 작은 크기
      genome.appearance.glow = 0.3 + Math.random() * 0.3;
      genome.habitat = 'water'; // 물에서만 생존

      const organism = new Organism(pos.x, pos.y, genome, undefined, undefined, this.useAdvancedAI);
      this.organisms.push(organism);
    }

    console.log(`🦠 ${positions.length}개의 원시 광합성 생물 생성 완료 (물 타일에서)`);
  }

  /**
   * 동물만 생성 (산소가 충분해진 후)
   */
  spawnAnimals(count: number): void {
    // 초식 70%, 잡식 20%, 육식 10%
    const herbivoreCount = Math.floor(count * 0.7);
    const omnivoreCount = Math.floor(count * 0.2);
    const carnivoreCount = count - herbivoreCount - omnivoreCount;

    const diets: DietType[] = [
      ...Array(herbivoreCount).fill('herbivore'),
      ...Array(omnivoreCount).fill('omnivore'),
      ...Array(carnivoreCount).fill('carnivore'),
    ];

    // 섞기
    for (let i = diets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [diets[i], diets[j]] = [diets[j]!, diets[i]!];
    }

    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const genome = createRandomGenome();

      genome.kingdom = 'animal';
      genome.diet = diets[i] ?? 'herbivore';
      genome.locomotion = 'crawl'; // 이동성 (원시 동물은 기어다님)

      // 식성에 따른 색상
      if (genome.diet === 'herbivore') {
        genome.hue = 180 + Math.random() * 60; // 청록색
      } else if (genome.diet === 'carnivore') {
        genome.hue = 0 + Math.random() * 30; // 빨간색
      } else {
        genome.hue = 30 + Math.random() * 30; // 주황색
      }

      const organism = new Organism(x, y, genome, undefined, undefined, this.useAdvancedAI);
      this.organisms.push(organism);
    }

    console.log(`🐛 ${count}개의 동물 생성 완료 (초식: ${herbivoreCount}, 잡식: ${omnivoreCount}, 육식: ${carnivoreCount})`);
  }

  // ===== Phase 5.2: 플랑크톤 시스템 =====

  /**
   * 식물성 플랑크톤 스폰
   * 광합성을 통해 산소를 생산하는 최초의 생명체
   * @param positions 스폰할 물 위치 배열
   */
  spawnPhytoplankton(positions: { x: number; y: number }[]): void {
    for (const pos of positions) {
      const genome = createPhytoplanktonGenome();
      const organism = new Organism(pos.x, pos.y, genome, undefined, undefined, this.useAdvancedAI);
      this.organisms.push(organism);
    }

    console.log(`🌿 ${positions.length}개의 식물성 플랑크톤 생성 (물에서)`);
  }

  /**
   * 동물성 플랑크톤 스폰
   * 식물성 플랑크톤을 먹는 작은 동물
   * @param positions 스폰할 물 위치 배열
   */
  spawnZooplankton(positions: { x: number; y: number }[]): void {
    for (const pos of positions) {
      const genome = createZooplanktonGenome();
      const organism = new Organism(pos.x, pos.y, genome, undefined, undefined, this.useAdvancedAI);
      this.organisms.push(organism);
    }

    console.log(`🦐 ${positions.length}개의 동물성 플랑크톤 생성 (물에서)`);
  }

  /**
   * 식물성 플랑크톤 수 반환
   */
  getPhytoplanktonCount(): number {
    return this.organisms.filter(
      org => org.isAlive &&
             org.genome.planktonTraits?.isPlankton &&
             org.genome.planktonTraits?.planktonType === 'phyto'
    ).length;
  }

  /**
   * 동물성 플랑크톤 수 반환
   */
  getZooplanktonCount(): number {
    return this.organisms.filter(
      org => org.isAlive &&
             org.genome.planktonTraits?.isPlankton &&
             org.genome.planktonTraits?.planktonType === 'zoo'
    ).length;
  }

  /**
   * 초기 생명체 생성 (기존 방식 - 동물+식물)
   */
  spawnInitialOrganisms(count: number): void {
    // 20%는 식물, 80%는 동물로 시작
    const plantCount = Math.floor(count * 0.2);
    const animalCount = count - plantCount;

    // 식물 생성
    for (let i = 0; i < plantCount; i++) {
      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const genome = createRandomGenome();

      // 식물 특성으로 변경
      genome.kingdom = 'plant';
      genome.diet = 'photosynthetic';
      genome.locomotion = 'sessile';
      genome.hue = 80 + Math.random() * 60; // 초록~노란색 계열
      genome.saturation = 60 + Math.random() * 30;
      genome.appearance.glow = 0.3 + Math.random() * 0.3; // 발광 (광합성 표시)

      const organism = new Organism(x, y, genome, undefined, undefined, this.useAdvancedAI);
      this.organisms.push(organism);
    }

    // 동물 생성 (초식 60%, 잡식 30%, 육식 10%)
    const herbivoreCount = Math.floor(animalCount * 0.6);
    const omnivoreCount = Math.floor(animalCount * 0.3);
    const carnivoreCount = animalCount - herbivoreCount - omnivoreCount;

    const diets: DietType[] = [
      ...Array(herbivoreCount).fill('herbivore'),
      ...Array(omnivoreCount).fill('omnivore'),
      ...Array(carnivoreCount).fill('carnivore'),
    ];

    // 섞기
    for (let i = diets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [diets[i], diets[j]] = [diets[j]!, diets[i]!];
    }

    for (let i = 0; i < animalCount; i++) {
      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const genome = createRandomGenome();

      // 동물 특성 설정
      genome.kingdom = 'animal';
      genome.diet = diets[i] ?? 'omnivore';

      // 식성에 따른 색상 힌트
      if (genome.diet === 'herbivore') {
        genome.hue = 180 + Math.random() * 60; // 청록색 계열
      } else if (genome.diet === 'carnivore') {
        genome.hue = 0 + Math.random() * 30; // 빨간색 계열
      } else {
        genome.hue = 30 + Math.random() * 30; // 주황색 계열 (잡식)
      }

      const organism = new Organism(x, y, genome, undefined, undefined, this.useAdvancedAI);
      this.organisms.push(organism);
    }

    console.log(`${count}개의 초기 생명체 생성 완료 (식물: ${plantCount}, 초식: ${herbivoreCount}, 잡식: ${omnivoreCount}, 육식: ${carnivoreCount})`);
  }

  /**
   * 음식 생성
   */
  spawnFood(count: number): void {
    const newFoods = spawnFoodRandom(
      count,
      0,
      this.worldWidth,
      0,
      this.worldHeight,
      [20, 40]
    );

    this.foods.push(...newFoods);
  }

  /**
   * 특정 위치에 음식 생성
   */
  spawnFoodAt(x: number, y: number, energy: number = 30): void {
    this.foods.push(new Food(x, y, energy));
  }

  // 고급 AI 사용 설정
  // 주의: true로 설정하면 규칙 기반 AI 사용 (진화하지 않음)
  // false로 설정하면 신경망 기반 AI 사용 (자연선택으로 진화)
  private useAdvancedAI: boolean = false;
  private currentTime: number = 0;

  /**
   * 고급 AI 모드 활성화/비활성화
   */
  setAdvancedAIMode(enabled: boolean): void {
    this.useAdvancedAI = enabled;

    // 모든 생명체에 적용
    for (const organism of this.organisms) {
      if (enabled) {
        organism.enableAdvancedAI();
      } else {
        organism.disableAdvancedAI();
      }
    }
  }

  /**
   * 고급 AI용 월드 컨텍스트 생성
   */
  private createWorldContext(): WorldContext {
    const organisms: OrganismData[] = this.organisms
      .filter(o => o.isAlive)
      .map(o => ({
        id: o.id,
        position: { x: o.x, y: o.y },
        isAlive: o.isAlive,
        energy: o.energy,
        species: o.genome.kingdom,
        reproductionReady: o.canReproduce(),
        isPredator: o.genome.diet === 'carnivore',
      }));

    const foods: FoodData[] = this.foods
      .filter(f => !f.isConsumed)
      .map(f => ({
        id: f.id,
        position: { x: f.x, y: f.y },
        nutritionValue: f.energy,
      }));

    return {
      organisms,
      foods,
      dangerLevel: 0, // 기본 위험도 (향후 재앙 시스템과 연동)
    };
  }

  /**
   * 모든 생명체 업데이트
   */
  update(delta: number): void {
    // 틱 통계 초기화
    this.tickBirths = 0;
    this.tickDeaths = 0;

    // 현재 시간 업데이트
    this.currentTime += delta;

    // 죽은 생명체와 먹힌 음식 제거
    this.cleanup();

    // 음식 자동 생성
    this.autoSpawnFood(delta);

    // === 공간 해시 업데이트 (성능 최적화) ===
    this.rebuildSpatialHashes();

    // 고급 AI용 월드 컨텍스트 (필요시)
    let worldContext: WorldContext | null = null;
    if (this.useAdvancedAI) {
      worldContext = this.createWorldContext();
    }

    // 각 생명체 업데이트
    for (const organism of this.organisms) {
      if (!organism.isAlive) continue;

      // 월드 경계 처리
      this.wrapPosition(organism);

      // 주변 감지 (공간 해시 사용)
      const nearbyOrganisms = this.getNearbyOrganisms(organism);
      const nearbyFood = this.getNearbyFood(organism);

      // 생각하고 행동 (AI 모드에 따라 분기)
      if (organism.useAdvancedAI && worldContext) {
        // 고급 AI 사용
        organism.thinkAdvanced(worldContext, this.currentTime);
        organism.act(delta);
      } else {
        // 기본 뇌 사용
        organism.sense(nearbyOrganisms, nearbyFood);
        organism.think();
        organism.act(delta);
      }

      // 먹이 시스템 (식성에 따라 다름)
      this.tryEatByDiet(organism, nearbyOrganisms);

      // 에너지 소비 및 나이 증가
      organism.update(delta);

      // 번식 시도
      this.tryReproduce(organism);
    }

    // Phase 2: 환경 데이터 업데이트
    this.environmentData.foodAvailability = this.calculateFoodAvailability();

    // Phase 2: 다세포 생물 업데이트
    this.updateMulticellularOrganisms(delta);

    // Phase 2: 다세포 진화 체크 (주기적으로)
    this.lastMulticellularCheck += delta;
    if (this.multicellularEvolutionEnabled &&
        this.lastMulticellularCheck >= this.multicellularEvolutionCheckInterval) {
      this.checkMulticellularEvolution();
      this.lastMulticellularCheck = 0;
    }
  }

  /**
   * 공간 해시 재구성 (매 프레임)
   */
  private rebuildSpatialHashes(): void {
    // 기존 해시 클리어
    this.organismHash.clear();
    this.foodHash.clear();

    // 살아있는 생명체 등록
    for (const organism of this.organisms) {
      if (organism.isAlive) {
        this.organismHash.insert(organism);
      }
    }

    // 먹을 수 있는 음식 등록
    for (const food of this.foods) {
      if (!food.isConsumed) {
        this.foodHash.insert(food);
      }
    }
  }

  /**
   * 월드 경계 처리 (순환)
   */
  private wrapPosition(organism: Organism): void {
    if (organism.x < 0) organism.x += this.worldWidth;
    if (organism.x > this.worldWidth) organism.x -= this.worldWidth;
    if (organism.y < 0) organism.y += this.worldHeight;
    if (organism.y > this.worldHeight) organism.y -= this.worldHeight;
  }

  /**
   * 주변 생명체 찾기 (공간 해시 사용으로 O(n²) → O(n) 최적화)
   */
  private getNearbyOrganisms(organism: Organism): Organism[] {
    const range = organism.genome.sensorRange;

    // 공간 해시를 사용하여 근처 생명체만 조회
    const candidates = this.organismHash.query(organism.x, organism.y, range);

    // 자기 자신 제외
    return candidates.filter(other => other.id !== organism.id && other.isAlive);
  }

  /**
   * 주변 음식 찾기 (공간 해시 사용으로 O(n²) → O(n) 최적화)
   */
  private getNearbyFood(organism: Organism): Food[] {
    const range = organism.genome.sensorRange;

    // 공간 해시를 사용하여 근처 음식만 조회
    return this.foodHash.query(organism.x, organism.y, range);
  }

  /**
   * 식성에 따른 먹이 시도
   */
  private tryEatByDiet(organism: Organism, nearbyOrganisms: Organism[]): void {
    const diet = organism.genome.diet;

    // 광합성 생물은 먹이 안 먹음
    if (diet === 'photosynthetic') return;

    // 초식/잡식: Food 객체 먹기
    if (diet === 'herbivore' || diet === 'omnivore') {
      for (const food of this.foods) {
        if (organism.eat(food)) {
          break;
        }
      }
    }

    // 초식/잡식: 식물(Organism) 먹기
    if (diet === 'herbivore' || diet === 'omnivore') {
      for (const target of nearbyOrganisms) {
        if (!target.isAlive) continue;
        if (target.genome.kingdom !== 'plant') continue;

        if (this.tryEatOrganism(organism, target)) {
          break;
        }
      }
    }

    // 육식/잡식: 다른 동물 먹기
    if (diet === 'carnivore' || diet === 'omnivore') {
      for (const target of nearbyOrganisms) {
        if (!target.isAlive) continue;
        if (target.genome.kingdom !== 'animal') continue;
        if (target.id === organism.id) continue;

        // 자기보다 작은 동물만 먹을 수 있음
        if (target.genome.size >= organism.genome.size * 0.8) continue;

        if (this.tryEatOrganism(organism, target)) {
          break;
        }
      }
    }
  }

  /**
   * 다른 생명체 먹기 시도
   */
  private tryEatOrganism(predator: Organism, prey: Organism): boolean {
    if (!predator.isAlive || !prey.isAlive) return false;

    // 거리 확인
    const dx = prey.x - predator.x;
    const dy = prey.y - predator.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const eatRange = predator.getRadius() + prey.getRadius();

    if (distance > eatRange) return false;

    // 포식 성공 확률 계산
    let successChance = 0.5;

    // 크기 차이 (클수록 유리)
    const sizeDiff = predator.genome.size - prey.genome.size;
    successChance += sizeDiff * 0.3;

    // 속도 차이 (빠를수록 유리)
    const speedDiff = predator.genome.speed - prey.genome.speed;
    successChance += speedDiff * 0.2;

    // 에너지 상태
    const energyRatio = predator.energy / predator.maxEnergy;
    successChance += (energyRatio - 0.5) * 0.2;

    // 식물은 도망 못함
    if (prey.genome.kingdom === 'plant') {
      successChance = 0.9;
    }

    successChance = Math.max(0.1, Math.min(0.95, successChance));

    if (Math.random() > successChance) {
      // 포식 실패 - 에너지만 소비
      predator.energy -= 5;
      return false;
    }

    // 포식 성공!
    const energyGained = prey.energy * 0.7; // 70% 에너지 획득
    predator.energy = Math.min(predator.maxEnergy, predator.energy + energyGained);

    // 피식자 사망
    prey.isAlive = false;
    this.tickDeaths++;
    this.totalDeaths++;

    return true;
  }


  /**
   * 번식 시도 (무성 또는 유성 생식)
   */
  private tryReproduce(organism: Organism): void {
    if (!organism.canReproduce()) return;

    // 번식 욕구가 높으면 유성생식 시도
    if (organism.matingDesire > 0.5) {
      const partner = this.findMate(organism);
      if (partner) {
        const child = organism.reproduceWith(partner);
        if (child) {
          this.organisms.push(child);
          this.generation++;
          this.tickBirths++;
          this.totalBirths++;
          return;
        }
      }
    }

    // 유성생식 실패 또는 욕구가 낮으면 무성생식
    const child = organism.reproduce();
    if (child) {
      this.organisms.push(child);
      this.generation++;
      this.tickBirths++;
      this.totalBirths++;
    }
  }

  /**
   * 짝 찾기 (성별 호환성 + 매력도 기반)
   * Phase 2: 성선택 시스템 적용
   */
  private findMate(organism: Organism): Organism | null {
    const range = organism.genome.sensorRange * 1.5; // 짝 찾기는 더 넓은 범위
    let bestMate: Organism | null = null;
    let bestScore = -1;

    for (const other of this.organisms) {
      if (!other.isAlive || other.id === organism.id) continue;
      if (!other.canReproduce()) continue;
      if (!organism.isCompatibleWith(other)) continue;

      // Phase 2: 성별 호환성 체크
      if (!areSexesCompatible(organism.sex, other.sex)) continue;

      const dx = other.x - organism.x;
      const dy = other.y - organism.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > range) continue;

      // 점수 계산: 매력도, 건강도, 에너지, 거리 종합
      const proximityScore = 1 - (distance / range);
      const healthScore = other.health / 100;
      const energyScore = other.energy / other.maxEnergy;

      // Phase 2: 매력도 가중치 증가 (성선택 효과)
      const score =
        other.attractiveness * 0.4 +
        proximityScore * 0.2 +
        healthScore * 0.2 +
        energyScore * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestMate = other;
      }
    }

    return bestMate;
  }

  /**
   * 음식 자동 생성 (비활성화)
   *
   * 원시 지구 시뮬레이션에서는 음식이 자동 생성되지 않습니다.
   * 대신 광합성 생물이 태양광으로 에너지를 직접 생산하고,
   * 동물은 다른 생물을 먹어서 에너지를 얻습니다.
   */
  private autoSpawnFood(_delta: number): void {
    // 음식 자동 생성 비활성화
    // 실제 생태계: 태양 → 광합성 → 초식 → 육식

    // 기존 코드 (참고용):
    // this.foodAccumulator += this.foodSpawnRate * delta;
    // while (this.foodAccumulator >= 1 && this.foods.filter(f => !f.isConsumed).length < this.maxFood) {
    //   this.spawnFood(1);
    //   this.foodAccumulator -= 1;
    // }
  }

  /**
   * 죽은 생명체와 먹힌 음식 제거
   */
  cleanup(): void {
    // 죽은 생명체 수 계산
    const beforeCount = this.organisms.length;
    this.organisms = this.organisms.filter(org => org.isAlive);
    const removed = beforeCount - this.organisms.length;

    // 사망 통계 업데이트 (포식으로 인한 사망은 tryEatOrganism에서 이미 카운트됨)
    // 여기서는 에너지 고갈로 인한 자연사만 카운트
    // (tickDeaths가 아직 안 올라간 경우만)
    const naturalDeaths = removed - this.tickDeaths;
    if (naturalDeaths > 0) {
      this.tickDeaths += naturalDeaths;
      this.totalDeaths += naturalDeaths;
    }

    // 먹힌 음식 제거
    this.foods = this.foods.filter(food => !food.isConsumed);
  }

  /**
   * 죽은 생명체 제거 (명시적 호출용)
   */
  removeDeadOrganisms(): void {
    this.cleanup();
  }

  /**
   * 통계 정보 반환
   */
  getStatistics(): OrganismStats {
    const alive = this.organisms.filter(org => org.isAlive);
    const availableFood = this.foods.filter(food => !food.isConsumed);

    const totalEnergy = alive.reduce((sum, org) => sum + org.energy, 0);
    const totalAge = alive.reduce((sum, org) => sum + org.age, 0);
    const totalSpeed = alive.reduce((sum, org) => sum + org.genome.speed, 0);
    const totalSize = alive.reduce((sum, org) => sum + org.genome.size, 0);

    // 식물/동물 수 계산
    const plantCount = alive.filter(org => org.genome.kingdom === 'plant').length;
    const animalCount = alive.filter(org => org.genome.kingdom === 'animal').length;

    // 식단별 수 계산
    const herbivoreCount = alive.filter(org => org.genome.diet === 'herbivore').length;
    const carnivoreCount = alive.filter(org => org.genome.diet === 'carnivore').length;
    const omnivoreCount = alive.filter(org => org.genome.diet === 'omnivore').length;

    // 플랑크톤 수 계산
    const phytoplanktonCount = alive.filter(
      org => org.genome.planktonTraits?.isPlankton &&
             org.genome.planktonTraits?.planktonType === 'phyto'
    ).length;
    const zooplanktonCount = alive.filter(
      org => org.genome.planktonTraits?.isPlankton &&
             org.genome.planktonTraits?.planktonType === 'zoo'
    ).length;

    // 최고값 계산
    const oldestAge = alive.length > 0 ? Math.max(...alive.map(org => org.age)) : 0;
    const highestEnergy = alive.length > 0 ? Math.max(...alive.map(org => org.energy)) : 0;

    // Phase 2: 다세포/단세포 수 계산
    const multicellularCount = alive.filter(org => org.isMulticellular()).length;
    const singleCellCount = alive.length - multicellularCount;

    return {
      totalOrganisms: this.organisms.length,
      aliveOrganisms: alive.length,
      totalFood: this.foods.length,
      availableFood: availableFood.length,
      averageEnergy: alive.length > 0 ? totalEnergy / alive.length : 0,
      averageAge: alive.length > 0 ? totalAge / alive.length : 0,
      generation: this.generation,
      // 추가 통계
      births: this.tickBirths,
      deaths: this.tickDeaths,
      totalBirths: this.totalBirths,
      totalDeaths: this.totalDeaths,
      plantCount,
      animalCount,
      // 식단별 수
      herbivoreCount,
      carnivoreCount,
      omnivoreCount,
      // 플랑크톤 수
      phytoplanktonCount,
      zooplanktonCount,
      // 추가 정보
      averageSpeed: alive.length > 0 ? totalSpeed / alive.length : 0,
      averageSize: alive.length > 0 ? totalSize / alive.length : 0,
      oldestAge,
      highestEnergy,
      // Phase 2: 다세포 통계
      multicellularCount,
      singleCellCount,
    };
  }

  /**
   * 모든 살아있는 생명체 반환
   */
  getOrganisms(): Organism[] {
    return this.organisms.filter(org => org.isAlive);
  }

  /**
   * 모든 먹을 수 있는 음식 반환
   */
  getFoods(): Food[] {
    return this.foods.filter(food => !food.isConsumed);
  }

  /**
   * 음식 생성 속도 설정 (레거시 호환용)
   */
  setFoodSpawnRate(_rate: number): void {
    // 비활성화됨 - 광합성 기반 생태계
    // this._foodSpawnRate = rate;
  }

  /**
   * 최대 음식 개수 설정
   */
  setMaxFood(max: number): void {
    this.maxFood = max;
  }

  /**
   * 모든 생명체 제거
   */
  clear(): void {
    this.organisms = [];
    this.foods = [];
    this.generation = 0;
  }

  /**
   * 시뮬레이션 리셋
   *
   * 원시 지구 모드에서는 초기 음식을 생성하지 않습니다.
   * 광합성 생물이 에너지원입니다.
   */
  reset(initialOrganismCount: number, _initialFoodCount: number): void {
    this.clear();
    this.spawnInitialOrganisms(initialOrganismCount);
    // 음식 스폰 비활성화 - 광합성 생물이 에너지원
    // this.spawnFood(initialFoodCount);
  }

  // ===== Phase 2: 다세포 진화 시스템 =====

  /**
   * 다세포 진화 가능 여부 체크 및 진화 실행
   */
  private checkMulticellularEvolution(): void {
    for (const organism of this.organisms) {
      if (!organism.isAlive) continue;
      if (organism.isMulticellular()) continue; // 이미 다세포면 스킵

      // 진화 조건 체크
      if (this.canEvolveToMulticellular(organism)) {
        // 확률적으로 진화 (조건 만족해도 5% 확률)
        if (Math.random() < 0.05) {
          this.evolveToMulticellular(organism);
        }
      }
    }
  }

  /**
   * 다세포 진화 조건 확인
   */
  private canEvolveToMulticellular(organism: Organism): boolean {
    // 최소 나이 조건 (10초 = 10000ms)
    if (organism.age < 10000) return false;

    // 에너지 조건 (80% 이상)
    if (organism.energy < organism.maxEnergy * 0.8) return false;

    // 세대 조건 (3세대 이상)
    if (organism.generation < 3) return false;

    // 건강 조건 (90% 이상)
    if (organism.health < 90) return false;

    return true;
  }

  /**
   * 단세포를 다세포로 진화시킴
   */
  private evolveToMulticellular(organism: Organism): void {
    // 에너지 소비 (진화 비용)
    const evolutionCost = organism.maxEnergy * 0.3;
    organism.energy -= evolutionCost;

    // 다세포 특성 생성
    const multicellularTraits: MulticellularTraits = {
      isMulticellular: true,
      cellCluster: {
        cells: [
          // 초기 4개 세포 (모두 줄기세포)
          {
            id: `cell_${organism.id}_0`,
            type: CellType.STEM,
            position: { x: 0, y: -2 },
            specialization: 0,
            health: 1.0,
            age: 0,
            efficiency: 0.5,
            connectivity: 0.8,
          },
          {
            id: `cell_${organism.id}_1`,
            type: CellType.STEM,
            position: { x: 2, y: 0 },
            specialization: 0,
            health: 1.0,
            age: 0,
            efficiency: 0.5,
            connectivity: 0.8,
          },
          {
            id: `cell_${organism.id}_2`,
            type: CellType.STEM,
            position: { x: 0, y: 2 },
            specialization: 0,
            health: 1.0,
            age: 0,
            efficiency: 0.5,
            connectivity: 0.8,
          },
          {
            id: `cell_${organism.id}_3`,
            type: CellType.STEM,
            position: { x: -2, y: 0 },
            specialization: 0,
            health: 1.0,
            age: 0,
            efficiency: 0.5,
            connectivity: 0.8,
          },
        ],
        centerOfMass: { x: 0, y: 0 },
        bondStrength: 0.7,
        cohesion: 0.8,
        totalEnergy: organism.energy,
      },
      bodyPlan: {
        symmetry: BodySymmetry.RADIAL,
        germLayers: GermLayerCount.NONE,
        segmentCount: 0,
        hasNervousSystem: false,
        hasDigestiveSystem: false,
        hasMusculature: false,
        complexity: 0.1,
        organization: 0.2,
      },
      cellCount: 4,
      differentiation: 0,
      coordination: 0.5,
      metabolicEfficiency: 1.1, // 10% 효율 증가
      reproductiveCapacity: 0.3,
    };

    // 생명체에 다세포 특성 적용
    organism.setMulticellularTraits(multicellularTraits);

    console.log(`${organism.id} 다세포로 진화! (세대: ${organism.generation})`);
  }

  /**
   * 다세포 진화 활성화/비활성화
   */
  setMulticellularEvolution(enabled: boolean): void {
    this.multicellularEvolutionEnabled = enabled;
  }

  /**
   * 환경 데이터 업데이트 (시뮬레이션에서 호출)
   */
  updateEnvironment(data: Partial<EnvironmentData>): void {
    this.environmentData = { ...this.environmentData, ...data };
  }

  /**
   * 환경에 따른 음식 가용성 자동 계산
   */
  private calculateFoodAvailability(): number {
    const availableFood = this.foods.filter(f => !f.isConsumed).length;
    return Math.min(1, availableFood / this.maxFood);
  }

  /**
   * 다세포 생물 업데이트
   * 다세포 생물들의 세포 분화, 성장 등을 처리
   */
  private updateMulticellularOrganisms(_delta: number): void {
    for (const organism of this.organisms) {
      if (!organism.isAlive || !organism.isMulticellular()) continue;

      const traits = organism.multicellular;
      if (!traits) continue;

      // 세포 업데이트 (간소화된 버전)
      // 세포 수에 따른 에너지 효율 적용
      const cellCount = traits.cellCount;
      const metabolicBonus = traits.metabolicEfficiency;

      // 다세포는 광합성 시 더 많은 에너지 획득
      if (organism.genome.diet === 'photosynthetic') {
        const sunlightEnergy = this.environmentData.sunlight * 0.05 * cellCount * metabolicBonus;
        organism.energy = Math.min(organism.maxEnergy, organism.energy + sunlightEnergy);
      }

      // 세포 분열 조건 (에너지 충분하고, 세포 수가 한계 미만)
      if (organism.energy > organism.maxEnergy * 0.9 && cellCount < 16) {
        this.tryAddCell(organism);
      }
    }
  }

  /**
   * 다세포 생물에 세포 추가 시도
   */
  private tryAddCell(organism: Organism): void {
    const traits = organism.multicellular;
    if (!traits) return;

    // 세포 추가 비용
    const cost = 15;
    if (organism.energy < cost) return;

    // 확률적으로 세포 분열 (10% 확률)
    if (Math.random() > 0.1) return;

    // 세포 추가
    const newCellId = `cell_${organism.id}_${traits.cellCount}`;
    const angle = Math.random() * Math.PI * 2;
    const distance = 2;

    traits.cellCluster.cells.push({
      id: newCellId,
      type: CellType.STEM,
      position: {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      },
      specialization: 0,
      health: 1.0,
      age: 0,
      efficiency: 0.5,
      connectivity: 0.8,
    });

    traits.cellCount = traits.cellCluster.cells.length;
    organism.energy -= cost;

    // 대사 효율 업데이트
    const typeCount = new Set(traits.cellCluster.cells.map(c => c.type)).size;
    traits.metabolicEfficiency = 1.0 + typeCount * 0.05;
  }
}
