/**
 * index.ts
 * 외형 시스템 통합 내보내기
 */

// 타입 export
export type {
  AppearanceGenome,
  BodyShapeGene,
  ColorGene,
  PatternGene,
  AppendageGene,
  TextureGene,
} from './AppearanceGenome';

// 값 export
export {
  createDefaultAppearanceGenome,
  cloneAppearanceGenome,
} from './AppearanceGenome';

export {
  mutateAppearanceGenome,
  crossoverAppearanceGenomes,
} from './AppearanceMutation';

export { ProceduralBodyGenerator } from './ProceduralBodyGenerator';
export type { GeneratedBody } from './ProceduralBodyGenerator';

export {
  hslToHex,
  colorGeneToHex,
  varyColor,
  randomAppearanceGenome,
  calculateAppearanceSimilarity,
  clamp,
  gaussianRandom,
  mutateValue,
} from './utils';
