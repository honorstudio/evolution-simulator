/**
 * 성선택 시스템 헬퍼 함수
 * 성적 특성 초기화 및 유틸리티 함수
 */

import type {
  SexualOrganism,
  Sex,
  AttractivenessGenes,
  PreferenceGenes,
  CourtshipBehavior,
  DisplayFeature,
  ColorGene,
} from './types';

/**
 * 성적 특성 초기화
 * 새로운 생명체에게 성적 특성을 부여
 */
export function initializeSexualTraits(
  sex?: Sex,
  randomness = 1.0
): Omit<SexualOrganism, keyof { id: string; position: any }> {
  // 성별 결정 (지정되지 않으면 무작위)
  const determinedSex = sex || determineRandomSex();

  return {
    sex: determinedSex,
    attractiveness: generateRandomAttractiveness(determinedSex, randomness),
    preferences: generateRandomPreferences(randomness),
    courtshipBehavior: generateRandomCourtshipBehavior(determinedSex, randomness),
    reproductiveEnergy: 50,
    minReproductiveEnergy: 30,
    isReproductivelyActive: false,
    lastMatingTime: 0,
    matingCooldown: 60000, // 1분
  };
}

/**
 * 무작위 성별 결정
 */
export function determineRandomSex(): Sex {
  const rand = Math.random();
  if (rand < 0.45) return 'male';
  if (rand < 0.90) return 'female';
  return 'hermaphrodite'; // 10% 확률
}

/**
 * 무작위 매력도 유전자 생성
 */
export function generateRandomAttractiveness(
  sex: Sex,
  randomness: number
): AttractivenessGenes {
  // 수컷이 더 화려한 경향
  const maleBonus = sex === 'male' ? 0.3 : 0;

  return {
    displayFeatures: generateRandomDisplayFeatures(
      sex,
      1 + Math.floor(Math.random() * 3) // 1-3개
    ),
    colorIntensity: Math.random() * randomness + maleBonus,
    sizeBonus: Math.random() * randomness,
    symmetryQuality: 0.5 + Math.random() * 0.5 * randomness,
    healthIndicators: 0.6 + Math.random() * 0.4 * randomness,
  };
}

/**
 * 무작위 디스플레이 특징 생성
 */
export function generateRandomDisplayFeatures(
  sex: Sex,
  count: number
): DisplayFeature[] {
  const features: DisplayFeature[] = [];
  const types: DisplayFeature['type'][] = [
    'plumage',
    'horn',
    'frill',
    'tail',
    'pattern',
  ];

  for (let i = 0; i < count; i++) {
    // 수컷이 더 큰 특징을 가지는 경향
    const sizeBonus = sex === 'male' ? 0.2 : 0;

    features.push({
      type: types[Math.floor(Math.random() * types.length)] ?? 'tail',
      size: Math.random() * 0.8 + sizeBonus,
      color: generateRandomColor(),
      complexity: Math.random(),
      energyCost: 1 + Math.random() * 5,
    });
  }

  return features;
}

/**
 * 무작위 색상 생성
 */
export function generateRandomColor(): ColorGene {
  return {
    hue: Math.random() * 360,
    saturation: 0.5 + Math.random() * 0.5,
    brightness: 0.4 + Math.random() * 0.6,
  };
}

/**
 * 무작위 선호도 유전자 생성
 */
export function generateRandomPreferences(randomness: number): PreferenceGenes {
  return {
    preferredColorHue: Math.random() * 360,
    preferredColorRange: 60 + Math.random() * 60 * randomness, // 60-120도
    preferredSize: Math.random() * randomness,
    preferredSymmetry: 0.5 + Math.random() * 0.5 * randomness,
    preferredDisplaySize: Math.random() * randomness,
    preferredHealth: 0.6 + Math.random() * 0.4 * randomness,
    selectivity: 0.3 + Math.random() * 0.5 * randomness, // 0.3-0.8
  };
}

/**
 * 무작위 구애 행동 생성
 */
export function generateRandomCourtshipBehavior(
  sex: Sex,
  randomness: number
): CourtshipBehavior {
  // 수컷이 더 복잡한 구애 행동을 하는 경향
  const maleBonus = sex === 'male' ? 0.3 : 0;

  return {
    danceComplexity: Math.random() * randomness + maleBonus,
    displayDuration: 2 + Math.random() * 6, // 2-8초
    giftGiving: Math.random() < 0.3, // 30% 확률
    territoryDisplay: Math.random() < 0.4, // 40% 확률
    vocalComplexity: Math.random() * randomness + maleBonus,
    energyCost: 10 + Math.random() * 20, // 10-30
  };
}

/**
 * 색상을 16진수로 변환
 * 렌더링용 유틸리티
 */
export function colorToHex(color: ColorGene): string {
  // HSB to RGB 변환
  const h = color.hue / 360;
  const s = color.saturation;
  const v = color.brightness;

  let r = 0,
    g = 0,
    b = 0;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 번식 준비 상태 업데이트
 * 게임 루프에서 매 프레임 호출
 */
export function updateReproductiveStatus(
  organism: SexualOrganism,
  age: number,
  health: number
): void {
  // 성숙 연령 (예: 100틱 이상)
  const maturityAge = 100;

  // 최소 건강 (70% 이상)
  const minHealth = 70;

  // 번식 가능 조건
  organism.isReproductivelyActive =
    age >= maturityAge &&
    health >= minHealth &&
    organism.reproductiveEnergy >= organism.minReproductiveEnergy;
}

/**
 * 번식 에너지 회복
 * 먹이를 먹거나 휴식할 때 호출
 */
export function replenishReproductiveEnergy(
  organism: SexualOrganism,
  amount: number
): void {
  organism.reproductiveEnergy = Math.min(100, organism.reproductiveEnergy + amount);
}

/**
 * 짝짓기 쿨다운 확인
 */
export function canMateNow(organism: SexualOrganism): boolean {
  const now = Date.now();
  return now - organism.lastMatingTime >= organism.matingCooldown;
}

/**
 * 성별 호환성 확인
 * 두 개체가 짝짓기 가능한 성별 조합인지 확인
 */
export function areSexesCompatible(sex1: Sex, sex2: Sex): boolean {
  // 자웅동체는 모두와 호환
  if (sex1 === 'hermaphrodite' || sex2 === 'hermaphrodite') {
    return true;
  }

  // 다른 성별이어야 함
  return sex1 !== sex2;
}
