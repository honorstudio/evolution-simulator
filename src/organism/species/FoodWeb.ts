/**
 * 먹이사슬 시스템
 *
 * 생태계의 먹이사슬 관계와 에너지 흐름을 관리합니다.
 * 생산자(식물) → 1차 소비자(초식동물) → 2차 소비자(육식동물)
 */

import type { SpeciesTraits, AnimalTraits, PredationResult } from './types';
import { attemptPredation, isValidFood } from './Animal';

/**
 * 영양 단계 (Trophic Level)
 */
export const TrophicLevel = {
  PRODUCER: 'producer',           // 생산자 (식물)
  PRIMARY_CONSUMER: 'primary',    // 1차 소비자 (초식동물)
  SECONDARY_CONSUMER: 'secondary', // 2차 소비자 (육식동물)
  TERTIARY_CONSUMER: 'tertiary',   // 3차 소비자 (최상위 포식자)
  DECOMPOSER: 'decomposer',        // 분해자
} as const;

export type TrophicLevel = typeof TrophicLevel[keyof typeof TrophicLevel];

/**
 * 먹이사슬 관계
 */
export interface FoodChainRelationship {
  /** 포식자 ID */
  predatorId: string;
  /** 피식자 ID */
  preyId: string;
  /** 관계 강도 (0-1) - 얼마나 자주 포식하는가 */
  strength: number;
  /** 마지막 포식 시도 시간 */
  lastInteraction: number;
}

/**
 * 에너지 전달 효율
 * 생태계에서 영양 단계를 거치며 에너지는 약 10%만 전달됩니다.
 */
const ENERGY_TRANSFER_EFFICIENCY = 0.1;

/**
 * 영양 단계 결정
 *
 * @description
 * 생물의 특성에 따라 어떤 영양 단계에 속하는지 판별합니다.
 *
 * @param traits - 생물 특성
 * @returns 영양 단계
 */
export function determineTrophicLevel(traits: SpeciesTraits): TrophicLevel {
  if (traits.type === 'plant') {
    return TrophicLevel.PRODUCER;
  }

  if (traits.type === 'fungus') {
    return TrophicLevel.DECOMPOSER;
  }

  if (traits.type === 'animal') {
    const animalTraits = traits as AnimalTraits;

    switch (animalTraits.diet) {
      case 'herbivore':
        return TrophicLevel.PRIMARY_CONSUMER;

      case 'carnivore':
        // 공격력으로 2차/3차 구분
        return animalTraits.attackPower > 60
          ? TrophicLevel.TERTIARY_CONSUMER
          : TrophicLevel.SECONDARY_CONSUMER;

      case 'omnivore':
        // 잡식은 공격력에 따라
        return animalTraits.attackPower > 50
          ? TrophicLevel.SECONDARY_CONSUMER
          : TrophicLevel.PRIMARY_CONSUMER;

      case 'detritivore':
        return TrophicLevel.DECOMPOSER;

      default:
        return TrophicLevel.PRIMARY_CONSUMER;
    }
  }

  return TrophicLevel.PRODUCER;
}

/**
 * 포식 가능 여부 판단
 *
 * @description
 * 두 생물 간의 포식 관계가 가능한지 판단합니다.
 *
 * @param predator - 포식자 특성
 * @param prey - 피식자 특성
 * @returns 포식 가능 여부
 */
export function canPredate(
  predator: SpeciesTraits,
  prey: SpeciesTraits
): boolean {
  // 식물은 포식 불가
  if (predator.type === 'plant') {
    return false;
  }

  // 같은 개체는 포식 불가
  if (predator === prey) {
    return false;
  }

  const predatorAnimal = predator as AnimalTraits;

  // 초식동물은 식물만
  if (prey.type === 'plant') {
    return isValidFood(predatorAnimal.diet, 'plant');
  }

  // 육식동물은 다른 동물만
  if (prey.type === 'animal') {
    return isValidFood(predatorAnimal.diet, 'animal');
  }

  return false;
}

