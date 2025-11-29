/**
 * 원시 지구 환경 시스템 (Primordial Earth)
 *
 * 하드코딩된 시대 전환이 아닌, AI 생태계의 자연스러운 진화를 통해
 * 환경이 변화하는 시스템입니다.
 *
 * 핵심 메커니즘:
 * 1. 광합성 생물이 산소를 실제로 생산 → 대기 산소 증가
 * 2. 산소 농도에 따라 동물(호기성 생물) 생존 가능
 * 3. 생태계 구성에 따라 환경이 자연스럽게 변화
 */

import { Atmosphere } from './Atmosphere';

/**
 * 원시 지구 대기 설정
 * 산소가 거의 없는 초기 지구 환경
 */
export const PRIMORDIAL_ATMOSPHERE: Atmosphere = {
  oxygen: 0.001, // 거의 없음 (0.001%)
  carbonDioxide: 50000, // 5% = 50,000 ppm (현재의 100배 이상)
  globalTemperature: 45, // 뜨거운 원시 지구
  nitrogen: 10,
  other: 90, // CO₂, 수증기, 메탄 등
};

/**
 * 현대 지구 대기 (참고용)
 */
export const MODERN_ATMOSPHERE: Atmosphere = {
  oxygen: 21,
  carbonDioxide: 415,
  globalTemperature: 15,
  nitrogen: 78,
  other: 1,
};

/**
 * 생명 형태별 산소 요구량
 */
export const OXYGEN_REQUIREMENTS = {
  // 혐기성 생물 - 산소 필요 없음 (오히려 산소가 독)
  ANAEROBIC: { min: 0, max: 5 },

  // 호기성 원핵생물 (박테리아) - 약간의 산소 필요
  AEROBIC_PROKARYOTE: { min: 0.1, max: 100 },

  // 진핵생물 - 더 많은 산소 필요
  EUKARYOTE: { min: 2, max: 100 },

  // 다세포 생물 - 상당한 산소 필요
  MULTICELLULAR: { min: 5, max: 100 },

  // 복잡한 동물 - 높은 산소 필요
  COMPLEX_ANIMAL: { min: 10, max: 100 },
} as const;

/**
 * 환경 이벤트 타입
 */
export type EnvironmentEvent =
  | 'FIRST_LIFE' // 최초의 생명
  | 'PHOTOSYNTHESIS_START' // 광합성 시작
  | 'OXYGEN_RISING' // 산소 상승 중
  | 'GREAT_OXIDATION' // 대산화 사건 (산소 2% 돌파)
  | 'EUKARYOTE_POSSIBLE' // 진핵생물 가능
  | 'MULTICELLULAR_POSSIBLE' // 다세포 가능
  | 'ANIMAL_POSSIBLE' // 동물 가능
  | 'MASS_EXTINCTION'; // 대멸종

/**
 * 원시 지구 환경 관리자
 *
 * 생태계의 변화에 따라 환경이 자연스럽게 변화합니다.
 */
export class PrimordialEarthManager {
  // 현재 대기 상태
  private oxygen: number = PRIMORDIAL_ATMOSPHERE.oxygen;
  private carbonDioxide: number = PRIMORDIAL_ATMOSPHERE.carbonDioxide;
  private temperature: number = PRIMORDIAL_ATMOSPHERE.globalTemperature;

  // 통계
  private totalOxygenProduced: number = 0;
  private totalCarbonAbsorbed: number = 0;

  // 이벤트 콜백
  private onEvent?: (event: EnvironmentEvent, data?: Record<string, unknown>) => void;

  // 마일스톤 추적 (한 번만 발생)
  private milestones: Set<EnvironmentEvent> = new Set();

  constructor() {
    // 원시 대기로 시작
    this.reset();
  }

  /**
   * 원시 상태로 리셋
   */
  reset(): void {
    this.oxygen = PRIMORDIAL_ATMOSPHERE.oxygen;
    this.carbonDioxide = PRIMORDIAL_ATMOSPHERE.carbonDioxide;
    this.temperature = PRIMORDIAL_ATMOSPHERE.globalTemperature;
    this.totalOxygenProduced = 0;
    this.totalCarbonAbsorbed = 0;
    this.milestones.clear();
  }

