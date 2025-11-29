/**
 * 질병 시스템 타입 정의
 *
 * 생명체가 감염될 수 있는 다양한 질병과 그 특성을 정의합니다.
 */

/**
 * 질병 타입 열거형
 */
export enum DiseaseType {
  // 바이러스성 질병
  COMMON_COLD = 'COMMON_COLD',           // 감기 - 가벼운 증상
  VIRAL_FLU = 'VIRAL_FLU',               // 독감 - 중간 증상
  PLAGUE = 'PLAGUE',                     // 흑사병 - 치명적

  // 세균성 질병
  BACTERIAL_INFECTION = 'BACTERIAL_INFECTION', // 세균 감염
  FOOD_POISONING = 'FOOD_POISONING',     // 식중독

  // 기생충
  PARASITE = 'PARASITE',                 // 기생충 - 에너지 흡수

  // 환경성 질병
  HEAT_STROKE = 'HEAT_STROKE',           // 열사병 - 고온 환경
  HYPOTHERMIA = 'HYPOTHERMIA',           // 저체온증 - 저온 환경
  RADIATION_SICKNESS = 'RADIATION_SICKNESS', // 방사능 병 - 태양 폭발 후
}

/**
 * 질병 증상
 */
export interface DiseaseSymptoms {
  speedReduction: number;      // 이동 속도 감소 (0~1, 0.3 = 30% 감소)
  energyDrainRate: number;     // 에너지 소모 증가율 (1.5 = 50% 더 소모)
  mortalityRate: number;       // 틱당 사망 확률 (0~1)
  reproductionBlock: boolean;  // 번식 불가 여부
  contagious: boolean;         // 전염성 여부
}

/**
 * 질병 설정 인터페이스
 */
export interface DiseaseConfig {
  type: DiseaseType;
  name: string;
  description: string;
  icon: string;

  // 감염 조건
  transmissionRate: number;    // 전염률 (0~1, 접촉 시)
  environmentalTrigger?: {     // 환경 조건으로 발생
    minTemperature?: number;   // 최소 온도 (이하면 발생)
    maxTemperature?: number;   // 최대 온도 (이상이면 발생)
    minDensity?: number;       // 최소 밀집도 (이상이면 발생)
  };

  // 진행
  incubationTime: number;      // 잠복기 (틱)
  duration: number;            // 지속 시간 (틱)

  // 증상
  symptoms: DiseaseSymptoms;

  // 면역
  immunityAfterRecovery: number; // 회복 후 면역 지속 시간 (틱)
  baseResistance: number;      // 기본 저항력 (0~1, 높을수록 감염 어려움)
}

/**
 * 생명체의 질병 상태
 */
export interface OrganismDiseaseState {
  diseaseType: DiseaseType | null;  // 현재 감염된 질병
  infectedAt: number;               // 감염된 틱
  incubating: boolean;              // 잠복기 중인지
  symptomatic: boolean;             // 증상이 나타나는지
  immunities: Map<DiseaseType, number>; // 면역 (질병 타입 -> 만료 틱)
}

/**
 * 모든 질병의 기본 설정
 */
