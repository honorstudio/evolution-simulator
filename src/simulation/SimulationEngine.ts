/**
 * 시뮬레이션 엔진
 *
 * 게임의 핵심 로직을 담당합니다.
 * - 생명체 관리
 * - 물리 시뮬레이션
 * - 환경 업데이트
 * - 통계 수집
 * - 재앙 시스템 (Phase 3)
 */

import { TimeManager } from './Time';
import { StatisticsTracker, SimulationStats } from './Statistics';
import { SimulationConfig, DEFAULT_CONFIG } from './config';
import {
  World,
  PrimordialEarthManager,
  OXYGEN_REQUIREMENTS,
  getBiomeHabitat,
  isHabitatCompatible,
} from '../world';
import type { EnvironmentEvent, TileHabitatType } from '../world';
import { OrganismManager } from '../organism/OrganismManager';
import { DisasterManager, DisasterType, Disaster } from '../disaster';
import { DiseaseManager, DiseaseType as DiseaseTypeEnum, DiseaseStats } from '../disease';

export class SimulationEngine {
  // 하위 시스템
  private world: World | null = null;
  private organismManager: OrganismManager | null = null;
  private timeManager: TimeManager;
  private statistics: StatisticsTracker;
  private disasterManager: DisasterManager;
  private diseaseManager: DiseaseManager;

  // 원시 지구 환경 시스템 (AI 기반 자연 진화)
  private primordialEarth: PrimordialEarthManager;

  // 설정
  private config: SimulationConfig;

  // 상태
  private isRunning: boolean = false;

  // 광합성 산소 생성 타이머
  private photosynthesisTimer: number = 0;

  constructor() {
    this.timeManager = new TimeManager();
    this.statistics = new StatisticsTracker();
    this.config = DEFAULT_CONFIG;

    // Phase 3: 재앙 시스템 (자동 재앙 활성화 - 평균 5분마다 발생)
    this.disasterManager = new DisasterManager(50, true, 300000);

    // Phase 6: 질병 시스템
    this.diseaseManager = new DiseaseManager(30, 500);

    // 원시 지구 환경 - 산소 거의 없는 상태에서 시작
    this.primordialEarth = new PrimordialEarthManager();

    // 환경 이벤트 콜백 설정
    this.primordialEarth.setOnEvent((event, data) => {
      this.onEnvironmentEvent(event, data);
    });
  }

  /**
   * 새 게임 시작
   *
   * @param config 시뮬레이션 설정 (선택사항, 기본값 사용)
   */
  newGame(config?: SimulationConfig): void {
    // 설정 적용
    if (config) {
      this.config = config;
    }

    // 시스템 초기화
    this.timeManager.reset();
    this.statistics.reset();
    this.photosynthesisTimer = 0;

    // 원시 지구 환경 초기화 - 산소 거의 없는 상태에서 시작!
    this.primordialEarth.reset();

    // World 초기화 (시드 기반)
    this.world = new World();

    // 대기를 원시 상태로 설정
    this.applyPrimordialEnvironment();

    // OrganismManager 초기화
    this.organismManager = new OrganismManager(
      this.config.worldWidth,
      this.config.worldHeight
    );

    // 🦠 원시 지구에서는 광합성 생물(식물)만 시작!
    // 산소가 없으므로 동물은 생존 불가
    this.spawnPrimordialLife();

    const env = this.primordialEarth.getEnvironment();
    console.log('🌍 원시 지구 시뮬레이션 시작:', {
      era: env.era,
      description: env.eraDescription,
      oxygen: `${env.oxygen.toFixed(4)}%`,
      temperature: `${env.temperature}°C`,
      note: '광합성 생물이 산소를 생산해야 동물이 생존할 수 있습니다!',
    });
  }

