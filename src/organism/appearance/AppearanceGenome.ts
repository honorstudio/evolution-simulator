/**
 * AppearanceGenome.ts
 * 생명체 외형 유전자 타입 정의
 */

/**
 * 몸체 형태 유전자
 */
export interface BodyShapeGene {
  /** 형태 타입 */
  type: 'blob' | 'elongated' | 'spherical' | 'flat' | 'branching';
  /** 가로세로 비율 (0.5 ~ 2.0) */
  aspectRatio: number;
  /** 곡률 (0 ~ 1, 높을수록 구불구불) */
  curvature: number;
}

/**
 * 색상 유전자
 */
export interface ColorGene {
  /** 색조 (0-360도) */
  hue: number;
  /** 채도 (0-1) */
  saturation: number;
  /** 명도 (0-1) */
  lightness: number;
  /** 색상 변화도 (0-1, 개체 내 색상 편차) */
  variation: number;
}

/**
 * 패턴 유전자
 */
export interface PatternGene {
  /** 패턴 타입 */
  type: 'solid' | 'stripes' | 'spots' | 'gradient' | 'patches';
  /** 패턴 크기 (0.1 ~ 2.0) */
  scale: number;
  /** 대비도 (0 ~ 1) */
  contrast: number;
  /** 방향 (0-360도, stripes/gradient에 적용) */
  direction: number;
}

/**
 * 부속물 유전자
 */
export interface AppendageGene {
  /** 부속물 타입 */
  type: 'limb' | 'tail' | 'horn' | 'fin' | 'wing' | 'antenna' | 'tentacle';
  /** 개수 */
  count: number;
  /** 길이 (몸체 크기 대비 비율 0.1 ~ 2.0) */
  length: number;
  /** 두께 (0.1 ~ 1.0) */
  thickness: number;
  /** 위치 (0 ~ 1, 몸체의 어느 부분에 붙는지) */
  position: number;
  /** 곡률 (-1 ~ 1, 음수는 안쪽, 양수는 바깥쪽) */
  curvature: number;
  /** 관절 수 (0 ~ 5) */
  joints: number;
}

/**
 * 텍스처 유전자
 */
export interface TextureGene {
  /** 텍스처 타입 */
  type: 'smooth' | 'rough' | 'scaly' | 'fuzzy' | 'spiky';
  /** 텍스처 밀도 (0-1) */
  density: number;
  /** 텍스처 크기 (0.1 ~ 2.0) */
  size: number;
}

/**
 * 외형 유전자 전체
 */
export interface AppearanceGenome {
  /** 몸체 형태 */
  bodyShape: BodyShapeGene;
  /** 대칭성 */
  symmetry: 'radial' | 'bilateral' | 'asymmetric';
  /** 몸체 분절 수 (1 ~ 20) */
  segments: number;
  /** 주 색상 */
  primaryColor: ColorGene;
  /** 보조 색상 */
  secondaryColor: ColorGene;
  /** 패턴 */
  pattern: PatternGene;
  /** 부속물 배열 */
  appendages: AppendageGene[];
  /** 텍스처 */
  texture: TextureGene;
  /** 투명도 (0 ~ 1) */
  transparency: number;
  /** 발광도 (0 ~ 1) */
  luminescence: number;
}

/**
 * 기본 외형 유전자 생성
 */
export function createDefaultAppearanceGenome(): AppearanceGenome {
  return {
    bodyShape: {
      type: 'blob',
      aspectRatio: 1.0,
      curvature: 0.5,
    },
    symmetry: 'bilateral',
    segments: 1,
    primaryColor: {
      hue: 120,
      saturation: 0.6,
      lightness: 0.5,
      variation: 0.1,
    },
    secondaryColor: {
      hue: 140,
      saturation: 0.4,
      lightness: 0.6,
      variation: 0.1,
    },
    pattern: {
      type: 'solid',
      scale: 1.0,
      contrast: 0.5,
      direction: 0,
    },
    appendages: [],
    texture: {
      type: 'smooth',
      density: 0.5,
      size: 1.0,
    },
    transparency: 0.1,
    luminescence: 0.0,
  };
}

/**
 * 외형 유전자 복사 (깊은 복사)
 */
export function cloneAppearanceGenome(genome: AppearanceGenome): AppearanceGenome {
  return {
    bodyShape: { ...genome.bodyShape },
    symmetry: genome.symmetry,
    segments: genome.segments,
    primaryColor: { ...genome.primaryColor },
    secondaryColor: { ...genome.secondaryColor },
    pattern: { ...genome.pattern },
    appendages: genome.appendages.map(a => ({ ...a })),
    texture: { ...genome.texture },
    transparency: genome.transparency,
    luminescence: genome.luminescence,
  };
}
