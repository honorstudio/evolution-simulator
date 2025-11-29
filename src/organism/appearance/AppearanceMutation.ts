/**
 * AppearanceMutation.ts
 * 외형 유전자 돌연변이 시스템
 */

import type {
  AppearanceGenome,
  BodyShapeGene,
  ColorGene,
  PatternGene,
  AppendageGene,
} from './AppearanceGenome';
import { cloneAppearanceGenome } from './AppearanceGenome';
import { mutateValue, clamp, gaussianRandom } from './utils';

/**
 * 외형 유전자 돌연변이
 * @param genome 원본 유전자
 * @param mutationRate 돌연변이율 (0~1)
 * @returns 변이된 유전자
 */
export function mutateAppearanceGenome(
  genome: AppearanceGenome,
  mutationRate: number
): AppearanceGenome {
  const mutated = cloneAppearanceGenome(genome);

  // 각 유전자별로 독립적으로 돌연변이 발생
  mutated.bodyShape = mutateBodyShape(mutated.bodyShape, mutationRate);
  mutated.symmetry = mutateSymmetry(mutated.symmetry, mutationRate);
  mutated.segments = mutateSegments(mutated.segments, mutationRate);
  mutated.primaryColor = mutateColor(mutated.primaryColor, mutationRate);
  mutated.secondaryColor = mutateColor(mutated.secondaryColor, mutationRate);
  mutated.pattern = mutatePattern(mutated.pattern, mutationRate);
  mutated.appendages = mutateAppendages(mutated.appendages, mutationRate);
  mutated.texture = mutateTexture(mutated.texture, mutationRate);
  mutated.transparency = mutateValue(mutated.transparency, mutationRate * 0.1, 0, 1);
  mutated.luminescence = mutateValue(mutated.luminescence, mutationRate * 0.05, 0, 1);

  return mutated;
}

/**
 * 몸체 형태 돌연변이
 */
function mutateBodyShape(shape: BodyShapeGene, mutationRate: number): BodyShapeGene {
  const mutated = { ...shape };

  // 형태 타입 변경 (낮은 확률)
  if (Math.random() < mutationRate * 0.05) {
    const types: BodyShapeGene['type'][] = ['blob', 'elongated', 'spherical', 'flat', 'branching'];
    const idx = Math.floor(Math.random() * types.length);
    mutated.type = types[idx] ?? 'blob';
  }

  // 비율 변이
  mutated.aspectRatio = mutateValue(mutated.aspectRatio, mutationRate * 0.2, 0.5, 2.0);

  // 곡률 변이
  mutated.curvature = mutateValue(mutated.curvature, mutationRate * 0.1, 0, 1);

  return mutated;
}

/**
 * 대칭성 돌연변이
 */
function mutateSymmetry(
  symmetry: AppearanceGenome['symmetry'],
  mutationRate: number
): AppearanceGenome['symmetry'] {
  // 낮은 확률로 대칭성 변경
  if (Math.random() < mutationRate * 0.03) {
    const types: AppearanceGenome['symmetry'][] = ['radial', 'bilateral', 'asymmetric'];
    const idx = Math.floor(Math.random() * types.length);
    return types[idx] ?? 'bilateral';
  }
  return symmetry;
}

/**
 * 분절 수 돌연변이
 */
function mutateSegments(segments: number, mutationRate: number): number {
  if (Math.random() < mutationRate * 0.1) {
    const change = Math.random() < 0.5 ? -1 : 1;
    return clamp(segments + change, 1, 20);
  }
  return segments;
}

/**
 * 색상 돌연변이
 */
function mutateColor(color: ColorGene, mutationRate: number): ColorGene {
  return {
    hue: (color.hue + gaussianRandom() * mutationRate * 30 + 360) % 360,
    saturation: mutateValue(color.saturation, mutationRate * 0.15, 0, 1),
    lightness: mutateValue(color.lightness, mutationRate * 0.15, 0, 1),
    variation: mutateValue(color.variation, mutationRate * 0.05, 0, 1),
  };
}

/**
 * 패턴 돌연변이
 */
function mutatePattern(pattern: PatternGene, mutationRate: number): PatternGene {
  const mutated = { ...pattern };

  // 패턴 타입 변경 (낮은 확률)
  if (Math.random() < mutationRate * 0.08) {
    const types: PatternGene['type'][] = ['solid', 'stripes', 'spots', 'gradient', 'patches'];
    const idx = Math.floor(Math.random() * types.length);
    mutated.type = types[idx] ?? 'solid';
  }

  mutated.scale = mutateValue(mutated.scale, mutationRate * 0.2, 0.1, 2.0);
  mutated.contrast = mutateValue(mutated.contrast, mutationRate * 0.15, 0, 1);
  mutated.direction = (mutated.direction + gaussianRandom() * mutationRate * 30 + 360) % 360;

  return mutated;
}

/**
 * 부속물 배열 돌연변이
 */
function mutateAppendages(appendages: AppendageGene[], mutationRate: number): AppendageGene[] {
  const mutated = appendages.map(a => mutateAppendage(a, mutationRate));

  // 부속물 추가 (낮은 확률)
  if (Math.random() < mutationRate * 0.05 && mutated.length < 10) {
    mutated.push(createRandomAppendage());
  }

  // 부속물 제거 (낮은 확률)
  if (Math.random() < mutationRate * 0.05 && mutated.length > 0) {
    mutated.splice(Math.floor(Math.random() * mutated.length), 1);
  }

  return mutated;
}

