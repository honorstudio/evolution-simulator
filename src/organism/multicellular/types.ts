/**
 * 다세포 생물 시스템 타입 정의
 *
 * 세포 분화, 신체 계획, 다세포 생물체의 핵심 타입들을 정의합니다.
 */

import type { Vector2D } from '../../types';
import type { Organism } from '../Organism';

/**
 * 세포 타입 상수
 *
 * 각 세포는 특정 기능을 가지며, 분화를 통해 이러한 타입으로 변화합니다.
 */
export const CellType = {
  STEM: 'stem',                     // 줄기 세포 (분화 전 상태)
  PHOTOSYNTHETIC: 'photosynthetic', // 광합성 세포 (식물)
  ROOT: 'root',                     // 뿌리 세포 (영양분 흡수)
  STRUCTURAL: 'structural',         // 구조 세포 (지지)
  SENSORY: 'sensory',              // 감각 세포 (환경 감지)
  NEURAL: 'neural',                 // 신경 세포 (정보 전달)
  MUSCLE: 'muscle',                 // 근육 세포 (운동)
  DIGESTIVE: 'digestive',          // 소화 세포 (에너지 생산)
  REPRODUCTIVE: 'reproductive',     // 생식 세포 (번식)
} as const;

export type CellTypeValue = typeof CellType[keyof typeof CellType];

/**
 * 신체 대칭성 타입
 */
export const BodySymmetry = {
  ASYMMETRIC: 'asymmetric',   // 비대칭 (단세포, 초기 다세포)
  RADIAL: 'radial',           // 방사 대칭 (해파리, 불가사리)
  BILATERAL: 'bilateral',     // 좌우 대칭 (대부분의 동물)
} as const;

export type BodySymmetryValue = typeof BodySymmetry[keyof typeof BodySymmetry];

/**
 * 배엽 수 (생물의 복잡도 지표)
 */
export const GermLayerCount = {
  NONE: 0,        // 세포 덩어리
  DIPLOBLASTIC: 2, // 2배엽 (해파리 등)
  TRIPLOBLASTIC: 3, // 3배엽 (대부분의 동물)
} as const;

export type GermLayerCountValue = typeof GermLayerCount[keyof typeof GermLayerCount];

/**
 * 분화된 세포
 *
 * 다세포 생물을 구성하는 개별 세포의 정보
 */
export interface DifferentiatedCell {
  id: string;
  type: CellTypeValue;
  position: Vector2D;        // 생물 내 상대 위치
  specialization: number;    // 분화도 (0~1, 높을수록 특화됨)
  health: number;            // 세포 건강도 (0~1)
  age: number;               // 세포 나이 (분화 이후 시간)

  // 세포 타입별 특성
  efficiency: number;        // 기능 효율성 (0~1)
  connectivity: number;      // 인접 세포와의 연결도 (0~1)
}

/**
 * 세포 클러스터
 *
 * 여러 세포가 결합된 구조의 정보
 */
export interface CellCluster {
  cells: DifferentiatedCell[];
  centerOfMass: Vector2D;    // 질량 중심
  bondStrength: number;      // 세포 간 결합력 (0~1)
  cohesion: number;          // 응집력 (0~1)
  totalEnergy: number;       // 클러스터 총 에너지
}

/**
 * 신체 계획 (Body Plan)
 *
 * 다세포 생물의 전체 구조와 조직화 방식
 */
export interface BodyPlan {
  symmetry: BodySymmetryValue;
  germLayers: GermLayerCountValue;
  segmentCount: number;      // 체절 수 (0이면 비체절)
  hasNervousSystem: boolean; // 신경계 보유 여부
  hasDigestiveSystem: boolean; // 소화계 보유 여부
  hasMusculature: boolean;   // 근육계 보유 여부

  // 구조적 특성
  complexity: number;        // 복잡도 (0~1)
  organization: number;      // 조직화 정도 (0~1)
}

/**
 * 다세포 생물 특화 속성
 *
 * 기존 Organism 인터페이스에 추가되는 다세포 전용 속성
 */
export interface MulticellularTraits {
  isMulticellular: true;
  cellCluster: CellCluster;
  bodyPlan: BodyPlan;

  // 다세포 생물 통계
  cellCount: number;
  differentiation: number;   // 전체 분화도 (0~1)
  coordination: number;      // 세포 간 협력도 (0~1)

  // 시스템 효율성
  metabolicEfficiency: number;  // 대사 효율 (다세포는 단세포보다 효율적)
  reproductiveCapacity: number; // 번식 능력 (0~1)
}

/**
 * 다세포 생물
 *
 * 기존 Organism 타입을 확장하여 다세포 특성을 추가
 */
export interface MulticellularOrganism extends Organism {
  multicellular: MulticellularTraits;
}

/**
 * 세포 분화 조건
 *
 * 줄기 세포가 특정 타입으로 분화하기 위한 환경 조건
 */
export interface DifferentiationCondition {
  cellType: CellTypeValue;
  requiredEnergy: number;        // 필요 에너지
  requiredNeighbors: number;     // 필요한 인접 세포 수
  environmentalFactor: number;   // 환경적 요소 (온도, 빛 등)
  geneticPredisposition: number; // 유전적 성향 (0~1)
}

/**
 * 다세포 전환 조건
 *
 * 단세포 생물이 다세포로 진화하기 위한 조건
 */
export interface MulticellularTransitionCriteria {
  minCellCount: number;          // 최소 세포 수 (기본값: 4)
  minBondStrength: number;       // 최소 결합력 (기본값: 0.7)
  minCooperation: number;        // 최소 협력도 (기본값: 0.6)
  minAge: number;                // 최소 나이 (세대)
  energyThreshold: number;       // 필요 에너지
}

/**
 * 세포 타입별 기능 정의
 */
export interface CellFunction {
  type: CellTypeValue;
  energyProduction: number;      // 에너지 생산량
  energyConsumption: number;     // 에너지 소비량
  movementContribution: number;  // 이동 기여도
  sensingRange: number;          // 감지 범위
  reproductiveCost: number;      // 번식 비용
  structuralStrength: number;    // 구조적 강도
}

/**
 * 타입 가드: 다세포 생물 체크
 */
export function isMulticellular(organism: Organism): organism is MulticellularOrganism {
  if (!('multicellular' in organism)) return false;
  const multi = (organism as MulticellularOrganism).multicellular;
  return multi !== undefined && multi.isMulticellular === true;
}

/**
 * 기본 전환 조건
 */
export const DEFAULT_TRANSITION_CRITERIA: MulticellularTransitionCriteria = {
  minCellCount: 4,
  minBondStrength: 0.7,
  minCooperation: 0.6,
  minAge: 10,
  energyThreshold: 50,
};
