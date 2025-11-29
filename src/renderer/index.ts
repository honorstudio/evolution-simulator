/**
 * 렌더링 시스템 메인 export
 */

// ===== Phase 1: 기본 렌더링 시스템 =====
export { Renderer } from './Renderer';
export { Camera } from './Camera';
export { InputHandler } from './InputHandler';
export { TerrainRenderer } from './TerrainRenderer';
export { BiomeType } from '../world/Tile';
export type { Tile } from '../world/Tile';
export { BIOME_COLORS, ORGANISM_COLORS, UI_COLORS } from './colors';
export { hslToHex, rgbToHsl, hexToRgb, getElevationTint } from './colors';

// ===== Phase 2: LOD 렌더링 시스템 =====
export {
  LODLevel,
  getLODLevel,
  getLODLevelName,
  getLODComplexity,
  shouldChangeLOD,
  LOD_THRESHOLDS,
} from './LODSystem';
export type { LODLevelType } from './LODSystem';
export { OrganismRenderer } from './OrganismRenderer';
export { ProceduralRenderer } from './ProceduralRenderer';
export { FoodRenderer } from './FoodRenderer';
export { ClusterRenderer } from './ClusterRenderer';
export type { ClusterRendererConfig } from './ClusterRenderer';