/**
 * 에너지 획득 시뮬레이션
 *
 * @description
 * 생물이 먹이를 섭취하여 에너지를 얻는 과정을 시뮬레이션합니다.
 *
 * @param consumer - 소비자 특성
 * @param food - 먹이 특성
 * @param foodEnergy - 먹이의 에너지량
 * @returns 획득한 에너지
 */
export function consumeFood(
  consumer: SpeciesTraits,
  _food: SpeciesTraits,
  foodEnergy: number
): number {
  if (consumer.type === 'plant') {
    // 식물은 광합성만 (먹이 섭취 안 함)
    return 0;
  }

  const animalConsumer = consumer as AnimalTraits;

  // 소화 효율에 따라 에너지 획득
  let energyGained = foodEnergy * animalConsumer.digestiveEfficiency;

  // 영양 단계 간 에너지 손실 적용
  energyGained *= ENERGY_TRANSFER_EFFICIENCY;

  return energyGained;
}

/**
 * 포식-피식 상호작용 처리
 *
 * @description
 * 포식자와 피식자 간의 전투/도망 상황을 시뮬레이션합니다.
 *
 * @param predatorTraits - 포식자 특성
 * @param preyTraits - 피식자 특성
 * @param predatorEnergy - 포식자 현재 에너지
 * @param preyEnergy - 피식자 현재 에너지
 * @returns 포식 결과
 */
export function simulatePredation(
  predatorTraits: AnimalTraits,
  preyTraits: SpeciesTraits,
  predatorEnergy: number,
  preyEnergy: number
): PredationResult {
  // 피식자가 식물인 경우
  if (preyTraits.type === 'plant') {
    return {
      success: true,
      energyGained: consumeFood(predatorTraits, preyTraits, preyEnergy),
      damageToAttacker: 0,
      damageToDefender: preyEnergy, // 식물은 전부 소비됨
    };
  }

  // 피식자가 동물인 경우 - 전투 발생
  if (preyTraits.type === 'animal') {
    const preyAnimal = preyTraits as AnimalTraits;
    return attemptPredation(
      predatorTraits,
      preyAnimal,
      predatorEnergy,
      preyEnergy
    );
  }

  // 기타 경우
  return {
    success: false,
    energyGained: 0,
    damageToAttacker: 0,
    damageToDefender: 0,
  };
}

/**
 * 먹이 경쟁 계산
 *
 * @description
 * 여러 개체가 같은 먹이를 놓고 경쟁할 때 누가 먹이를 차지하는지 결정합니다.
 *
 * @param competitors - 경쟁자들의 특성 배열
 * @param competitorEnergies - 각 경쟁자의 에너지
 * @returns 승자의 인덱스
 */
export function resolveCompetition(
  competitors: AnimalTraits[],
  competitorEnergies: number[]
): number {
  if (competitors.length === 0) {
    return -1;
  }

  if (competitors.length === 1) {
    return 0;
  }

  // 경쟁력 점수 계산
  const scores = competitors.map((traits, index) => {
    const energy = competitorEnergies[index] || 0;

    // 공격력 + 방어력 + 속도 + 에너지 상태
    const combatScore = traits.attackPower + traits.defense + traits.speed * 0.3;
    const energyFactor = Math.min(1, energy / 100);

    return combatScore * energyFactor;
  });

  // 가장 높은 점수를 가진 경쟁자 찾기
  let winnerIndex = 0;
  let maxScore = scores[0];

  for (let i = 1; i < scores.length; i++) {
    const score = scores[i];
    if (score !== undefined && maxScore !== undefined && score > maxScore) {
      maxScore = score;
      winnerIndex = i;
    }
  }

  return winnerIndex;
}

/**
 * 생태계 균형 지표 계산
 *
 * @description
 * 각 영양 단계의 개체 수 비율을 계산하여 생태계 균형을 평가합니다.
 * 건강한 생태계는 피라미드 구조를 가집니다.
 *
 * @param organisms - 모든 생물 특성 배열
 * @returns 영양 단계별 개체 수
 */
