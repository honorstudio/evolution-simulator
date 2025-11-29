/**
 * 다세포 생물 시스템 진입점
 *
 * 모든 다세포 관련 타입, 클래스, 함수를 내보냅니다.
 */

// 타입 정의
export type {
  CellTypeValue,
  BodySymmetryValue,
  GermLayerCountValue,
  DifferentiatedCell,
  CellCluster,
  BodyPlan,
  MulticellularTraits,
  MulticellularOrganism,
  DifferentiationCondition,
  MulticellularTransitionCriteria,
  CellFunction,
} from './types';

export {
  CellType,
  BodySymmetry,
  GermLayerCount,
  isMulticellular,
  DEFAULT_TRANSITION_CRITERIA,
} from './types';

// 세포 분화 시스템
export { CellDifferentiation, CELL_FUNCTIONS } from './CellDifferentiation';

// 신체 계획 시스템
export { BodyPlanManager } from './BodyPlan';

// 다세포 생물 관리자 (Phase 2 통합 후 활성화 예정)
// export { MulticellularManager } from './MulticellularManager';
// export type { EnvironmentData } from './MulticellularManager';