  /**
   * 광합성에 의한 산소 생산
   *
   * 광합성 생물이 호출하여 실제로 대기 산소를 증가시킵니다.
   * 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
   *
   * @param amount - 생산된 산소량 (게임 단위)
   */
  produceOxygen(amount: number): void {
    // 산소 증가 (게임 진행을 위해 현실보다 빠르게)
    // 실제로는 수억 년 걸리지만, 게임에서는 몇 분 안에 진행 체감
    const oxygenIncrease = amount * 0.001; // 10배 빠르게
    this.oxygen = Math.min(30, this.oxygen + oxygenIncrease);

    // CO₂ 감소 (광합성은 CO₂를 소비)
    const co2Decrease = amount * 0.5;
    this.carbonDioxide = Math.max(280, this.carbonDioxide - co2Decrease);

    // 통계 업데이트
    this.totalOxygenProduced += amount;
    this.totalCarbonAbsorbed += co2Decrease;

    // 마일스톤 체크
    this.checkMilestones();
  }

  /**
   * 호흡에 의한 산소 소비
   *
   * 동물이 호흡하면 산소가 감소하고 CO₂가 증가합니다.
   *
   * @param amount - 소비된 산소량
   */
  consumeOxygen(amount: number): void {
    const oxygenDecrease = amount * 0.00005;
    this.oxygen = Math.max(0, this.oxygen - oxygenDecrease);

    // CO₂ 증가
    const co2Increase = amount * 0.3;
    this.carbonDioxide += co2Increase;
  }

  /**
   * 마일스톤 체크 및 이벤트 발생
   */
  private checkMilestones(): void {
    // 광합성 시작
    if (this.totalOxygenProduced > 0 && !this.milestones.has('PHOTOSYNTHESIS_START')) {
      this.milestones.add('PHOTOSYNTHESIS_START');
      this.triggerEvent('PHOTOSYNTHESIS_START');
    }

    // 산소 상승 (0.5% 돌파)
    if (this.oxygen >= 0.5 && !this.milestones.has('OXYGEN_RISING')) {
      this.milestones.add('OXYGEN_RISING');
      this.triggerEvent('OXYGEN_RISING', { oxygen: this.oxygen });
    }

    // 대산화 사건 (2% 돌파)
    if (this.oxygen >= 2 && !this.milestones.has('GREAT_OXIDATION')) {
      this.milestones.add('GREAT_OXIDATION');
      this.triggerEvent('GREAT_OXIDATION', { oxygen: this.oxygen });
      // 온도 감소 (온실가스 감소로 인한 냉각)
      this.temperature = Math.max(15, this.temperature - 10);
    }

    // 진핵생물 가능 (산소 2% 이상)
    if (this.oxygen >= OXYGEN_REQUIREMENTS.EUKARYOTE.min && !this.milestones.has('EUKARYOTE_POSSIBLE')) {
      this.milestones.add('EUKARYOTE_POSSIBLE');
      this.triggerEvent('EUKARYOTE_POSSIBLE');
    }

    // 다세포 가능 (산소 5% 이상)
    if (this.oxygen >= OXYGEN_REQUIREMENTS.MULTICELLULAR.min && !this.milestones.has('MULTICELLULAR_POSSIBLE')) {
      this.milestones.add('MULTICELLULAR_POSSIBLE');
      this.triggerEvent('MULTICELLULAR_POSSIBLE');
    }

    // 동물 가능 (산소 10% 이상)
    if (this.oxygen >= OXYGEN_REQUIREMENTS.COMPLEX_ANIMAL.min && !this.milestones.has('ANIMAL_POSSIBLE')) {
      this.milestones.add('ANIMAL_POSSIBLE');
      this.triggerEvent('ANIMAL_POSSIBLE');
    }
  }

  /**
   * 이벤트 발생
   */
  private triggerEvent(event: EnvironmentEvent, data?: Record<string, unknown>): void {
    console.log(`🌍 환경 이벤트: ${event}`, data || '');
    if (this.onEvent) {
      this.onEvent(event, data);
    }
  }

  /**
   * 이벤트 콜백 설정
   */
  setOnEvent(callback: (event: EnvironmentEvent, data?: Record<string, unknown>) => void): void {
    this.onEvent = callback;
  }

  /**
   * 특정 생명 형태가 현재 환경에서 생존 가능한지 확인
   */
  canSurvive(lifeType: keyof typeof OXYGEN_REQUIREMENTS): boolean {
    const requirement = OXYGEN_REQUIREMENTS[lifeType];
    return this.oxygen >= requirement.min && this.oxygen <= requirement.max;
  }

  /**
   * 동물 생존 가능 여부 (초식/육식/잡식)
   */
  canAnimalsSurvive(): boolean {
    return this.oxygen >= OXYGEN_REQUIREMENTS.COMPLEX_ANIMAL.min;
  }

  /**
   * 다세포 진화 가능 여부
   */
  canMulticellularEvolve(): boolean {
    return this.oxygen >= OXYGEN_REQUIREMENTS.MULTICELLULAR.min;
  }

