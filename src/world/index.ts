/**
 * 월드 시스템 메인 인덱스
 * 모든 월드 관련 클래스와 타입을 export합니다
 */

// 설정
export { WORLD_CONFIG, NOISE_CONFIG } from './WorldConfig';

// 타일 관련
export type { Tile, TileHabitatType } from './Tile';
export {
  BiomeType,
  createTile,
  getBiomeHabitat,
  getTileHabitat,
  isHabitatCompatible,
  isBeachBiome,
} from './Tile';

// 대기 관련
export type { Atmosphere } from './Atmosphere';
export { AtmosphereManager, INITIAL_ATMOSPHERE } from './Atmosphere';

// 지형 생성
export { TerrainGenerator } from './TerrainGenerator';

// 메인 월드 클래스
export { World } from './World';

// 지질 시대 시스템 (참조용)
export {
  GeologicalEra,
  GeologicalEraManager,
  ERA_ENVIRONMENTS,
  ERA_ORDER,
  LifeType,
} from './GeologicalEra';
export type { GeologicalEraType, EraEnvironment } from './GeologicalEra';

// 원시 지구 환경 시스템 (AI 기반 자연 진화)
export {
  PrimordialEarthManager,
  PRIMORDIAL_ATMOSPHERE,
  MODERN_ATMOSPHERE,
  OXYGEN_REQUIREMENTS,
} from './PrimordialEarth';
export type { EnvironmentEvent } from './PrimordialEarth';
