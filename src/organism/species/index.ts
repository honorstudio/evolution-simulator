/**
 * 생물 분류 시스템 (Species System)
 *
 * 식물, 동물, 균류 등 다양한 생물 종의 특화된 행동과 특성을 관리합니다.
 */

// 타입 정의
export * from './types';

// 식물 시스템
export {
  performPhotosynthesis,
  growPlant,
  calculateSeedProduction,
  calculatePollinationChance,
  calculatePlantStress,
  absorbWater,
  createPlantTraits,
} from './Plant';

// 동물 시스템
export {
  calculateMovementCost,
  detectObject,
  attemptPredation,
  isValidFood,
  calculateEscapeDirection,
  calculatePursuitDirection,
  needsRest,
  createAnimalTraits,
} from './Animal';

// 먹이사슬 시스템
export {
  TrophicLevel,
  determineTrophicLevel,
  canPredate,
  consumeFood,
  simulatePredation,
  resolveCompetition,
  calculateEcosystemBalance,
  evaluateEcosystemHealth,
  findEndangeredLevels,
  isOverpopulated,
} from './FoodWeb';

export type { FoodChainRelationship } from './FoodWeb';