  /**
   * 원시 생명체 생성
   * 산소가 없으므로 광합성 생물(식물성 플랑크톤)만 생성
   * 🌊 물에서만 스폰! (바다에서 생명 시작)
   */
  private spawnPrimordialLife(): void {
    if (!this.organismManager || !this.world) return;

    // 원시 지구에서는 식물성 플랑크톤으로 시작
    // 동물성 플랑크톤은 산소가 충분해지면 자연적으로 등장
    const phytoplanktonCount = 20; // 충분한 수의 원시 식물성 플랑크톤

    // 🌊 물 타일 좌표를 World에서 가져옴
    const waterPositions = this.world.getRandomWaterPositions(phytoplanktonCount);

    if (waterPositions.length === 0) {
      console.warn('⚠️ 물 타일을 찾을 수 없습니다. 랜덤 위치에 스폰합니다.');
      this.organismManager.spawnPrimordialOrganisms(phytoplanktonCount);
      return;
    }

    // 🌿 식물성 플랑크톤으로 스폰 (광합성, 산소 생산)
    this.organismManager.spawnPhytoplankton(waterPositions);

    console.log(`🌿 ${waterPositions.length}개의 식물성 플랑크톤 생성 (🌊 바다에서 시작)`);
  }

  /**
   * 환경 이벤트 처리 (산소 상승, 대산화 사건 등)
   */
  private onEnvironmentEvent(event: EnvironmentEvent, _data?: Record<string, unknown>): void {
    const env = this.primordialEarth.getEnvironment();

    switch (event) {
      case 'PHOTOSYNTHESIS_START':
        console.log('🌿 광합성 시작! 산소가 생성되기 시작합니다.');
        break;

      case 'OXYGEN_RISING':
        console.log(`📈 산소 농도 상승: ${env.oxygen.toFixed(2)}%`);
        break;

      case 'GREAT_OXIDATION':
        console.log('💨 대산화 사건! 산소가 2%를 돌파했습니다.');
        console.log('   혐기성 생물들이 대멸종 위기에 처합니다.');
        // 혐기성 생물 사망률 증가 (구현 필요시)
        break;

      case 'EUKARYOTE_POSSIBLE':
        console.log('🧬 진핵생물 진화 가능! 더 복잡한 세포 구조가 가능합니다.');
        break;

      case 'MULTICELLULAR_POSSIBLE':
        console.log('🔬 다세포 생물 가능! 세포들이 협력할 수 있습니다.');
        break;

      case 'ANIMAL_POSSIBLE':
        console.log('🐛 동물 가능! 산소가 충분해져 동물이 생존할 수 있습니다.');
        console.log('   식물성 플랑크톤의 번식 중 돌연변이로 동물이 진화할 수 있습니다.');
        // ❌ 강제 스폰 제거됨 - 모든 생명체는 돌연변이를 통해 자연 진화해야 함
        break;
    }

    // 환경 변화 적용
    this.applyPrimordialEnvironment();
  }

  /**
   * 원시 지구 환경 적용
   */
  private applyPrimordialEnvironment(): void {
    const atm = this.primordialEarth.getAtmosphere();

    // 대기 업데이트
    if (this.world) {
      const atmosphereManager = this.world.getAtmosphereManager();
      atmosphereManager.setOxygen(atm.oxygen);
      atmosphereManager.setCarbonDioxide(atm.carbonDioxide);
      atmosphereManager.setGlobalTemperature(atm.globalTemperature);
    }

    // 식량 생성률 조정 (환경에 따라)
    if (this.organismManager) {
      this.organismManager.setFoodSpawnRate(
        this.config.foodSpawnRate * this.primordialEarth.getFoodSpawnMultiplier()
      );
    }
  }

  /**
   * 메인 업데이트 (매 프레임 호출)
   *
   * @param delta 이전 프레임으로부터 경과한 시간 (밀리초)
   */
  update(delta: number): void {
    if (!this.isRunning) {
      return;
    }

    // 시간 관리자를 통해 조정된 delta 얻기
    const adjustedDelta = this.timeManager.update(delta);

    // 일시정지 상태면 업데이트하지 않음
    if (adjustedDelta === 0) {
      return;
    }

    // 시뮬레이션 틱 실행
    this.tick(adjustedDelta);

    // 통계 수집
    this.collectStatistics();
  }

