/**
 * 직렬화/역직렬화 유틸리티
 *
 * 게임 객체를 저장 가능한 형태로 변환하고 복원합니다.
 *
 * Phase 2 업데이트:
 * - 외형, 종분화, 성선택, 다세포 데이터 직렬화
 * - 고급 AI (AIController) 직렬화 지원
 * - 하위 호환성 유지 (v1.0.0 저장 파일 지원)
 */

import { Organism } from '../organism/Organism';
import { Food } from '../organism/Food';
import { Brain } from '../organism/Brain';
import { Genome } from '../organism/Genome';
import { AIController } from '../organism/ai/AIController';
import {
  SerializedOrganism,
  SerializedFood,
  SerializedGenome,
} from './types';

/**
 * 유전자 직렬화
 */
export function serializeGenome(genome: Genome): SerializedGenome {
  return {
    // 기본 속성
    size: genome.size,
    speed: genome.speed,
    metabolism: genome.metabolism,
    sensorRange: genome.sensorRange,
    sensorCount: genome.sensorCount,
    hue: genome.hue,
    saturation: genome.saturation,
    lightness: genome.lightness,
    hiddenLayers: genome.hiddenLayers,
    neuronsPerLayer: genome.neuronsPerLayer,
    mutationRate: genome.mutationRate,

    // Phase 2: 외형
    appearance: genome.appearance,

    // Phase 2: 다세포 관련
    cooperation: genome.cooperation,
    bondStrength: genome.bondStrength,
    specialization: genome.specialization,

    // Phase 2: 종분화
    kingdom: genome.kingdom,
    diet: genome.diet,
    locomotion: genome.locomotion,

    // Phase 2: 성선택
    sexualMaturity: genome.sexualMaturity,
    displayIntensity: genome.displayIntensity,
    preferenceStrength: genome.preferenceStrength,

    // Phase 5: 서식지 관련
    habitat: genome.habitat,
    amphibiousTraits: genome.amphibiousTraits,

    // Phase 5.2: 플랑크톤 관련
    planktonTraits: genome.planktonTraits,

    // Phase 6: 질병 시스템 관련
    immunity: genome.immunity,
    diseaseResistance: genome.diseaseResistance,
    maxLifespan: genome.maxLifespan,
  };
}

/**
 * 유전자 역직렬화
 * v1.0.0 저장 파일과의 하위 호환성 유지
 */
export function deserializeGenome(data: SerializedGenome): Genome {
  // 기본 외형 유전자 (v1.0.0 파일에 없을 경우 사용)
  const defaultAppearance = {
    bodyShape: 'circle' as const,
    bodySegments: 1,
    bodySymmetry: 'bilateral' as const,
    spikes: 0,
    spikeLength: 0.5,
    tailLength: 0,
    flagella: 0,
    pattern: 'solid' as const,
    patternScale: 1,
    patternIntensity: 0.5,
    secondaryHue: 0,
    secondarySaturation: 50,
    secondaryLightness: 50,
    transparency: 0,
    glow: 0,
    outline: 0,
  };

  return {
    // 기본 속성
    size: data.size,
    speed: data.speed,
    metabolism: data.metabolism,
    sensorRange: data.sensorRange,
    sensorCount: data.sensorCount,
    hue: data.hue,
    saturation: data.saturation,
    lightness: data.lightness,
    hiddenLayers: data.hiddenLayers,
    neuronsPerLayer: data.neuronsPerLayer,
    mutationRate: data.mutationRate,

    // Phase 2: 외형 (없으면 기본값)
    appearance: data.appearance ?? defaultAppearance,

    // Phase 2: 다세포 관련 (없으면 기본값)
    cooperation: data.cooperation ?? 0.5,
    bondStrength: data.bondStrength ?? 0.5,
    specialization: data.specialization ?? 0.1,

    // Phase 2: 종 분화 관련 (없으면 기본값)
    kingdom: data.kingdom ?? 'undetermined',
    diet: data.diet ?? 'omnivore',
    locomotion: data.locomotion ?? 'swim',

    // Phase 2: 성선택 관련 (없으면 기본값)
    sexualMaturity: data.sexualMaturity ?? 1000,
    displayIntensity: data.displayIntensity ?? 0.5,
    preferenceStrength: data.preferenceStrength ?? 0.5,

    // Phase 5: 서식지 관련 (없으면 기본값 - 물에서 시작)
    habitat: data.habitat ?? 'water',
    amphibiousTraits: data.amphibiousTraits ?? {
      desiccationResistance: 0,
      lungCapacity: 0,
      limbDevelopment: 0,
    },

    // Phase 5.2: 플랑크톤 관련 (없으면 기본값 - 비플랑크톤)
    planktonTraits: data.planktonTraits ?? {
      isPlankton: false,
      planktonType: 'none',
      buoyancy: 0,
      oxygenProduction: 0,
      filterFeedingEfficiency: 0,
    },

    // Phase 6: 질병 시스템 관련 (없으면 기본값)
    immunity: data.immunity ?? 0.5,
    diseaseResistance: data.diseaseResistance ?? 0.5,
    maxLifespan: data.maxLifespan ?? 10000,
  };
}

