/**
 * 렌더링 시스템 관련 타입 정의
 */

/**
 * 2D 벡터
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * 사각형 영역
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * LOD (Level of Detail) 레벨
 */
export enum LODLevel {
  DOT = 0,      // 점으로만 표시 (줌 < 0.1)
  SIMPLE = 1,   // 단순 도형 (줌 0.1-0.3)
  MEDIUM = 2,   // 기본 외형 (줌 0.3-0.7)
  DETAILED = 3, // 상세 외형 (줌 > 0.7)
}

/**
 * 렌더링 통계
 */
export interface RenderStats {
  fps: number;
  drawCalls: number;
  visibleObjects: number;
  totalObjects: number;
  lodLevel: LODLevel;
}

/**
 * 카메라 상태
 */
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetZoom: number;
}
