/**
 * LOD (Level of Detail) 시스템
 *
 * 줌 레벨에 따라 생명체의 렌더링 디테일을 조절합니다.
 * 성능 최적화를 위해 멀리 있는 개체는 단순하게, 가까운 개체는 상세하게 렌더링합니다.
 */

/**
 * LOD 레벨 정의
 * - DOT: 점으로만 표시 (대륙 뷰)
 * - SIMPLE: 단순 도형 (지역 뷰)
 * - MEDIUM: 기본 형태와 색상 (마을 뷰)
 * - DETAILED: 전체 디테일 (개체 뷰)
 */
export const LODLevel = {
  DOT: 0,      // zoom < 0.01
  SIMPLE: 1,   // zoom < 0.1
  MEDIUM: 2,   // zoom < 0.5
  DETAILED: 3, // zoom >= 0.5
} as const;

export type LODLevelType = typeof LODLevel[keyof typeof LODLevel];

/**
 * LOD 레벨 임계값 (줌 레벨)
 */
export const LOD_THRESHOLDS = {
  DOT_TO_SIMPLE: 0.01,
  SIMPLE_TO_MEDIUM: 0.1,
  MEDIUM_TO_DETAILED: 0.5,
} as const;

/**
 * 줌 레벨을 기반으로 적절한 LOD 레벨을 반환합니다.
 *
 * @param zoom - 현재 카메라 줌 레벨 (1.0 = 기본 배율)
 * @returns LOD 레벨 (0-3)
 *
 * @example
 * getLODLevel(0.005) // LODLevel.DOT (0)
 * getLODLevel(0.05)  // LODLevel.SIMPLE (1)
 * getLODLevel(0.3)   // LODLevel.MEDIUM (2)
 * getLODLevel(1.0)   // LODLevel.DETAILED (3)
 */
export function getLODLevel(zoom: number): LODLevelType {
  if (zoom < LOD_THRESHOLDS.DOT_TO_SIMPLE) {
    return LODLevel.DOT;
  }
  if (zoom < LOD_THRESHOLDS.SIMPLE_TO_MEDIUM) {
    return LODLevel.SIMPLE;
  }
  if (zoom < LOD_THRESHOLDS.MEDIUM_TO_DETAILED) {
    return LODLevel.MEDIUM;
  }
  return LODLevel.DETAILED;
}

/**
 * LOD 레벨의 이름을 반환합니다.
 * 디버깅 및 UI 표시용입니다.
 *
 * @param level - LOD 레벨
 * @returns LOD 레벨 이름
 */
export function getLODLevelName(level: LODLevelType): string {
  switch (level) {
    case LODLevel.DOT:
      return 'DOT';
    case LODLevel.SIMPLE:
      return 'SIMPLE';
    case LODLevel.MEDIUM:
      return 'MEDIUM';
    case LODLevel.DETAILED:
      return 'DETAILED';
    default:
      return 'UNKNOWN';
  }
}

/**
 * LOD 레벨별 렌더링 복잡도를 반환합니다.
 * 성능 예측 및 최적화에 사용됩니다.
 *
 * @param level - LOD 레벨
 * @returns 상대적 복잡도 (1-10)
 */
export function getLODComplexity(level: LODLevelType): number {
  switch (level) {
    case LODLevel.DOT:
      return 1;
    case LODLevel.SIMPLE:
      return 2;
    case LODLevel.MEDIUM:
      return 5;
    case LODLevel.DETAILED:
      return 10;
    default:
      return 1;
  }
}

/**
 * 줌 레벨 변경 시 LOD 전환이 필요한지 확인합니다.
 * 히스테리시스를 적용하여 LOD가 너무 자주 바뀌는 것을 방지합니다.
 *
 * @param currentLOD - 현재 LOD 레벨
 * @param zoom - 현재 줌 레벨
 * @param hysteresis - 히스테리시스 비율 (기본값: 0.1 = 10%)
 * @returns LOD 전환이 필요한지 여부
 */
export function shouldChangeLOD(
  currentLOD: LODLevelType,
  zoom: number,
  hysteresis: number = 0.1
): boolean {
  const newLOD = getLODLevel(zoom);

  if (newLOD === currentLOD) {
    return false;
  }

  // 히스테리시스 적용: 경계값 근처에서 너무 자주 바뀌지 않도록
  const isNearBoundary =
    Math.abs(zoom - LOD_THRESHOLDS.DOT_TO_SIMPLE) / LOD_THRESHOLDS.DOT_TO_SIMPLE < hysteresis ||
    Math.abs(zoom - LOD_THRESHOLDS.SIMPLE_TO_MEDIUM) / LOD_THRESHOLDS.SIMPLE_TO_MEDIUM < hysteresis ||
    Math.abs(zoom - LOD_THRESHOLDS.MEDIUM_TO_DETAILED) / LOD_THRESHOLDS.MEDIUM_TO_DETAILED < hysteresis;

  // 경계 근처가 아니면 즉시 전환
  if (!isNearBoundary) {
    return true;
  }

  // 경계 근처면 최소 1 레벨 이상 차이날 때만 전환
  return Math.abs(newLOD - currentLOD) > 1;
}