export const DISEASE_CONFIGS: Map<DiseaseType, DiseaseConfig> = new Map([
  // 바이러스성 질병
  [DiseaseType.COMMON_COLD, {
    type: DiseaseType.COMMON_COLD,
    name: '감기',
    description: '가벼운 호흡기 질환으로 약간의 불편함을 유발합니다',
    icon: '🤧',
    transmissionRate: 0.3,
    incubationTime: 100,      // 100틱 잠복기
    duration: 500,            // 500틱 지속
    symptoms: {
      speedReduction: 0.1,    // 10% 속도 감소
      energyDrainRate: 1.2,   // 20% 에너지 추가 소모
      mortalityRate: 0.0001,  // 매우 낮은 사망률
      reproductionBlock: false,
      contagious: true,
    },
    immunityAfterRecovery: 2000,
    baseResistance: 0.3,
  }],

  [DiseaseType.VIRAL_FLU, {
    type: DiseaseType.VIRAL_FLU,
    name: '독감',
    description: '심각한 바이러스 감염으로 고열과 피로를 유발합니다',
    icon: '🤒',
    transmissionRate: 0.4,
    incubationTime: 150,
    duration: 800,
    symptoms: {
      speedReduction: 0.3,    // 30% 속도 감소
      energyDrainRate: 1.5,   // 50% 에너지 추가 소모
      mortalityRate: 0.001,   // 0.1% 사망률
      reproductionBlock: true,
      contagious: true,
    },
    immunityAfterRecovery: 3000,
    baseResistance: 0.4,
  }],

  [DiseaseType.PLAGUE, {
    type: DiseaseType.PLAGUE,
    name: '흑사병',
    description: '치명적인 전염병으로 빠르게 퍼지며 높은 사망률을 보입니다',
    icon: '💀',
    transmissionRate: 0.6,
    incubationTime: 50,       // 짧은 잠복기
    duration: 400,
    symptoms: {
      speedReduction: 0.5,    // 50% 속도 감소
      energyDrainRate: 2.0,   // 100% 에너지 추가 소모
      mortalityRate: 0.01,    // 1% 사망률 (매 틱마다!)
      reproductionBlock: true,
      contagious: true,
    },
    immunityAfterRecovery: 5000,
    baseResistance: 0.6,
  }],

  // 세균성 질병
  [DiseaseType.BACTERIAL_INFECTION, {
    type: DiseaseType.BACTERIAL_INFECTION,
    name: '세균 감염',
    description: '상처를 통해 감염되는 세균성 질환입니다',
    icon: '🦠',
    transmissionRate: 0.2,
    incubationTime: 200,
    duration: 600,
    symptoms: {
      speedReduction: 0.2,
      energyDrainRate: 1.4,
      mortalityRate: 0.002,
      reproductionBlock: false,
      contagious: false,      // 비전염성
    },
    immunityAfterRecovery: 1500,
    baseResistance: 0.3,
  }],

  [DiseaseType.FOOD_POISONING, {
    type: DiseaseType.FOOD_POISONING,
    name: '식중독',
    description: '오염된 음식을 먹어 발생하는 급성 질환입니다',
    icon: '🤮',
    transmissionRate: 0,      // 전염 안됨
    incubationTime: 30,       // 매우 짧은 잠복기
    duration: 200,            // 짧은 지속
    symptoms: {
      speedReduction: 0.4,
      energyDrainRate: 1.8,
      mortalityRate: 0.0005,
      reproductionBlock: true,
      contagious: false,
    },
    immunityAfterRecovery: 500,
    baseResistance: 0.2,
  }],

  // 기생충
  [DiseaseType.PARASITE, {
    type: DiseaseType.PARASITE,
    name: '기생충',
    description: '체내에 기생하며 영양분을 빼앗아갑니다',
    icon: '🪱',
    transmissionRate: 0.15,
    incubationTime: 300,
    duration: 1500,           // 오래 지속
    symptoms: {
      speedReduction: 0.1,
      energyDrainRate: 1.6,   // 지속적인 에너지 손실
      mortalityRate: 0.0002,
      reproductionBlock: false,
      contagious: true,       // 접촉으로 전염
    },
    immunityAfterRecovery: 1000,
    baseResistance: 0.35,
  }],

  // 환경성 질병
  [DiseaseType.HEAT_STROKE, {
    type: DiseaseType.HEAT_STROKE,
    name: '열사병',
    description: '극심한 더위로 인한 체온 조절 실패입니다',
    icon: '🥵',
    transmissionRate: 0,
    environmentalTrigger: {
      maxTemperature: 50,     // 50도 이상에서 발생
    },
    incubationTime: 10,
    duration: 300,
    symptoms: {
      speedReduction: 0.6,
      energyDrainRate: 2.5,
      mortalityRate: 0.005,
      reproductionBlock: true,
      contagious: false,
    },
    immunityAfterRecovery: 200,
    baseResistance: 0.4,
  }],

  [DiseaseType.HYPOTHERMIA, {
    type: DiseaseType.HYPOTHERMIA,
    name: '저체온증',
    description: '극심한 추위로 인한 체온 저하입니다',
    icon: '🥶',
    transmissionRate: 0,
    environmentalTrigger: {
      minTemperature: -10,    // -10도 이하에서 발생
    },
    incubationTime: 20,
    duration: 400,
    symptoms: {
      speedReduction: 0.5,
      energyDrainRate: 2.0,
      mortalityRate: 0.003,
      reproductionBlock: true,
      contagious: false,
    },
    immunityAfterRecovery: 200,
    baseResistance: 0.4,
  }],

  [DiseaseType.RADIATION_SICKNESS, {
    type: DiseaseType.RADIATION_SICKNESS,
    name: '방사능 병',
    description: '강한 방사선에 노출되어 발생하는 질환입니다',
    icon: '☢️',
    transmissionRate: 0,
    incubationTime: 100,
    duration: 1000,
    symptoms: {
      speedReduction: 0.3,
      energyDrainRate: 1.5,
      mortalityRate: 0.008,
      reproductionBlock: true,
      contagious: false,
    },
    immunityAfterRecovery: 0,  // 면역 없음
    baseResistance: 0.5,
  }],
]);

/**
 * 모든 질병 타입 목록 반환
 */
export function getAllDiseaseTypes(): DiseaseType[] {
  return Object.values(DiseaseType) as DiseaseType[];
}

/**
 * 전염성 질병만 반환
 */
export function getContagiousDiseases(): DiseaseType[] {
  return getAllDiseaseTypes().filter(type => {
    const config = DISEASE_CONFIGS.get(type);
    return config?.symptoms.contagious ?? false;
  });
}

/**
 * 환경 조건에 따른 질병 반환
 */
export function getEnvironmentalDiseases(temperature: number): DiseaseType[] {
  return getAllDiseaseTypes().filter(type => {
    const config = DISEASE_CONFIGS.get(type);
    if (!config?.environmentalTrigger) return false;

    const trigger = config.environmentalTrigger;
    if (trigger.maxTemperature !== undefined && temperature >= trigger.maxTemperature) {
      return true;
    }
    if (trigger.minTemperature !== undefined && temperature <= trigger.minTemperature) {
      return true;
    }
    return false;
  });
}