  /**
   * 시뮬레이션 틱
   *
   * 게임의 핵심 로직이 실행되는 곳입니다.
   *
   * @param delta 조정된 시간 (게임 속도 적용됨)
   */
  private tick(delta: number): void {
    // 1. 재앙 시스템 업데이트 (Phase 3)
    this.disasterManager.update(delta, {
      minX: 0,
      maxX: this.config.worldWidth,
      minY: 0,
      maxY: this.config.worldHeight,
    });

    // 2. 재앙 효과를 생명체에 적용
    this.applyDisasterEffects();

    // 3. 생명체 업데이트
    if (this.organismManager) {
      // 센싱 -> 사고 -> 행동 -> 물리 -> 충돌 -> 에너지/번식
      this.organismManager.update(delta);
    }

    // 4. 음식 생성
    this.spawnFood(delta);

    // 5. 🌿 광합성 산소 생성 (AI 기반 자연 진화의 핵심!)
    this.processPhotosynthesis(delta);

    // 6. 🐛 산소 농도에 따른 동물 생존 체크
    this.checkAnimalSurvival();

    // 7. 🌊🏝️ 서식지 체크 - 물/육지 호환성
    this.checkHabitatSurvival();

    // 8. 🦠 질병 시스템 업데이트 (Phase 6)
    this.updateDiseaseSystem(delta);
  }

  /**
   * 광합성 처리 - 식물이 산소를 실제로 생산
   *
   * 이것이 AI 기반 자연 진화의 핵심!
   * 식물이 많을수록 → 산소 증가 → 동물 생존 가능
   *
   * 생태계 에너지 흐름:
   * ☀️ 태양 → 🌿 식물(광합성) → 🐛 초식동물 → 🦎 육식동물
   */
  private processPhotosynthesis(delta: number): void {
    if (!this.organismManager) return;

    this.photosynthesisTimer += delta;

    // 500ms마다 광합성 처리 (성능 최적화)
    if (this.photosynthesisTimer < 500) return;
    this.photosynthesisTimer = 0;

    const organisms = this.organismManager.getOrganisms();
    let totalOxygenProduced = 0;
    let totalOxygenConsumed = 0;
    let plantCount = 0;

    for (const organism of organisms) {
      if (!organism.isAlive) continue;

      const diet = organism.genome.diet;
      const planktonTraits = organism.genome.planktonTraits;

      if (diet === 'photosynthetic') {
        plantCount++;

        // 🌿 광합성 생물: 산소 생산 + 에너지 직접 획득!
        // 플랑크톤은 oxygenProduction 특성에 따라 산소 생산량 증가
        const planktonBonus = planktonTraits?.isPlankton ? planktonTraits.oxygenProduction : 0;
        const oxygenOutput = organism.genome.size * 0.1 * (organism.energy / organism.maxEnergy) * (1 + planktonBonus);
        totalOxygenProduced += oxygenOutput;

        // 광합성으로 에너지 직접 획득 (음식 필요 없음!)
        // 플랑크톤은 부력이 높을수록 햇빛 접근성 향상
        const buoyancyBonus = planktonTraits?.isPlankton ? planktonTraits.buoyancy * 0.3 : 0;
        const sunlight = 0.8 + buoyancyBonus; // 햇빛 강도
        const photosynthesisEfficiency = organism.genome.size * 0.15;
        const energyGain = sunlight * photosynthesisEfficiency;
        organism.energy = Math.min(organism.maxEnergy, organism.energy + energyGain);
      } else if (diet === 'filter_feeder') {
        // 🦐 동물성 플랑크톤: 여과 섭식으로 에너지 획득
        // 산소 소비
        const oxygenUsed = organism.genome.size * 0.03 * organism.genome.speed;
        totalOxygenConsumed += oxygenUsed;

        // 여과 섭식: 식물성 플랑크톤이 많을수록 에너지 획득
        const filterEfficiency = planktonTraits?.filterFeedingEfficiency ?? 0.5;
        const phytoCount = this.organismManager?.getPhytoplanktonCount() ?? 0;
        const filterEnergy = Math.min(0.3, phytoCount * 0.01 * filterEfficiency);
        organism.energy = Math.min(organism.maxEnergy, organism.energy + filterEnergy);
      } else {
        // 🐛 동물: 산소 소비 (호흡)
        const oxygenUsed = organism.genome.size * 0.05 * organism.genome.speed;
        totalOxygenConsumed += oxygenUsed;
      }
    }

    // 대기 산소 업데이트
    this.primordialEarth.produceOxygen(totalOxygenProduced);
    this.primordialEarth.consumeOxygen(totalOxygenConsumed);

    // ❌ 강제 스폰 제거됨 - 모든 진화는 돌연변이를 통해 자연적으로 발생
    // this.checkAndSpawnHerbivores(plantCount);
  }

