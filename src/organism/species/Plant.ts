/**
 * 식물 시스템
 *
 * 광합성, 성장, 번식 등 식물 특화 로직을 처리합니다.
 */

import type { PlantTraits, PhotosynthesisInput, PollinationType } from './types';

/**
 * 광합성 시뮬레이션
 *
 * @description
 * 광합성은 빛 에너지를 화학 에너지로 변환하는 과정입니다.
 * 효율은 햇빛, 온도, CO2, 엽록소 농도에 따라 달라집니다.
 *
 * @param traits - 식물 특성
 * @param input - 환경 입력값
 * @returns 생성된 에너지량
 */
export function performPhotosynthesis(
  traits: PlantTraits,
  input: PhotosynthesisInput
): number {
  const { sunlight, temperature, co2Level, deltaTime } = input;

  // 온도 보정 계수 (15-30도가 최적)
  const tempFactor = calculateTemperatureFactor(temperature);

  // CO2 보정 계수 (더 많을수록 좋지만 포화점 존재)
  const co2Factor = Math.min(1, co2Level * 2);

  // 햇빛 강도 (직접적 영향)
  const lightFactor = sunlight;

  // 최종 광합성 효율
  const efficiency =
    traits.chlorophyll *
    lightFactor *
    tempFactor *
    co2Factor;

  // 생성 에너지 = 잎 면적 × 광합성 속도 × 효율 × 시간
  const energyProduced =
    traits.leafArea *
    traits.photosynthesisRate *
    efficiency *
    deltaTime;

  return Math.max(0, energyProduced);
}

/**
 * 온도에 따른 광합성 효율 계산
 *
 * @description
 * 15-30도 사이가 최적 온도입니다.
 * 0도 이하나 45도 이상에서는 거의 정지합니다.
 *
 * @param temperature - 온도 (섭씨)
 * @returns 효율 계수 (0-1)
 */
function calculateTemperatureFactor(temperature: number): number {
  if (temperature < 0 || temperature > 45) {
    return 0.1; // 극한 온도에서는 거의 작동 안 함
  }

  if (temperature >= 15 && temperature <= 30) {
    return 1.0; // 최적 온도
  }

  if (temperature < 15) {
    // 15도 이하: 선형 감소
    return 0.1 + (temperature / 15) * 0.9;
  }

  // 30도 이상: 선형 감소
  return 1.0 - ((temperature - 30) / 15) * 0.9;
}

/**
 * 식물 성장 시뮬레이션
 *
 * @description
 * 에너지를 소비하여 크기를 키웁니다.
 * 높이, 잎 면적, 뿌리 깊이가 모두 증가합니다.
 *
 * @param traits - 식물 특성 (변경됨)
 * @param availableEnergy - 성장에 사용 가능한 에너지
 * @param growthRate - 성장 속도 계수 (0-1)
 * @returns 실제 소비된 에너지
 */
export function growPlant(
  traits: PlantTraits,
  availableEnergy: number,
  growthRate: number = 0.5
): number {
  // 최대 성장 크기 제한 체크
  const maxHeight = 200;
  const maxLeafArea = 1000;
  const maxRootDepth = 150;

  if (
    traits.height >= maxHeight &&
    traits.leafArea >= maxLeafArea &&
    traits.rootDepth >= maxRootDepth
  ) {
    return 0; // 이미 최대 성장
  }

  // 성장에 필요한 에너지
  const energyNeeded = 10 * growthRate;

  if (availableEnergy < energyNeeded) {
    return 0; // 에너지 부족
  }

  // 높이 성장 (가장 빠름)
  if (traits.height < maxHeight) {
    traits.height += 0.5 * growthRate;
  }

  // 잎 면적 성장
  if (traits.leafArea < maxLeafArea) {
    traits.leafArea += 2 * growthRate;
  }

  // 뿌리 성장
  if (traits.rootDepth < maxRootDepth) {
    traits.rootDepth += 0.3 * growthRate;
  }

  // 줄기 강화 (높이에 비례해서 필요)
  traits.stemStrength = Math.min(
    1,
    traits.stemStrength + 0.01 * growthRate
  );

  return energyNeeded;
}

/**
 * 씨앗 생산 계산
 *
 * @description
 * 식물의 크기와 에너지에 따라 생산 가능한 씨앗 개수를 계산합니다.
 *
 * @param traits - 식물 특성
 * @param availableEnergy - 사용 가능한 에너지
 * @param energyPerSeed - 씨앗 1개당 필요한 에너지
 * @returns 생산 가능한 씨앗 개수
 */
export function calculateSeedProduction(
  traits: PlantTraits,
  availableEnergy: number,
  energyPerSeed: number = 50
): number {
  // 최소 크기 체크
  if (traits.height < 20 || traits.leafArea < 50) {
    return 0; // 너무 작으면 번식 불가
  }

  // 크기에 따른 기본 생산량
  const baseSeedCount = traits.seedProduction;

  // 에너지로 만들 수 있는 최대 개수
  const maxAffordable = Math.floor(availableEnergy / energyPerSeed);

  return Math.min(baseSeedCount, maxAffordable);
}