export function calculateEcosystemBalance(
  organisms: SpeciesTraits[]
): Record<TrophicLevel, number> {
  const balance: Record<TrophicLevel, number> = {
    producer: 0,
    primary: 0,
    secondary: 0,
    tertiary: 0,
    decomposer: 0,
  };

  for (const organism of organisms) {
    const level = determineTrophicLevel(organism);
    balance[level]++;
  }

  return balance;
}

/**
 * 이상적인 개체 수 비율 (피라미드 구조)
 */
const IDEAL_RATIO = {
  producer: 100,
  primary: 30,
  secondary: 10,
  tertiary: 3,
  decomposer: 5,
};

/**
 * 생태계 건강도 평가
 *
 * @description
 * 현재 개체 수 비율이 이상적인 피라미드 구조에 얼마나 가까운지 평가합니다.
 *
 * @param balance - 영양 단계별 개체 수
 * @returns 건강도 점수 (0-1, 1이 최상)
 */
export function evaluateEcosystemHealth(
  balance: Record<TrophicLevel, number>
): number {
  const total = Object.values(balance).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return 0; // 생물 없음
  }

  // 각 영양 단계의 비율 계산
  const ratios = {
    producer: balance.producer / total,
    primary: balance.primary / total,
    secondary: balance.secondary / total,
    tertiary: balance.tertiary / total,
    decomposer: balance.decomposer / total,
  };

  // 이상적인 비율 계산
  const idealTotal = Object.values(IDEAL_RATIO).reduce((sum, val) => sum + val, 0);
  const idealRatios = {
    producer: IDEAL_RATIO.producer / idealTotal,
    primary: IDEAL_RATIO.primary / idealTotal,
    secondary: IDEAL_RATIO.secondary / idealTotal,
    tertiary: IDEAL_RATIO.tertiary / idealTotal,
    decomposer: IDEAL_RATIO.decomposer / idealTotal,
  };

  // 차이 계산 (낮을수록 좋음)
  let totalDifference = 0;
  for (const level of Object.keys(ratios) as TrophicLevel[]) {
    const difference = Math.abs(ratios[level] - idealRatios[level]);
    totalDifference += difference;
  }

  // 건강도 점수 (1에서 차이를 뺌)
  const healthScore = Math.max(0, 1 - totalDifference);

  return healthScore;
}

/**
 * 멸종 위기 종 판별
 *
 * @description
 * 개체 수가 너무 적어 멸종 위험이 있는 종을 찾습니다.
 *
 * @param balance - 영양 단계별 개체 수
 * @param threshold - 위험 임계값
 * @returns 위험한 영양 단계 목록
 */
export function findEndangeredLevels(
  balance: Record<TrophicLevel, number>,
  threshold: number = 5
): TrophicLevel[] {
  const endangered: TrophicLevel[] = [];

  for (const [level, count] of Object.entries(balance)) {
    if (count > 0 && count < threshold) {
      endangered.push(level as TrophicLevel);
    }
  }

  return endangered;
}

/**
 * 개체군 과잉 판별
 *
 * @description
 * 특정 영양 단계의 개체 수가 너무 많아 생태계 균형을 깨뜨리는지 판별합니다.
 *
 * @param balance - 영양 단계별 개체 수
 * @param level - 확인할 영양 단계
 * @returns 과잉 여부
 */
export function isOverpopulated(
  balance: Record<TrophicLevel, number>,
  level: TrophicLevel
): boolean {
  const total = Object.values(balance).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return false;
  }

  const ratio = balance[level] / total;
  const idealTotal = Object.values(IDEAL_RATIO).reduce((sum, val) => sum + val, 0);
  const idealRatio = IDEAL_RATIO[level] / idealTotal;

  // 이상적인 비율의 2배 이상이면 과잉
  return ratio > idealRatio * 2;
}
