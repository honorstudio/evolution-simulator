/**
 * Organism 모듈
 * 단세포 생명체와 진화 시스템 (Phase 1)
 * 다세포 생물, 식물/동물 분화, 성선택 (Phase 2)
 */

// ===== Phase 1: 기본 시스템 =====
export { createRandomGenome, mutateGenome, crossoverGenome } from './Genome';
export type {
  Genome,
  Kingdom as GenomeKingdom,
  DietType as GenomeDietType,
  LocomotionType as GenomeLocomotionType,
  AppearanceGene,
  BodyShape,
  Symmetry,
  PatternType
} from './Genome';
export { Brain } from './Brain';
export { Food, spawnFood, spawnFoodRandom } from './Food';
export { Organism } from './Organism';
export { OrganismManager } from './OrganismManager';
export type { OrganismStats } from './OrganismManager';

// ===== Phase 2: 진화 시스템 =====

// 다세포 시스템
export {
  CellType,
  BodySymmetry,
  GermLayerCount,
  isMulticellular,
  CellDifferentiation,
  BodyPlanManager,
} from './multicellular';
export type {
  DifferentiatedCell,
  CellCluster,
  BodyPlan,
  MulticellularTraits,
  MulticellularOrganism,
} from './multicellular';

// 식물/동물 분화
export {
  TrophicLevel,
  determineTrophicLevel,
  canPredate,
  consumeFood,
  performPhotosynthesis,
  growPlant,
  createPlantTraits,
  calculateMovementCost,
  attemptPredation,
  createAnimalTraits,
  KingdomType,
  DietType,
  LocomotionType,
} from './species';
export type {
  PlantTraits,
  AnimalTraits,
  FoodChainRelationship,
} from './species';

// 프로시저럴 외형
export {
  createDefaultAppearanceGenome,
  cloneAppearanceGenome,
  ProceduralBodyGenerator,
} from './appearance';
export type {
  AppearanceGenome,
  BodyShapeGene,
  ColorGene,
  PatternGene,
  AppendageGene,
  TextureGene,
  GeneratedBody,
} from './appearance';

// 성선택/번식 시스템
export {
  MateEvaluator,
  CourtshipManager,
  SexualReproductionManager,
} from './reproduction';
export type {
  MateEvaluation,
  CourtshipResult,
  ReproductionResult,
  SexualOrganism,
} from './reproduction';

// 확장된 AI 시스템
export {
  AdvancedBrain,
  MemorySystem,
  SensorySystem,
  BehaviorExecutor,
  AIController,
  BrainOutput,
  SensoryInput,
} from './ai';
export type {
  AdvancedBrainConfig,
  Position as AIPosition,
  DetectedEntity,
  Memory as AIMemory,
  SensoryData,
  BehaviorDecision,
} from './ai';