/**
 * 단일 부속물 돌연변이
 */
function mutateAppendage(appendage: AppendageGene, mutationRate: number): AppendageGene {
  const mutated = { ...appendage };

  // 타입 변경 (매우 낮은 확률)
  if (Math.random() < mutationRate * 0.03) {
    const types: AppendageGene['type'][] = [
      'limb', 'tail', 'horn', 'fin', 'wing', 'antenna', 'tentacle'
    ];
    const idx = Math.floor(Math.random() * types.length);
    mutated.type = types[idx] ?? 'limb';
  }

  // 개수 변이
  if (Math.random() < mutationRate * 0.1) {
    const change = Math.random() < 0.5 ? -1 : 1;
    mutated.count = clamp(mutated.count + change, 1, 8);
  }

  mutated.length = mutateValue(mutated.length, mutationRate * 0.2, 0.1, 2.0);
  mutated.thickness = mutateValue(mutated.thickness, mutationRate * 0.15, 0.1, 1.0);
  mutated.position = mutateValue(mutated.position, mutationRate * 0.1, 0, 1);
  mutated.curvature = mutateValue(mutated.curvature, mutationRate * 0.15, -1, 1);

  // 관절 수 변이
  if (Math.random() < mutationRate * 0.1) {
    const change = Math.random() < 0.5 ? -1 : 1;
    mutated.joints = clamp(mutated.joints + change, 0, 5);
  }

  return mutated;
}

/**
 * 랜덤 부속물 생성
 */
function createRandomAppendage(): AppendageGene {
  const types: AppendageGene['type'][] = [
    'limb', 'tail', 'horn', 'fin', 'wing', 'antenna', 'tentacle'
  ];
  const idx = Math.floor(Math.random() * types.length);

  return {
    type: types[idx] ?? 'limb',
    count: 1 + Math.floor(Math.random() * 3),
    length: 0.3 + Math.random() * 1.0,
    thickness: 0.2 + Math.random() * 0.6,
    position: Math.random(),
    curvature: -0.5 + Math.random(),
    joints: Math.floor(Math.random() * 3),
  };
}

/**
 * 텍스처 돌연변이
 */
function mutateTexture(
  texture: AppearanceGenome['texture'],
  mutationRate: number
): AppearanceGenome['texture'] {
  const mutated = { ...texture };

  // 텍스처 타입 변경 (낮은 확률)
  if (Math.random() < mutationRate * 0.05) {
    const types = ['smooth', 'rough', 'scaly', 'fuzzy', 'spiky'] as const;
    const idx = Math.floor(Math.random() * types.length);
    mutated.type = types[idx] ?? 'smooth';
  }

  mutated.density = mutateValue(mutated.density, mutationRate * 0.1, 0, 1);
  mutated.size = mutateValue(mutated.size, mutationRate * 0.15, 0.1, 2.0);

  return mutated;
}

/**
 * 두 외형 유전자 교배
 * @param parent1 부모1
 * @param parent2 부모2
 * @param mutationRate 돌연변이율
 * @returns 자식 유전자
 */
export function crossoverAppearanceGenomes(
  parent1: AppearanceGenome,
  parent2: AppearanceGenome,
  mutationRate: number = 0.1
): AppearanceGenome {
  const child: AppearanceGenome = {
    // 50% 확률로 각 부모에서 선택
    bodyShape: Math.random() < 0.5 ? { ...parent1.bodyShape } : { ...parent2.bodyShape },
    symmetry: Math.random() < 0.5 ? parent1.symmetry : parent2.symmetry,
    segments: Math.random() < 0.5 ? parent1.segments : parent2.segments,

    // 색상은 평균값 사용
    primaryColor: blendColors(parent1.primaryColor, parent2.primaryColor),
    secondaryColor: blendColors(parent1.secondaryColor, parent2.secondaryColor),

    pattern: Math.random() < 0.5 ? { ...parent1.pattern } : { ...parent2.pattern },

    // 부속물은 무작위로 조합
    appendages: crossoverAppendages(parent1.appendages, parent2.appendages),

    texture: Math.random() < 0.5 ? { ...parent1.texture } : { ...parent2.texture },

    // 투명도/발광도는 평균
    transparency: (parent1.transparency + parent2.transparency) / 2,
    luminescence: (parent1.luminescence + parent2.luminescence) / 2,
  };

  // 돌연변이 적용
  return mutateAppearanceGenome(child, mutationRate);
}

/**
 * 두 색상 혼합
 */
function blendColors(color1: ColorGene, color2: ColorGene): ColorGene {
  return {
    hue: (color1.hue + color2.hue) / 2,
    saturation: (color1.saturation + color2.saturation) / 2,
    lightness: (color1.lightness + color2.lightness) / 2,
    variation: (color1.variation + color2.variation) / 2,
  };
}

/**
 * 부속물 배열 교배
 */
function crossoverAppendages(
  appendages1: AppendageGene[],
  appendages2: AppendageGene[]
): AppendageGene[] {
  const result: AppendageGene[] = [];
  const maxLength = Math.max(appendages1.length, appendages2.length);

  for (let i = 0; i < maxLength; i++) {
    const app1 = appendages1[i];
    const app2 = appendages2[i];

    if (app1 && (!app2 || Math.random() < 0.5)) {
      result.push({ ...app1 });
    } else if (app2) {
      result.push({ ...app2 });
    }
  }

  return result;
}