  /**
   * 현재 환경 정보 반환
   */
  getEnvironment(): {
    oxygen: number;
    carbonDioxide: number;
    temperature: number;
    totalOxygenProduced: number;
    era: string;
    eraDescription: string;
  } {
    return {
      oxygen: this.oxygen,
      carbonDioxide: this.carbonDioxide,
      temperature: this.temperature,
      totalOxygenProduced: this.totalOxygenProduced,
      era: this.getCurrentEra(),
      eraDescription: this.getEraDescription(),
    };
  }

  /**
   * 현재 시대 이름 (산소 농도 기반)
   */
  getCurrentEra(): string {
    if (this.oxygen < 0.01) return '명왕누대';
    if (this.oxygen < 0.1) return '초기 시생누대';
    if (this.oxygen < 1) return '후기 시생누대';
    if (this.oxygen < 5) return '원생누대';
    if (this.oxygen < 15) return '고생대';
    if (this.oxygen < 25) return '중생대';
    return '신생대';
  }

  /**
   * 현재 시대 설명
   */
  getEraDescription(): string {
    if (this.oxygen < 0.01) return '생명이 없는 불모의 세계';
    if (this.oxygen < 0.1) return '최초의 생명이 탄생할 수 있는 환경';
    if (this.oxygen < 1) return '광합성 생물이 산소를 생산 중';
    if (this.oxygen < 5) return '대산화 사건! 산소가 축적되고 있습니다';
    if (this.oxygen < 15) return '다세포 생물과 동물이 가능한 환경';
    if (this.oxygen < 25) return '복잡한 생태계가 가능한 환경';
    return '현대와 유사한 환경';
  }

  /**
   * 배경색 반환 (렌더링용)
   */
  getBackgroundColor(): number {
    if (this.oxygen < 0.01) return 0x2a0a0a; // 어두운 적색 (용암)
    if (this.oxygen < 0.1) return 0x0a1a2a; // 어두운 바다
    if (this.oxygen < 1) return 0x0a2030;
    if (this.oxygen < 5) return 0x1a3040;
    if (this.oxygen < 15) return 0x2a4050;
    return 0x3a6050; // 현대 지구
  }

  /**
   * 물 색상 반환 (렌더링용)
   */
  getWaterColor(): number {
    if (this.oxygen < 0.01) return 0x1a0505;
    if (this.oxygen < 0.1) return 0x1a3050;
    if (this.oxygen < 1) return 0x2a4060;
    if (this.oxygen < 5) return 0x3a6080;
    return 0x4080c0;
  }

  /**
   * 식량 생성률 배율
   */
  getFoodSpawnMultiplier(): number {
    if (this.oxygen < 0.01) return 0; // 생명 없음
    if (this.oxygen < 0.1) return 0.3;
    if (this.oxygen < 1) return 0.5;
    if (this.oxygen < 5) return 0.7;
    if (this.oxygen < 15) return 0.9;
    return 1.0;
  }

  /**
   * 돌연변이율 배율 (원시 환경일수록 높음 - 방사선 등)
   */
  getMutationMultiplier(): number {
    if (this.oxygen < 0.01) return 5;
    if (this.oxygen < 0.1) return 3;
    if (this.oxygen < 1) return 2;
    if (this.oxygen < 5) return 1.5;
    return 1.0;
  }

  /**
   * Atmosphere 형태로 반환 (기존 시스템과 호환)
   */
  getAtmosphere(): Atmosphere {
    return {
      oxygen: this.oxygen,
      carbonDioxide: this.carbonDioxide,
      globalTemperature: this.temperature,
      nitrogen: 78 - this.oxygen, // 산소 증가하면 질소 비율 감소
      other: 1,
    };
  }

  /**
   * 직렬화
   */
  serialize(): string {
    return JSON.stringify({
      oxygen: this.oxygen,
      carbonDioxide: this.carbonDioxide,
      temperature: this.temperature,
      totalOxygenProduced: this.totalOxygenProduced,
      totalCarbonAbsorbed: this.totalCarbonAbsorbed,
      milestones: Array.from(this.milestones),
    });
  }

  /**
   * 역직렬화
   */
  static deserialize(data: string): PrimordialEarthManager {
    const parsed = JSON.parse(data);
    const manager = new PrimordialEarthManager();
    manager.oxygen = parsed.oxygen;
    manager.carbonDioxide = parsed.carbonDioxide;
    manager.temperature = parsed.temperature;
    manager.totalOxygenProduced = parsed.totalOxygenProduced;
    manager.totalCarbonAbsorbed = parsed.totalCarbonAbsorbed;
    manager.milestones = new Set(parsed.milestones);
    return manager;
  }
}
