/**
 * 물리 엔진 모듈
 *
 * 사용 예시:
 * ```typescript
 * import { Vector2D, Body, CollisionSystem, SpatialHash, PHYSICS } from './physics';
 * ```
 */

// 벡터 수학
export { Vector2D } from './Vector2D';

// 물리 바디
export { Body } from './Body';
export type { PhysicsBody } from './Body';

// 충돌 시스템
export { CollisionSystem } from './Collision';

// 공간 분할
export { SpatialHash } from './SpatialHash';

// 상수
export { PHYSICS, SPATIAL_HASH, SIMULATION } from './constants';