  // ❌ 강제 스폰 함수 제거됨 (checkAndSpawnHerbivores)
  // 모든 생명체는 식물성 플랑크톤에서 시작하여 돌연변이를 통해 자연 진화해야 함
  // 동물, 동물성 플랑크톤 등은 번식 중 돌연변이로만 등장할 수 있음

  /**
   * 산소 부족 시 동물 생존 체크
   */
  private checkAnimalSurvival(): void {
    if (!this.organismManager) return;

    const env = this.primordialEarth.getEnvironment();
    const canAnimalsSurvive = this.primordialEarth.canAnimalsSurvive();

    if (!canAnimalsSurvive) {
      // 산소 부족 - 동물들이 서서히 사망
      const organisms = this.organismManager.getOrganisms();

      for (const organism of organisms) {
        if (!organism.isAlive) continue;
        if (organism.genome.diet === 'photosynthetic') continue; // 광합성 생물은 제외

        // 산소 부족으로 인한 사망 확률 (산소가 적을수록 높음)
        const survivalChance = env.oxygen / OXYGEN_REQUIREMENTS.COMPLEX_ANIMAL.min;
        if (Math.random() > survivalChance * 0.99) {
          organism.isAlive = false;
          // 사망 원인 로그 (디버깅용, 너무 많으면 제거)
          // console.log(`💀 ${organism.id} 산소 부족으로 사망 (O₂: ${env.oxygen.toFixed(2)}%)`);
        }
      }
    }
  }

  /**
   * 질병 시스템 업데이트
   * Phase 6: 질병 전파 및 상태 업데이트
   */
  private updateDiseaseSystem(delta: number): void {
    if (!this.organismManager) return;

    const organisms = this.organismManager.getOrganisms();
    const currentTick = this.timeManager.getTick();

    // 현재 환경 온도를 질병 시스템에 전달
    const env = this.primordialEarth.getEnvironment();
    this.diseaseManager.setTemperature(env.temperature);

    // 질병 시스템 업데이트
    this.diseaseManager.update(organisms, currentTick, delta);
  }

  /**
   * 서식지 불일치 시 사망 체크
   *
   * 물 생물이 육지에 있으면 즉시 사망 (건조)
   * 육지 생물이 물에 있으면 즉시 사망 (익사)
   * 양서류는 물과 해변에서만 생존 가능
   */
  private checkHabitatSurvival(): void {
    if (!this.organismManager || !this.world) return;

    const organisms = this.organismManager.getOrganisms();

    for (const organism of organisms) {
      if (!organism.isAlive) continue;

      // 생명체 위치의 타일 가져오기
      const tile = this.world.getTileAtPosition(organism.x, organism.y);
      if (!tile) continue;

      // 타일의 서식지 타입
      const tileHabitat = getBiomeHabitat(tile.biome);

      // 생명체의 서식지 타입
      const organismHabitat = organism.genome.habitat as TileHabitatType;

      // 서식지 호환성 체크
      if (!isHabitatCompatible(organismHabitat, tileHabitat)) {
        // 서식지 불일치 - 즉시 사망
        organism.isAlive = false;

        // 디버깅용 로그 (필요시 활성화)
        // console.log(`💀 ${organism.id} 서식지 불일치로 사망`,
        //   `(생물: ${organismHabitat}, 타일: ${tileHabitat})`);
      }

      // 해변에서 번식 시 양서 형질 강화 변이 가능
      // (이 로직은 번식 시스템에서 처리하는 것이 더 적절)
    }
  }

