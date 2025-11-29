/**
 * 생물 분류 시스템 - 타입 정의
 *
 * 식물(Plant), 동물(Animal), 균류(Fungus) 등의 기본 타입을 정의합니다.
 */

/**
 * 생물 계(Kingdom) 분류
 */
export const KingdomType = {
  PLANT: 'plant',
  ANIMAL: 'animal',
  FUNGUS: 'fungus',
} as const;

export type KingdomType = typeof KingdomType[keyof typeof KingdomType];

/**
 * 이동 방식
 */
export const LocomotionType = {
  WALK: 'walk',
  SWIM: 'swim',
  FLY: 'fly',
  CRAWL: 'crawl',
  SESSILE: 'sessile', // 고착성 (움직이지 않음)
} as const;

export type LocomotionType = typeof LocomotionType[keyof typeof LocomotionType];

/**
 * 식성 타입
 */
export const DietType = {
  HERBIVORE: 'herbivore',    // 초식
  CARNIVORE: 'carnivore',    // 육식
  OMNIVORE: 'omnivore',      // 잡식
  PHOTOSYNTHESIS: 'photosynthesis', // 광합성
  DETRITIVORE: 'detritivore', // 부식질 섭취
} as const;

export type DietType = typeof DietType[keyof typeof DietType];

/**
 * 수분(꽃가루 전달) 방식
 */
export const PollinationType = {
  WIND: 'wind',     // 바람
  SELF: 'self',     // 자가수분
  ANIMAL: 'animal', // 동물 매개
  WATER: 'water',   // 물
} as const;

export type PollinationType = typeof PollinationType[keyof typeof PollinationType];

/**
 * 식물 특성 인터페이스
 */
export interface PlantTraits {
  /** 생물 타입 */
  readonly type: 'plant';

  /** 엽록소 농도 (0-1) - 광합성 효율에 영향 */
  chlorophyll: number;

  /** 잎 면적 (픽셀^2) - 광합성량에 영향 */
  leafArea: number;

  /** 광합성 속도 (에너지/초) */
  photosynthesisRate: number;

  /** 높이 (픽셀) */
  height: number;

  /** 뿌리 깊이 (픽셀) - 물 흡수에 영향 */
  rootDepth: number;

  /** 줄기 강도 (0-1) - 바람 저항력 */
  stemStrength: number;

  /** 씨앗 생산량 (개수/번식 주기) */
  seedProduction: number;

  /** 수분 방식 */
  pollinationType: PollinationType;

  /** 꽃 향기 강도 (0-1) - 동물 유인 */
  flowerFragrance: number;

  /** 꽃 색상 밝기 (0-1) - 동물 유인 */
  flowerBrightness: number;
}

/**
 * 동물 특성 인터페이스
 */
export interface AnimalTraits {
  /** 생물 타입 */
  readonly type: 'animal';

  /** 이동 방식 */
  locomotion: LocomotionType;

  /** 최대 이동 속도 (픽셀/초) */
  speed: number;

  /** 지구력 (0-1) - 오래 달릴 수 있는 능력 */
  stamina: number;

  /** 시각 범위 (픽셀) */
  visionRange: number;

  /** 시야각 (도, 0-360) */
  visionAngle: number;

  /** 청각 범위 (픽셀) */
  hearingRange: number;

  /** 후각 범위 (픽셀) */
  smellRange: number;

  /** 식성 */
  diet: DietType;

  /** 소화 효율 (0-1) - 음식에서 에너지를 얼마나 잘 추출하는가 */
  digestiveEfficiency: number;

  /** 공격력 (0-100) */
  attackPower: number;

  /** 방어력 (0-100) - 피해 감소 */
  defense: number;

  /** 독성 (0-1) - 피식자에게 피해 */
  venom: number;

  /** 위장 능력 (0-1) - 포식자 회피 */
  camouflage: number;
}

/**
 * 균류 특성 인터페이스 (미래 확장용)
 */
export interface FungusTraits {
  readonly type: 'fungus';
  decompositionRate: number;
  sporeProduction: number;
  myceliumGrowthRate: number;
}

/**
 * 모든 생물 특성의 유니온 타입
 */
export type SpeciesTraits = PlantTraits | AnimalTraits | FungusTraits;

/**
 * 광합성 입력 매개변수
 */
export interface PhotosynthesisInput {
  /** 햇빛 강도 (0-1) */
  sunlight: number;

  /** 온도 (섭씨) */
  temperature: number;

  /** 대기 중 CO2 농도 (0-1) */
  co2Level: number;

  /** 시간 델타 (초) */
  deltaTime: number;
}

/**
 * 포식 시도 결과
 */
export interface PredationResult {
  /** 포식 성공 여부 */
  success: boolean;

  /** 획득한 에너지 */
  energyGained: number;

  /** 포식자가 입은 피해 (반격) */
  damageToAttacker: number;

  /** 피식자가 입은 피해 */
  damageToDefender: number;
}

/**
 * 감각 입력 데이터
 */
export interface SensoryInput {
  /** 시야 내 객체들 */
  visibleObjects: Array<{
    id: string;
    distance: number;
    angle: number;
    type: 'food' | 'predator' | 'prey' | 'mate' | 'obstacle';
  }>;

  /** 청각으로 감지된 소리 */
  sounds: Array<{
    distance: number;
    intensity: number;
  }>;

  /** 후각으로 감지된 냄새 */
  scents: Array<{
    type: 'food' | 'predator' | 'mate';
    distance: number;
    intensity: number;
  }>;
}