/**
 * 생명체 직렬화
 */
export function serializeOrganism(organism: Organism): SerializedOrganism {
  return {
    // 기본 상태
    id: organism.id,
    x: organism.x,
    y: organism.y,
    vx: organism.vx,
    vy: organism.vy,
    angle: organism.angle,
    energy: organism.energy,
    maxEnergy: organism.maxEnergy,
    age: organism.age,
    genome: serializeGenome(organism.genome),

    // 기본 뇌
    brainWeights: organism.brain.getWeights(),
    brainBiases: organism.brain.getBiases(),

    // Phase 2: 추가 상태
    generation: organism.generation,
    health: organism.health,
    reproductionCooldown: organism.reproductionCooldown,

    // Phase 2: 성선택
    sex: organism.sex,
    attractiveness: organism.attractiveness,
    matingDesire: organism.matingDesire,

    // Phase 2: 다세포
    multicellular: organism.multicellular,

    // Phase 2: 고급 AI
    useAdvancedAI: organism.useAdvancedAI,
    aiControllerData: organism.aiController?.serialize(),
  };
}

/**
 * 생명체 역직렬화
 * v1.0.0 저장 파일과의 하위 호환성 유지
 */
export function deserializeOrganism(data: SerializedOrganism): Organism {
  // 유전자 복원
  const genome = deserializeGenome(data.genome);

  // 기본 뇌 복원
  const brain = new Brain(
    8,  // 입력 개수 (고정)
    genome.hiddenLayers,
    genome.neuronsPerLayer,
    2   // 출력 개수 (고정)
  );

  // 가중치와 바이어스 복원
  brain.setWeights(data.brainWeights);
  brain.setBiases(data.brainBiases);

  // 고급 AI 복원 (있는 경우)
  let aiController: AIController | undefined;
  if (data.aiControllerData) {
    try {
      aiController = AIController.deserialize(data.aiControllerData);
    } catch {
      // AI 복원 실패시 무시
    }
  }

  // 생명체 생성
  const organism = new Organism(
    data.x,
    data.y,
    genome,
    brain,
    aiController,
    data.useAdvancedAI ?? false
  );

  // 기본 상태 복원
  organism.id = data.id;
  organism.vx = data.vx;
  organism.vy = data.vy;
  organism.angle = data.angle;
  organism.energy = data.energy;
  organism.maxEnergy = data.maxEnergy;
  organism.age = data.age;

  // Phase 2: 추가 상태 복원 (없으면 기본값)
  organism.generation = data.generation ?? 0;
  organism.health = data.health ?? 100;
  organism.reproductionCooldown = data.reproductionCooldown ?? 0;

  // Phase 2: 성선택 복원 (없으면 기본값)
  organism.sex = data.sex ?? 'hermaphrodite';
  organism.attractiveness = data.attractiveness ?? 0.5;
  organism.matingDesire = data.matingDesire ?? 0;

  // Phase 2: 다세포 복원
  if (data.multicellular) {
    organism.setMulticellularTraits(data.multicellular);
  }

  return organism;
}

/**
 * 음식 직렬화
 */
export function serializeFood(food: Food): SerializedFood {
  return {
    id: food.id,
    x: food.x,
    y: food.y,
    energy: food.energy,
  };
}

/**
 * 음식 역직렬화
 */
export function deserializeFood(data: SerializedFood): Food {
  const food = new Food(data.x, data.y, data.energy);
  food.id = data.id;
  return food;
}