  /**
   * 재앙 효과를 생명체에 적용
   * Phase 3: 재앙 시스템
   */
  private applyDisasterEffects(): void {
    if (!this.organismManager) return;

    const organisms = this.organismManager.getOrganisms();
    const globalEffects = this.disasterManager.getGlobalEffects();

    // 전역 효과 합산
    const globalCombined = this.disasterManager.combineEffects(globalEffects);

    for (const organism of organisms) {
      if (!organism.isAlive) continue;

      // 해당 위치의 효과 가져오기
      const localEffects = this.disasterManager.getEffectsAtPosition(
        organism.x,
        organism.y
      );

      // 전역 + 로컬 효과 합산
      const allEffects = [...globalEffects, ...localEffects];
      const combined = this.disasterManager.combineEffects(allEffects);

      // 사망률 효과 적용
      const mortalityEffect = combined.get('mortality');
      if (mortalityEffect && mortalityEffect.value > 0) {
        // 확률적 사망 (매 틱마다 체크)
        if (Math.random() < mortalityEffect.value * 0.001) {
          organism.isAlive = false;
        }
      }

      // 돌연변이 효과 (번식 시 자동 적용되므로 여기선 플래그만)
      const mutationEffect = combined.get('mutation');
      if (mutationEffect && mutationEffect.value > 1) {
        // 돌연변이율 증가 효과는 Organism 내부에서 처리
        // 여기서는 환경 데이터로 전달
      }

      // 이동 속도 효과 적용
      const movementEffect = combined.get('movement');
      if (movementEffect) {
        // 일시적 속도 변경 (영구 변경 아님)
        // OrganismManager.environmentData에 전달하는 것이 더 좋음
      }
    }

    // 환경 데이터 업데이트 (온도, 식량 생성률 등)
    const tempEffect = globalCombined.get('temperature');
    const foodEffect = globalCombined.get('food');

    if (tempEffect || foodEffect) {
      const tempMod = tempEffect?.value ?? 0;
      const foodMod = foodEffect?.value ?? 1;

      this.organismManager.updateEnvironment({
        temperature: 0.5 + tempMod * 0.01, // 기본 0.5 ± 변화
      });

      // 식량 생성률 조절
      if (foodEffect && foodEffect.operation === 'multiply') {
        this.organismManager.setFoodSpawnRate(
          this.config.foodSpawnRate * foodMod
        );
      }
    }
  }

  /**
   * 음식 생성 (비활성화)
   *
   * 원시 지구 시뮬레이션에서는 음식이 "하늘에서 떨어지지 않습니다".
   * 대신:
   * - 광합성 생물(식물)이 태양광으로 에너지를 직접 생산
   * - 초식 동물은 식물을 먹어서 에너지 획득
   * - 육식 동물은 다른 동물을 먹어서 에너지 획득
   *
   * 이것이 실제 생태계의 먹이사슬입니다!
   */
  private spawnFood(_delta: number): void {
    // 음식 스폰 비활성화
    // 생태계는 광합성 → 초식 → 육식의 먹이사슬로 유지됩니다.

    // 기존 코드 (참고용, 비활성화됨):
    // this.foodSpawnTimer += delta;
    // if (this.foodSpawnTimer >= 1000) {
    //   this.foodSpawnTimer = 0;
    //   if (Math.random() < this.config.foodSpawnRate && this.organismManager) {
    //     this.organismManager.spawnFood(1);
    //   }
    // }
  }

  /**
   * 통계 수집
   *
   * 현재 게임 상태를 통계로 기록합니다.
   */
  private collectStatistics(): void {
    if (!this.organismManager) {
      return;
    }

    // OrganismManager에서 통계 가져오기
    const orgStats = this.organismManager.getStatistics();

    // 통계 객체 생성
    const stats: SimulationStats = {
      tick: this.timeManager.getTick(),
      organismCount: orgStats.aliveOrganisms,
      foodCount: orgStats.availableFood,
      averageEnergy: orgStats.averageEnergy,
      averageAge: orgStats.averageAge,
      averageSpeed: 1, // 기본값
      births: orgStats.births,
      deaths: orgStats.deaths,
      peakPopulation: 0, // StatisticsTracker에서 자동 계산
      oldestEverAge: 0, // StatisticsTracker에서 자동 계산
      totalBirths: orgStats.totalBirths,
      totalDeaths: orgStats.totalDeaths,
    };

    // 통계 기록
    this.statistics.record(stats);
  }