/**
 * 수분(pollination) 성공 확률 계산
 *
 * @description
 * 수분 방식에 따라 성공 확률이 달라집니다.
 * 동물 매개 수분이 가장 효율적이지만 조건이 까다롭습니다.
 *
 * @param traits - 식물 특성
 * @param nearbyAnimals - 근처 동물 수
 * @param windSpeed - 바람 세기 (0-1)
 * @returns 수분 성공 확률 (0-1)
 */
export function calculatePollinationChance(
  traits: PlantTraits,
  nearbyAnimals: number,
  windSpeed: number
): number {
  switch (traits.pollinationType) {
    case 'self':
      // 자가수분: 항상 가능하지만 효율 낮음
      return 0.8;

    case 'wind':
      // 바람 매개: 바람이 강할수록 좋음
      return Math.min(0.9, 0.3 + windSpeed * 0.6);

    case 'animal':
      // 동물 매개: 동물이 많고 꽃이 매력적일수록 좋음
      const attractiveness =
        (traits.flowerFragrance + traits.flowerBrightness) / 2;
      const animalFactor = Math.min(1, nearbyAnimals / 5);
      return attractiveness * animalFactor;

    case 'water':
      // 물 매개: 구현 보류
      return 0.5;

    default:
      return 0.5;
  }
}

/**
 * 환경 스트레스 계산
 *
 * @description
 * 부적절한 환경 조건은 식물에 스트레스를 줍니다.
 * 스트레스가 높으면 성장이 느려지고 사망 위험이 높아집니다.
 *
 * @param traits - 식물 특성
 * @param temperature - 온도
 * @param moisture - 토양 수분 (0-1)
 * @param windSpeed - 바람 세기 (0-1)
 * @returns 스트레스 수준 (0-1, 높을수록 나쁨)
 */
export function calculatePlantStress(
  traits: PlantTraits,
  temperature: number,
  moisture: number,
  windSpeed: number
): number {
  let stress = 0;

  // 온도 스트레스
  if (temperature < 5 || temperature > 40) {
    stress += 0.5;
  } else if (temperature < 10 || temperature > 35) {
    stress += 0.2;
  }

  // 물 부족 스트레스
  const waterNeeded = traits.leafArea / 500; // 잎이 많을수록 물 많이 필요
  if (moisture < waterNeeded) {
    stress += (waterNeeded - moisture) * 0.5;
  }

  // 바람 스트레스 (높이가 높을수록 영향 큼)
  const windResistance = traits.stemStrength;
  const heightFactor = traits.height / 100;
  const windStress = windSpeed * heightFactor * (1 - windResistance);
  stress += windStress * 0.3;

  return Math.min(1, stress);
}

/**
 * 물 흡수량 계산
 *
 * @description
 * 뿌리 깊이와 토양 수분에 따라 흡수량이 결정됩니다.
 *
 * @param traits - 식물 특성
 * @param soilMoisture - 토양 수분 (0-1)
 * @param deltaTime - 시간 델타 (초)
 * @returns 흡수한 물의 양
 */
export function absorbWater(
  traits: PlantTraits,
  soilMoisture: number,
  deltaTime: number
): number {
  // 뿌리가 깊을수록 더 많은 물 흡수 가능
  const absorptionRate = traits.rootDepth * 0.1;

  // 토양 수분이 높을수록 흡수 쉬움
  const waterAbsorbed = absorptionRate * soilMoisture * deltaTime;

  return waterAbsorbed;
}

/**
 * 기본 식물 특성 생성기
 *
 * @description
 * 유전자로부터 식물 특성을 생성합니다.
 *
 * @param genes - 유전자 값 배열 (0-1 범위의 8개 이상)
 * @returns 식물 특성 객체
 */
export function createPlantTraits(genes: number[]): PlantTraits {
  return {
    type: 'plant',
    chlorophyll: 0.5 + (genes[0] ?? 0.5) * 0.5, // 0.5-1.0
    leafArea: 30 + (genes[1] ?? 0.5) * 70, // 30-100
    photosynthesisRate: 0.5 + (genes[2] ?? 0.5) * 1.5, // 0.5-2.0
    height: 10 + (genes[3] ?? 0.5) * 20, // 10-30 (초기)
    rootDepth: 5 + (genes[4] ?? 0.5) * 15, // 5-20 (초기)
    stemStrength: genes[5] ?? 0.5, // 0-1
    seedProduction: Math.floor(1 + (genes[6] ?? 0.5) * 9), // 1-10
    pollinationType: selectPollinationType(genes[7] ?? 0.5),
    flowerFragrance: genes[8] ?? 0.5,
    flowerBrightness: genes[9] ?? 0.5,
  };
}

/**
 * 유전자 값에 따라 수분 방식 선택
 */
function selectPollinationType(geneValue: number): PollinationType {
  if (geneValue < 0.25) return 'self';
  if (geneValue < 0.5) return 'wind';
  if (geneValue < 0.75) return 'animal';
  return 'water';
}
