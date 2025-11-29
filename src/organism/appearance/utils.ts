/**
 * utils.ts
 * 외형 관련 유틸리티 함수들
 */

import type { ColorGene, AppearanceGenome, BodyShapeGene, PatternGene, AppendageGene } from './AppearanceGenome';

/**
 * HSL 색상을 RGB 16진수로 변환
 * @param h 색조 (0-360)
 * @param s 채도 (0-1)
 * @param l 명도 (0-1)
 * @returns RGB 16진수 (0xRRGGBB)
 */
export function hslToHex(h: number, s: number, l: number): number {
  // 정규화
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const rByte = Math.round((r + m) * 255);
  const gByte = Math.round((g + m) * 255);
  const bByte = Math.round((b + m) * 255);

  return (rByte << 16) | (gByte << 8) | bByte;
}

/**
 * ColorGene을 16진수 색상으로 변환
 */
export function colorGeneToHex(color: ColorGene): number {
  return hslToHex(color.hue, color.saturation, color.lightness);
}

/**
 * ColorGene에 변화를 적용한 색상 반환
 */
export function varyColor(color: ColorGene, seed: number): number {
  const variation = color.variation;
  const hueVar = (seed * 360 * variation) % 360;
  const satVar = (seed * variation) - variation / 2;
  const lightVar = (seed * variation) - variation / 2;

  return hslToHex(
    color.hue + hueVar,
    Math.max(0, Math.min(1, color.saturation + satVar)),
    Math.max(0, Math.min(1, color.lightness + lightVar))
  );
}

/**
 * 랜덤 외형 유전자 생성
 */
export function randomAppearanceGenome(): AppearanceGenome {
  const bodyShapeTypes: BodyShapeGene['type'][] = ['blob', 'elongated', 'spherical', 'flat', 'branching'];
  const symmetryTypes: AppearanceGenome['symmetry'][] = ['radial', 'bilateral', 'asymmetric'];
  const patternTypes: PatternGene['type'][] = ['solid', 'stripes', 'spots', 'gradient', 'patches'];

  return {
    bodyShape: {
      type: bodyShapeTypes[Math.floor(Math.random() * bodyShapeTypes.length)] ?? 'blob',
      aspectRatio: 0.5 + Math.random() * 1.5,
      curvature: Math.random(),
    },
    symmetry: symmetryTypes[Math.floor(Math.random() * symmetryTypes.length)] ?? 'bilateral',
    segments: Math.floor(1 + Math.random() * 5),
    primaryColor: randomColorGene(),
    secondaryColor: randomColorGene(),
    pattern: {
      type: patternTypes[Math.floor(Math.random() * patternTypes.length)] ?? 'solid',
      scale: 0.5 + Math.random() * 1.5,
      contrast: Math.random(),
      direction: Math.random() * 360,
    },
    appendages: generateRandomAppendages(),
    texture: {
      type: ['smooth', 'rough', 'scaly', 'fuzzy', 'spiky'][Math.floor(Math.random() * 5)] as any,
      density: Math.random(),
      size: 0.5 + Math.random() * 1.5,
    },
    transparency: Math.random() * 0.3,
    luminescence: Math.random() * 0.2,
  };
}

/**
 * 랜덤 색상 유전자 생성
 */
function randomColorGene(): ColorGene {
  return {
    hue: Math.random() * 360,
    saturation: 0.3 + Math.random() * 0.6,
    lightness: 0.3 + Math.random() * 0.4,
    variation: Math.random() * 0.2,
  };
}

/**
 * 랜덤 부속물 배열 생성
 */
function generateRandomAppendages(): AppendageGene[] {
  const appendages: AppendageGene[] = [];
  const appendageTypes: AppendageGene['type'][] = [
    'limb', 'tail', 'horn', 'fin', 'wing', 'antenna', 'tentacle'
  ];

  const count = Math.floor(Math.random() * 4); // 0~3개 부속물

  for (let i = 0; i < count; i++) {
    appendages.push({
      type: appendageTypes[Math.floor(Math.random() * appendageTypes.length)] ?? 'limb',
      count: 1 + Math.floor(Math.random() * 4),
      length: 0.3 + Math.random() * 1.0,
      thickness: 0.2 + Math.random() * 0.6,
      position: Math.random(),
      curvature: -0.5 + Math.random(),
      joints: Math.floor(Math.random() * 4),
    });
  }

  return appendages;
}

/**
 * 두 외형 유전자의 유사도 계산 (0~1)
 */
export function calculateAppearanceSimilarity(a: AppearanceGenome, b: AppearanceGenome): number {
  let similarity = 0;
  let weights = 0;

  // 몸체 형태 (가중치 2)
  if (a.bodyShape.type === b.bodyShape.type) similarity += 2;
  similarity += 2 * (1 - Math.abs(a.bodyShape.aspectRatio - b.bodyShape.aspectRatio) / 2);
  weights += 4;

  // 대칭성 (가중치 1)
  if (a.symmetry === b.symmetry) similarity += 1;
  weights += 1;

  // 주 색상 (가중치 2)
  const hueDiff = Math.min(Math.abs(a.primaryColor.hue - b.primaryColor.hue), 360 - Math.abs(a.primaryColor.hue - b.primaryColor.hue));
  similarity += 2 * (1 - hueDiff / 180);
  weights += 2;

  // 패턴 (가중치 1.5)
  if (a.pattern.type === b.pattern.type) similarity += 1.5;
  weights += 1.5;

  // 부속물 개수 (가중치 1.5)
  const appendageDiff = Math.abs(a.appendages.length - b.appendages.length);
  similarity += 1.5 * Math.max(0, 1 - appendageDiff / 5);
  weights += 1.5;

  return similarity / weights;
}

/**
 * 값을 범위 내로 제한
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 가우시안 랜덤 (평균 0, 표준편차 1)
 */
export function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * 값을 가우시안 분포로 변이
 */
export function mutateValue(value: number, mutationRate: number, min: number, max: number): number {
  const mutation = gaussianRandom() * mutationRate;
  return clamp(value + mutation, min, max);
}
