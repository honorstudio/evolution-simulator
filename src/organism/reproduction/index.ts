/**
 * 성선택 및 유성생식 시스템
 *
 * 이 모듈은 생명체의 성선택, 짝짓기, 유성생식을 담당합니다.
 *
 * @example
 * ```typescript
 * import {
 *   SexualReproductionManager,
 *   CourtshipManager,
 *   MateEvaluator
 * } from './reproduction';
 *
 * const reproduction = new SexualReproductionManager();
 * const courtship = new CourtshipManager();
 * const evaluator = new MateEvaluator();
 *
 * // 짝 평가
 * const evaluation = evaluator.evaluateMate(female, male);
 *
 * // 구애 진행
 * if (evaluation.accepted) {
 *   const courtshipResult = courtship.courtship(male, female);
 *
 *   // 번식
 *   if (courtshipResult.success) {
 *     const result = reproduction.createOffspring(male, female);
 *     if (result.success) {
 *       console.log('자식 생성 성공!', result.offspring);
 *     }
 *   }
 * }
 * ```
 */

// 타입 정의
export type {
  Sex,
  DisplayFeatureType,
  ColorGene,
  DisplayFeature,
  AttractivenessGenes,
  PreferenceGenes,
  CourtshipBehavior,
  SexualOrganism,
  MateEvaluation,
  VisualFeatures,
  CourtshipResult,
  ReproductionResult,
  CrossoverOptions,
} from './types';

// 클래스 및 함수
export { MateEvaluator } from './MateEvaluation';
export { CourtshipManager } from './Courtship';
export { SexualReproductionManager } from './SexualReproduction';

// 헬퍼 함수
export {
  initializeSexualTraits,
  determineRandomSex,
  generateRandomAttractiveness,
  generateRandomDisplayFeatures,
  generateRandomColor,
  generateRandomPreferences,
  generateRandomCourtshipBehavior,
  colorToHex,
  updateReproductiveStatus,
  replenishReproductiveEnergy,
  canMateNow,
  areSexesCompatible,
} from './helpers';