  /**
   * 시뮬레이션 시작
   */
  start(): void {
    this.isRunning = true;
    console.log('시뮬레이션 시작');
  }

  /**
   * 시뮬레이션 정지
   */
  stop(): void {
    this.isRunning = false;
    console.log('시뮬레이션 정지');
  }

  /**
   * 월드 접근
   */
  getWorld(): World | null {
    return this.world;
  }

  /**
   * 생명체 관리자 접근
   */
  getOrganismManager(): OrganismManager | null {
    return this.organismManager;
  }

  /**
   * 시간 관리자 접근
   */
  getTimeManager(): TimeManager {
    return this.timeManager;
  }

  /**
   * 통계 접근
   */
  getStatistics(): SimulationStats {
    return this.statistics.getCurrentStats();
  }

  /**
   * 통계 추적기 접근
   */
  getStatisticsTracker(): StatisticsTracker {
    return this.statistics;
  }

  /**
   * 현재 설정 반환
   */
  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  /**
   * 실행 중인지 확인
   */
  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  // ===== Phase 3: 재앙 시스템 API =====

  /**
   * 재앙 관리자 접근
   */
  getDisasterManager(): DisasterManager {
    return this.disasterManager;
  }

  /**
   * 재앙 발생 (UI에서 호출)
   */
  triggerDisaster(
    type: DisasterType,
    intensity?: number,
    position?: { x: number; y: number }
  ): Disaster | null {
    return this.disasterManager.triggerDisaster(type, intensity, position);
  }

  /**
   * 활성 재앙 목록
   */
  getActiveDisasters(): Disaster[] {
    return this.disasterManager.getActiveDisasters();
  }

  /**
   * 자동 재앙 활성화/비활성화
   */
  setAutoDisaster(enabled: boolean): void {
    this.disasterManager.setAutoDisasterEnabled(enabled);
  }

  // ===== 원시 지구 환경 API =====

  /**
   * 원시 지구 환경 관리자 접근
   */
  getPrimordialEarth(): PrimordialEarthManager {
    return this.primordialEarth;
  }

  /**
   * 현재 환경 정보 반환
   */
  getEnvironmentInfo(): {
    oxygen: number;
    carbonDioxide: number;
    temperature: number;
    era: string;
    eraDescription: string;
    canAnimalsSurvive: boolean;
    canMulticellularEvolve: boolean;
  } {
    const env = this.primordialEarth.getEnvironment();
    return {
      ...env,
      canAnimalsSurvive: this.primordialEarth.canAnimalsSurvive(),
      canMulticellularEvolve: this.primordialEarth.canMulticellularEvolve(),
    };
  }

  // ===== Phase 6: 질병 시스템 API =====

  /**
   * 질병 관리자 접근
   */
  getDiseaseManager(): DiseaseManager {
    return this.diseaseManager;
  }

  /**
   * 질병 발생시키기 (재앙/이벤트용)
   */
  triggerDiseaseOutbreak(
    disease: DiseaseTypeEnum,
    infectionRate: number = 0.1,
    position?: { x: number; y: number },
    radius?: number
  ): number {
    if (!this.organismManager) return 0;

    const organisms = this.organismManager.getOrganisms();
    const currentTick = this.timeManager.getTick();

    return this.diseaseManager.triggerOutbreak(
      disease,
      organisms,
      currentTick,
      infectionRate,
      position,
      radius
    );
  }

  /**
   * 질병 통계 반환
   */
  getDiseaseStats(): DiseaseStats {
    return this.diseaseManager.getStats();
  }

  /**
   * 현재 감염자 수 반환
   */
  getInfectedCount(): number {
    return this.diseaseManager.getInfectedCount();
  }
}
