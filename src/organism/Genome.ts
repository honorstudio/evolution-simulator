/**
 * 생명체의 유전자 정보
 * 신체 특성, 감각, 외형, 뇌 구조 등을 정의
 */
export interface Genome {
  // 신체 특성
  size: number;           // 0.5 ~ 2.0 (크기 배율)
  speed: number;          // 0.5 ~ 2.0 (속도 배율)
  metabolism: number;     // 0.5 ~ 2.0 (대사율 - 높을수록 에너지 소비 많음)

  // 감각
  sensorRange: number;    // 50 ~ 200 (감지 범위)
  sensorCount: number;    // 3 ~ 8 (센서 개수)

  // 기본 색상 (HSL)
  hue: number;            // 0 ~ 360 (색상)
  saturation: number;     // 30 ~ 100 (채도)
  lightness: number;      // 30 ~ 70 (명도)

  // 외형 유전자 (프로시저럴 생성용)
  appearance: AppearanceGene;

  // 뇌 구조
  hiddenLayers: number;   // 1 ~ 3 (은닉층 개수)
  neuronsPerLayer: number; // 4 ~ 16 (각 은닉층의 뉴런 개수)

  // 돌연변이율
  mutationRate: number;   // 0.01 ~ 0.1

  // === Phase 2: 다세포 관련 ===
  cooperation: number;        // 0.3 ~ 1.0 (협력 성향)
  bondStrength: number;       // 0.3 ~ 1.0 (결합력)
  specialization: number;     // 0.0 ~ 1.0 (분화 경향)

  // === Phase 2: 종 분화 관련 ===
  kingdom: Kingdom;
  diet: DietType;
  locomotion: LocomotionType;

  // === Phase 2: 성선택 관련 ===
  sexualMaturity: number;     // 500 ~ 2000 (성적 성숙 나이)
  displayIntensity: number;   // 0.0 ~ 1.0 (과시 강도)
  preferenceStrength: number; // 0.0 ~ 1.0 (선호 강도)

  // === Phase 5: 서식지 및 육지 진출 관련 ===
  habitat: HabitatType;           // 생존 가능 서식지
  amphibiousTraits: AmphibiousTraits; // 육지 적응 형질

  // === Phase 5.2: 플랑크톤 시스템 ===
  planktonTraits: PlanktonTraits; // 플랑크톤 특성

  // === Phase 6: 질병 시스템 ===
  immunity: number;              // 0.0 ~ 1.0 (면역력 - 질병 저항)
  diseaseResistance: number;     // 0.0 ~ 1.0 (질병 회복 속도)
  maxLifespan: number;           // 최대 수명 (틱)
}

/**
 * 생물 계통 타입 (Kingdom)
 */
export type Kingdom = 'undetermined' | 'plant' | 'animal' | 'fungus';

/**
 * 먹이 타입 (Diet)
 */
export type DietType = 'photosynthetic' | 'herbivore' | 'carnivore' | 'omnivore' | 'decomposer' | 'filter_feeder';

/**
 * 플랑크톤 특성 인터페이스
 * 식물성/동물성 플랑크톤의 특화된 속성
 */
export interface PlanktonTraits {
  /** 플랑크톤 여부 */
  isPlankton: boolean;
  /** 플랑크톤 종류: 'phyto' = 식물성, 'zoo' = 동물성 */
  planktonType: 'phyto' | 'zoo' | 'none';
  /** 부력 (0~1) - 물에서 떠있는 능력 */
  buoyancy: number;
  /** 산소 생산률 (식물성만, 0~1) */
  oxygenProduction: number;
  /** 여과 섭식 효율 (동물성만, 0~1) */
  filterFeedingEfficiency: number;
}

/**
 * 이동 방식 (Locomotion)
 */
export type LocomotionType = 'sessile' | 'floating' | 'crawl' | 'swim' | 'walk' | 'fly';

/**
 * 서식지 타입 (Habitat)
 * 생명체가 생존할 수 있는 환경
 */
export type HabitatType = 'water' | 'land' | 'amphibious';

/**
 * 육지 적응 형질 (양서류 → 육지 진화용)
 */
export interface AmphibiousTraits {
  /** 건조 저항 (0~1) - 육지에서 수분 유지 능력 */
  desiccationResistance: number;
  /** 폐 호흡 능력 (0~1) - 공기 호흡 효율 */
  lungCapacity: number;
  /** 다리 발달 (0~1) - 육지 이동 능력 */
  limbDevelopment: number;
}

/**
 * 외형 유전자 - 프로시저럴 외형 생성에 사용
 */
export interface AppearanceGene {
  // 몸체 형태
  bodyShape: BodyShape;         // 기본 형태
  bodySegments: number;         // 1 ~ 5 (체절 수)
  bodySymmetry: Symmetry;       // 대칭성

  // 부속물
  spikes: number;               // 0 ~ 8 (돌기/가시 개수)
  spikeLength: number;          // 0.2 ~ 1.0 (돌기 길이 비율)
  tailLength: number;           // 0 ~ 1.0 (꼬리 길이, 0이면 없음)
  flagella: number;             // 0 ~ 4 (편모 개수)

  // 패턴
  pattern: PatternType;         // 패턴 종류
  patternScale: number;         // 0.5 ~ 2.0 (패턴 크기)
  patternIntensity: number;     // 0 ~ 1.0 (패턴 강도)

  // 보조 색상 (패턴용)
  secondaryHue: number;         // 0 ~ 360
  secondarySaturation: number;  // 30 ~ 100
  secondaryLightness: number;   // 30 ~ 70

  // 특수 효과
  transparency: number;         // 0 ~ 0.5 (투명도)
  glow: number;                 // 0 ~ 1.0 (발광 강도)
  outline: number;              // 0 ~ 3 (외곽선 두께)
}

/**
 * 몸체 형태 타입
 */
export type BodyShape =
  | 'circle'      // 원형 (기본)
  | 'oval'        // 타원형
  | 'blob'        // 불규칙 덩어리
  | 'star'        // 별 모양
  | 'triangle'    // 삼각형
  | 'diamond'     // 다이아몬드
  | 'crescent';   // 초승달

/**
 * 대칭성 타입
 */
export type Symmetry =
  | 'radial'      // 방사대칭 (불가사리형)
  | 'bilateral'   // 좌우대칭 (물고기형)
  | 'none';       // 비대칭 (아메바형)

/**
 * 패턴 타입
 */
export type PatternType =
  | 'solid'       // 단색
  | 'stripes'     // 줄무늬
  | 'spots'       // 점박이
  | 'gradient'    // 그라데이션
  | 'rings'       // 동심원
  | 'patches';    // 얼룩

// 상수 정의
const BODY_SHAPES: BodyShape[] = ['circle', 'oval', 'blob', 'star', 'triangle', 'diamond', 'crescent'];
const SYMMETRIES: Symmetry[] = ['radial', 'bilateral', 'none'];
const PATTERNS: PatternType[] = ['solid', 'stripes', 'spots', 'gradient', 'rings', 'patches'];
// @ts-expect-error - KINGDOMS는 getDietKingdom 함수로 대체됨
const _KINGDOMS: Kingdom[] = ['undetermined', 'plant', 'animal', 'fungus'];
// @ts-expect-error - DIETS는 evolveDiet 함수로 대체됨
const _DIETS: DietType[] = ['photosynthetic', 'herbivore', 'carnivore', 'omnivore', 'decomposer'];
const LOCOMOTIONS: LocomotionType[] = ['sessile', 'floating', 'crawl', 'swim', 'walk', 'fly'];
// @ts-expect-error - 향후 서식지 랜덤 변이에 사용 예정
const _HABITATS: HabitatType[] = ['water', 'land', 'amphibious'];

/**
 * 🧬 Diet 진화 시스템
 *
 * 진화 경로 (점진적 변화):
 * photosynthetic (광합성) → filter_feeder (여과섭식) or herbivore (초식)
 * filter_feeder → herbivore or omnivore
 * herbivore → omnivore
 * omnivore → carnivore or herbivore (역진화)
 * carnivore → omnivore (역진화, 드묾)
 * decomposer는 별도 경로 (유기물 분해)
 */
const DIET_EVOLUTION_MAP: Record<DietType, { next: DietType[]; weights: number[] }> = {
  photosynthetic: {
    next: ['filter_feeder', 'herbivore', 'photosynthetic'],
    weights: [0.4, 0.3, 0.3], // 여과섭식 40%, 초식 30%, 유지 30%
  },
  filter_feeder: {
    next: ['herbivore', 'omnivore', 'filter_feeder'],
    weights: [0.4, 0.3, 0.3],
  },
  herbivore: {
    next: ['omnivore', 'decomposer', 'herbivore'],
    weights: [0.4, 0.2, 0.4],
  },
  omnivore: {
    next: ['carnivore', 'herbivore', 'omnivore'],
    weights: [0.4, 0.2, 0.4],
  },
  carnivore: {
    next: ['omnivore', 'carnivore'],
    weights: [0.2, 0.8], // 육식은 유지 경향이 높음
  },
  decomposer: {
    next: ['herbivore', 'decomposer'],
    weights: [0.3, 0.7],
  },
};

/**
 * 가중치 기반 랜덤 선택
 */
function weightedRandomSelect<T>(items: T[], weights: number[]): T {
  if (items.length === 0) {
    throw new Error('items array cannot be empty');
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    const weight = weights[i];
    if (weight !== undefined) {
      random -= weight;
      if (random <= 0) {
        return items[i] as T;
      }
    }
  }

  return items[items.length - 1] as T;
}

/**
 * 점진적 Diet 진화
 * 현재 diet에서 가능한 다음 단계로만 진화
 */
function evolveDiet(currentDiet: DietType): DietType {
  const evolution = DIET_EVOLUTION_MAP[currentDiet];
  if (!evolution) return currentDiet;

  return weightedRandomSelect(evolution.next, evolution.weights);
}

/**
 * Diet에 따른 Kingdom 자동 결정
 */
function getDietKingdom(diet: DietType): Kingdom {
  switch (diet) {
    case 'photosynthetic':
      return 'plant';
    case 'decomposer':
      return 'fungus';
    case 'filter_feeder':
    case 'herbivore':
    case 'omnivore':
    case 'carnivore':
      return 'animal';
    default:
      return 'undetermined';
  }
}

/**
 * 배열에서 안전하게 랜덤 요소 선택
 */
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/**
 * 랜덤한 외형 유전자 생성
 */
export function createRandomAppearance(): AppearanceGene {
  return {
    // 몸체 형태
    bodyShape: randomElement(BODY_SHAPES),
    bodySegments: 1 + Math.floor(Math.random() * 3), // 1 ~ 3
    bodySymmetry: randomElement(SYMMETRIES),

    // 부속물
    spikes: Math.floor(Math.random() * 6),           // 0 ~ 5
    spikeLength: 0.3 + Math.random() * 0.5,          // 0.3 ~ 0.8
    tailLength: Math.random() < 0.3 ? Math.random() * 0.8 : 0, // 30% 확률로 꼬리
    flagella: Math.random() < 0.4 ? Math.floor(Math.random() * 3) : 0, // 40% 확률로 편모

    // 패턴
    pattern: randomElement(PATTERNS),
    patternScale: 0.8 + Math.random() * 0.8,         // 0.8 ~ 1.6
    patternIntensity: 0.3 + Math.random() * 0.5,     // 0.3 ~ 0.8

    // 보조 색상
    secondaryHue: Math.random() * 360,
    secondarySaturation: 50 + Math.random() * 40,    // 50 ~ 90
    secondaryLightness: 35 + Math.random() * 30,     // 35 ~ 65

    // 특수 효과
    transparency: Math.random() < 0.2 ? Math.random() * 0.3 : 0, // 20% 확률로 반투명
    glow: Math.random() < 0.1 ? Math.random() * 0.5 : 0, // 10% 확률로 발광
    outline: Math.random() < 0.3 ? 1 + Math.random() * 2 : 0, // 30% 확률로 외곽선
  };
}

/**
 * 랜덤한 유전자 생성
 */
export function createRandomGenome(): Genome {
  return {
    // 신체 특성 - 평균값 1.0 기준
    size: 0.8 + Math.random() * 0.4,        // 0.8 ~ 1.2
    speed: 0.8 + Math.random() * 0.4,       // 0.8 ~ 1.2
    metabolism: 0.8 + Math.random() * 0.4,  // 0.8 ~ 1.2

    // 감각
    sensorRange: 100 + Math.random() * 50,  // 100 ~ 150
    sensorCount: 4 + Math.floor(Math.random() * 3), // 4 ~ 6

    // 색상 - 다양한 색상
    hue: Math.random() * 360,
    saturation: 60 + Math.random() * 30,    // 60 ~ 90
    lightness: 40 + Math.random() * 20,     // 40 ~ 60

    // 외형 유전자
    appearance: createRandomAppearance(),

    // 뇌 구조 - 중간 크기
    hiddenLayers: 1 + Math.floor(Math.random() * 2), // 1 ~ 2
    neuronsPerLayer: 6 + Math.floor(Math.random() * 5), // 6 ~ 10

    // 돌연변이율
    mutationRate: 0.03 + Math.random() * 0.03, // 0.03 ~ 0.06

    // === Phase 2: 다세포 관련 ===
    cooperation: 0.5 + Math.random() * 0.4,     // 0.5 ~ 0.9
    bondStrength: 0.5 + Math.random() * 0.4,    // 0.5 ~ 0.9
    specialization: Math.random() * 0.3,        // 0.0 ~ 0.3

    // === Phase 2: 종 분화 관련 ===
    kingdom: 'undetermined',
    diet: 'omnivore',
    locomotion: 'swim',

    // === Phase 2: 성선택 관련 ===
    sexualMaturity: 800 + Math.random() * 800,  // 800 ~ 1600
    displayIntensity: 0.3 + Math.random() * 0.4, // 0.3 ~ 0.7
    preferenceStrength: 0.3 + Math.random() * 0.4, // 0.3 ~ 0.7

    // === Phase 5: 서식지 관련 (초기 생명은 모두 물에서 시작) ===
    habitat: 'water',
    amphibiousTraits: {
      desiccationResistance: 0,
      lungCapacity: 0,
      limbDevelopment: 0,
    },

    // === Phase 5.2: 플랑크톤 특성 (기본값: 비플랑크톤) ===
    planktonTraits: {
      isPlankton: false,
      planktonType: 'none',
      buoyancy: 0,
      oxygenProduction: 0,
      filterFeedingEfficiency: 0,
    },

    // === Phase 6: 질병 시스템 ===
    immunity: 0.3 + Math.random() * 0.4,        // 0.3 ~ 0.7
    diseaseResistance: 0.3 + Math.random() * 0.4, // 0.3 ~ 0.7
    maxLifespan: 5000 + Math.random() * 10000,  // 5000 ~ 15000 틱
  };
}

/**
 * 유전자 돌연변이
 * 각 유전자를 확률적으로 변이시킴
 */
export function mutateGenome(genome: Genome): Genome {
  const mutated = { ...genome };
  const rate = genome.mutationRate;

  // 신체 특성 변이 (±20% 범위)
  if (Math.random() < rate) {
    mutated.size = clamp(
      mutated.size * (0.8 + Math.random() * 0.4),
      0.5,
      2.0
    );
  }

  if (Math.random() < rate) {
    mutated.speed = clamp(
      mutated.speed * (0.8 + Math.random() * 0.4),
      0.5,
      2.0
    );
  }

  if (Math.random() < rate) {
    mutated.metabolism = clamp(
      mutated.metabolism * (0.8 + Math.random() * 0.4),
      0.5,
      2.0
    );
  }

  // 감각 변이
  if (Math.random() < rate) {
    mutated.sensorRange = clamp(
      mutated.sensorRange + (Math.random() - 0.5) * 40,
      50,
      200
    );
  }

  if (Math.random() < rate) {
    mutated.sensorCount = clamp(
      Math.round(mutated.sensorCount + (Math.random() - 0.5) * 2),
      3,
      8
    );
  }

  // 색상 변이
  if (Math.random() < rate) {
    mutated.hue = (mutated.hue + (Math.random() - 0.5) * 60 + 360) % 360;
  }

  if (Math.random() < rate) {
    mutated.saturation = clamp(
      mutated.saturation + (Math.random() - 0.5) * 20,
      30,
      100
    );
  }

  if (Math.random() < rate) {
    mutated.lightness = clamp(
      mutated.lightness + (Math.random() - 0.5) * 20,
      30,
      70
    );
  }

  // 뇌 구조 변이 (드물게 발생)
  if (Math.random() < rate * 0.3) {
    mutated.hiddenLayers = clamp(
      Math.round(mutated.hiddenLayers + (Math.random() - 0.5) * 2),
      1,
      3
    );
  }

  if (Math.random() < rate * 0.3) {
    mutated.neuronsPerLayer = clamp(
      Math.round(mutated.neuronsPerLayer + (Math.random() - 0.5) * 4),
      4,
      16
    );
  }

  // 돌연변이율 자체도 변이
  if (Math.random() < 0.1) {
    mutated.mutationRate = clamp(
      mutated.mutationRate * (0.9 + Math.random() * 0.2),
      0.01,
      0.1
    );
  }

  // 외형 유전자 변이
  mutated.appearance = mutateAppearance(genome.appearance, rate);

  // === Phase 2: 다세포 관련 변이 ===
  if (Math.random() < rate) {
    mutated.cooperation = clamp(mutated.cooperation + (Math.random() - 0.5) * 0.2, 0.3, 1.0);
  }
  if (Math.random() < rate) {
    mutated.bondStrength = clamp(mutated.bondStrength + (Math.random() - 0.5) * 0.2, 0.3, 1.0);
  }
  if (Math.random() < rate) {
    mutated.specialization = clamp(mutated.specialization + (Math.random() - 0.5) * 0.2, 0.0, 1.0);
  }

  // === Phase 2: 종 분화 관련 변이 ===
  // Kingdom은 diet에 따라 자동 결정됨

  // 🧬 Diet 진화 - 점진적 변화만 허용!
  // 진화 경로: photosynthetic → filter_feeder/herbivore → omnivore → carnivore
  // (역방향 진화도 드물게 가능)
  if (Math.random() < rate * 0.5) { // 5% → 50%로 확률 증가 (자연 진화 촉진)
    mutated.diet = evolveDiet(genome.diet);
    // diet 변경 시 kingdom 자동 업데이트
    mutated.kingdom = getDietKingdom(mutated.diet);
  }

  if (Math.random() < rate * 0.1) {
    mutated.locomotion = randomElement(LOCOMOTIONS);
  }

  // === Phase 2: 성선택 관련 변이 ===
  if (Math.random() < rate) {
    mutated.sexualMaturity = clamp(mutated.sexualMaturity + (Math.random() - 0.5) * 400, 500, 2000);
  }
  if (Math.random() < rate) {
    mutated.displayIntensity = clamp(mutated.displayIntensity + (Math.random() - 0.5) * 0.2, 0.0, 1.0);
  }
  if (Math.random() < rate) {
    mutated.preferenceStrength = clamp(mutated.preferenceStrength + (Math.random() - 0.5) * 0.2, 0.0, 1.0);
  }

  // === Phase 5: 육지 적응 형질 변이 ===
  mutated.amphibiousTraits = mutateAmphibiousTraits(genome.amphibiousTraits, rate);

  // === Phase 5.2: 플랑크톤 특성 변이 ===
  mutated.planktonTraits = mutatePlanktonTraits(genome.planktonTraits, rate);

  // === Phase 6: 질병 시스템 관련 변이 ===
  if (Math.random() < rate) {
    mutated.immunity = clamp(mutated.immunity + (Math.random() - 0.5) * 0.1, 0.0, 1.0);
  }
  if (Math.random() < rate) {
    mutated.diseaseResistance = clamp(mutated.diseaseResistance + (Math.random() - 0.5) * 0.1, 0.0, 1.0);
  }
  if (Math.random() < rate) {
    mutated.maxLifespan = clamp(mutated.maxLifespan * (0.9 + Math.random() * 0.2), 3000, 30000);
  }

  // 육지 적응도 계산 후 habitat 자동 결정
  const landAdaptation = calculateLandAdaptation(mutated.amphibiousTraits);
  if (landAdaptation >= 0.8 && mutated.habitat === 'amphibious') {
    mutated.habitat = 'land';
  } else if (landAdaptation >= 0.5 && mutated.habitat === 'water') {
    mutated.habitat = 'amphibious';
  }

  return mutated;
}

/**
 * 외형 유전자 돌연변이
 */
export function mutateAppearance(appearance: AppearanceGene, rate: number): AppearanceGene {
  const mutated = { ...appearance };

  // 몸체 형태 변이 (드물게)
  if (Math.random() < rate * 0.2) {
    mutated.bodyShape = randomElement(BODY_SHAPES);
  }

  if (Math.random() < rate * 0.3) {
    mutated.bodySegments = clamp(
      Math.round(mutated.bodySegments + (Math.random() - 0.5) * 2),
      1,
      5
    );
  }

  if (Math.random() < rate * 0.2) {
    mutated.bodySymmetry = randomElement(SYMMETRIES);
  }

  // 부속물 변이
  if (Math.random() < rate) {
    mutated.spikes = clamp(
      Math.round(mutated.spikes + (Math.random() - 0.5) * 2),
      0,
      8
    );
  }

  if (Math.random() < rate) {
    mutated.spikeLength = clamp(
      mutated.spikeLength + (Math.random() - 0.5) * 0.3,
      0.2,
      1.0
    );
  }

  if (Math.random() < rate) {
    mutated.tailLength = clamp(
      mutated.tailLength + (Math.random() - 0.5) * 0.3,
      0,
      1.0
    );
  }

  if (Math.random() < rate * 0.5) {
    mutated.flagella = clamp(
      Math.round(mutated.flagella + (Math.random() - 0.5) * 2),
      0,
      4
    );
  }

  // 패턴 변이
  if (Math.random() < rate * 0.3) {
    mutated.pattern = randomElement(PATTERNS);
  }

  if (Math.random() < rate) {
    mutated.patternScale = clamp(
      mutated.patternScale + (Math.random() - 0.5) * 0.4,
      0.5,
      2.0
    );
  }

  if (Math.random() < rate) {
    mutated.patternIntensity = clamp(
      mutated.patternIntensity + (Math.random() - 0.5) * 0.3,
      0,
      1.0
    );
  }

  // 보조 색상 변이
  if (Math.random() < rate) {
    mutated.secondaryHue = (mutated.secondaryHue + (Math.random() - 0.5) * 60 + 360) % 360;
  }

  if (Math.random() < rate) {
    mutated.secondarySaturation = clamp(
      mutated.secondarySaturation + (Math.random() - 0.5) * 20,
      30,
      100
    );
  }

  if (Math.random() < rate) {
    mutated.secondaryLightness = clamp(
      mutated.secondaryLightness + (Math.random() - 0.5) * 20,
      30,
      70
    );
  }

  // 특수 효과 변이 (드물게)
  if (Math.random() < rate * 0.2) {
    mutated.transparency = clamp(
      mutated.transparency + (Math.random() - 0.5) * 0.1,
      0,
      0.5
    );
  }

  if (Math.random() < rate * 0.1) {
    mutated.glow = clamp(
      mutated.glow + (Math.random() - 0.5) * 0.2,
      0,
      1.0
    );
  }

  if (Math.random() < rate * 0.3) {
    mutated.outline = clamp(
      mutated.outline + (Math.random() - 0.5) * 1,
      0,
      3
    );
  }

  return mutated;
}

/**
 * 두 부모의 유전자 교배 (유성생식)
 * 각 유전자를 50% 확률로 부모 중 하나에서 선택
 */
export function crossoverGenome(parent1: Genome, parent2: Genome): Genome {
  const child: Genome = {
    size: Math.random() < 0.5 ? parent1.size : parent2.size,
    speed: Math.random() < 0.5 ? parent1.speed : parent2.speed,
    metabolism: Math.random() < 0.5 ? parent1.metabolism : parent2.metabolism,

    sensorRange: Math.random() < 0.5 ? parent1.sensorRange : parent2.sensorRange,
    sensorCount: Math.random() < 0.5 ? parent1.sensorCount : parent2.sensorCount,

    hue: Math.random() < 0.5 ? parent1.hue : parent2.hue,
    saturation: Math.random() < 0.5 ? parent1.saturation : parent2.saturation,
    lightness: Math.random() < 0.5 ? parent1.lightness : parent2.lightness,

    appearance: crossoverAppearance(parent1.appearance, parent2.appearance),

    hiddenLayers: Math.random() < 0.5 ? parent1.hiddenLayers : parent2.hiddenLayers,
    neuronsPerLayer: Math.random() < 0.5 ? parent1.neuronsPerLayer : parent2.neuronsPerLayer,

    mutationRate: (parent1.mutationRate + parent2.mutationRate) / 2, // 평균값 사용

    // === Phase 2: 다세포 관련 교배 ===
    cooperation: Math.random() < 0.5 ? parent1.cooperation : parent2.cooperation,
    bondStrength: Math.random() < 0.5 ? parent1.bondStrength : parent2.bondStrength,
    specialization: Math.random() < 0.5 ? parent1.specialization : parent2.specialization,

    // === Phase 2: 종 분화 관련 교배 ===
    kingdom: Math.random() < 0.5 ? parent1.kingdom : parent2.kingdom,
    diet: Math.random() < 0.5 ? parent1.diet : parent2.diet,
    locomotion: Math.random() < 0.5 ? parent1.locomotion : parent2.locomotion,

    // === Phase 2: 성선택 관련 교배 ===
    sexualMaturity: (parent1.sexualMaturity + parent2.sexualMaturity) / 2,
    displayIntensity: Math.random() < 0.5 ? parent1.displayIntensity : parent2.displayIntensity,
    preferenceStrength: Math.random() < 0.5 ? parent1.preferenceStrength : parent2.preferenceStrength,

    // === Phase 5: 서식지 관련 교배 ===
    habitat: Math.random() < 0.5 ? parent1.habitat : parent2.habitat,
    amphibiousTraits: crossoverAmphibiousTraits(parent1.amphibiousTraits, parent2.amphibiousTraits),

    // === Phase 5.2: 플랑크톤 교배 ===
    planktonTraits: crossoverPlanktonTraits(parent1.planktonTraits, parent2.planktonTraits),

    // === Phase 6: 질병 시스템 교배 ===
    immunity: (parent1.immunity + parent2.immunity) / 2,
    diseaseResistance: (parent1.diseaseResistance + parent2.diseaseResistance) / 2,
    maxLifespan: (parent1.maxLifespan + parent2.maxLifespan) / 2,
  };

  return child;
}

/**
 * 외형 유전자 교배
 */
export function crossoverAppearance(parent1: AppearanceGene, parent2: AppearanceGene): AppearanceGene {
  return {
    bodyShape: Math.random() < 0.5 ? parent1.bodyShape : parent2.bodyShape,
    bodySegments: Math.random() < 0.5 ? parent1.bodySegments : parent2.bodySegments,
    bodySymmetry: Math.random() < 0.5 ? parent1.bodySymmetry : parent2.bodySymmetry,

    spikes: Math.random() < 0.5 ? parent1.spikes : parent2.spikes,
    spikeLength: Math.random() < 0.5 ? parent1.spikeLength : parent2.spikeLength,
    tailLength: Math.random() < 0.5 ? parent1.tailLength : parent2.tailLength,
    flagella: Math.random() < 0.5 ? parent1.flagella : parent2.flagella,

    pattern: Math.random() < 0.5 ? parent1.pattern : parent2.pattern,
    patternScale: Math.random() < 0.5 ? parent1.patternScale : parent2.patternScale,
    patternIntensity: Math.random() < 0.5 ? parent1.patternIntensity : parent2.patternIntensity,

    secondaryHue: Math.random() < 0.5 ? parent1.secondaryHue : parent2.secondaryHue,
    secondarySaturation: Math.random() < 0.5 ? parent1.secondarySaturation : parent2.secondarySaturation,
    secondaryLightness: Math.random() < 0.5 ? parent1.secondaryLightness : parent2.secondaryLightness,

    transparency: Math.random() < 0.5 ? parent1.transparency : parent2.transparency,
    glow: Math.random() < 0.5 ? parent1.glow : parent2.glow,
    outline: Math.random() < 0.5 ? parent1.outline : parent2.outline,
  };
}

/**
 * 유틸리티: 값을 최소/최대 범위로 제한
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 육지 적응 형질 돌연변이
 * 해변(양서 가능 지역)에서만 변이 발생 확률이 높음
 */
export function mutateAmphibiousTraits(
  traits: AmphibiousTraits,
  rate: number,
  isOnBeach: boolean = false
): AmphibiousTraits {
  const mutated = { ...traits };

  // 해변에서는 변이 확률 10배 증가
  const adjustedRate = isOnBeach ? rate * 10 : rate;

  if (Math.random() < adjustedRate) {
    mutated.desiccationResistance = clamp(
      mutated.desiccationResistance + (Math.random() - 0.3) * 0.1,
      0,
      1
    );
  }

  if (Math.random() < adjustedRate) {
    mutated.lungCapacity = clamp(
      mutated.lungCapacity + (Math.random() - 0.3) * 0.1,
      0,
      1
    );
  }

  if (Math.random() < adjustedRate) {
    mutated.limbDevelopment = clamp(
      mutated.limbDevelopment + (Math.random() - 0.3) * 0.1,
      0,
      1
    );
  }

  return mutated;
}

/**
 * 육지 적응도 계산
 * 세 가지 형질의 평균값을 반환
 */
export function calculateLandAdaptation(traits: AmphibiousTraits): number {
  return (
    traits.desiccationResistance +
    traits.lungCapacity +
    traits.limbDevelopment
  ) / 3;
}

/**
 * 육지 적응 형질 교배
 */
export function crossoverAmphibiousTraits(
  parent1: AmphibiousTraits,
  parent2: AmphibiousTraits
): AmphibiousTraits {
  return {
    desiccationResistance: Math.random() < 0.5
      ? parent1.desiccationResistance
      : parent2.desiccationResistance,
    lungCapacity: Math.random() < 0.5
      ? parent1.lungCapacity
      : parent2.lungCapacity,
    limbDevelopment: Math.random() < 0.5
      ? parent1.limbDevelopment
      : parent2.limbDevelopment,
  };
}

// ===== Phase 5.2: 플랑크톤 시스템 =====

/**
 * 식물성 플랑크톤 유전자 생성
 * 광합성을 통해 산소를 생산하는 최초의 생명체
 */
export function createPhytoplanktonGenome(): Genome {
  const genome = createRandomGenome();

  // 식물성 플랑크톤 특성
  genome.kingdom = 'plant';
  genome.diet = 'photosynthetic';
  genome.locomotion = 'floating';
  genome.habitat = 'water';

  // 작은 크기
  genome.size = 0.2 + Math.random() * 0.3; // 0.2 ~ 0.5
  genome.speed = 0.1 + Math.random() * 0.2; // 매우 느림 (부유)

  // 녹색 계열 색상 (엽록소)
  genome.hue = 80 + Math.random() * 60; // 80 ~ 140 (녹색~연두)
  genome.saturation = 60 + Math.random() * 30;
  genome.lightness = 40 + Math.random() * 20;

  // 발광 (생물발광)
  genome.appearance.glow = 0.2 + Math.random() * 0.3;
  genome.appearance.transparency = 0.2 + Math.random() * 0.2;

  // 플랑크톤 특성
  genome.planktonTraits = {
    isPlankton: true,
    planktonType: 'phyto',
    buoyancy: 0.8 + Math.random() * 0.2, // 높은 부력
    oxygenProduction: 0.5 + Math.random() * 0.5, // 산소 생산률
    filterFeedingEfficiency: 0, // 식물성은 여과 섭식 안 함
  };

  return genome;
}

/**
 * 동물성 플랑크톤 유전자 생성
 * 식물성 플랑크톤을 먹는 작은 동물
 */
export function createZooplanktonGenome(): Genome {
  const genome = createRandomGenome();

  // 동물성 플랑크톤 특성
  genome.kingdom = 'animal';
  genome.diet = 'filter_feeder'; // 여과 섭식
  genome.locomotion = 'floating';
  genome.habitat = 'water';

  // 약간 더 큰 크기
  genome.size = 0.3 + Math.random() * 0.5; // 0.3 ~ 0.8
  genome.speed = 0.3 + Math.random() * 0.3; // 느린 수영

  // 청록색 계열 (물색)
  genome.hue = 180 + Math.random() * 60; // 180 ~ 240 (청록~파랑)
  genome.saturation = 50 + Math.random() * 30;
  genome.lightness = 50 + Math.random() * 20;

  // 투명한 외형
  genome.appearance.transparency = 0.3 + Math.random() * 0.3;
  genome.appearance.flagella = 1 + Math.floor(Math.random() * 3); // 편모

  // 플랑크톤 특성
  genome.planktonTraits = {
    isPlankton: true,
    planktonType: 'zoo',
    buoyancy: 0.6 + Math.random() * 0.3,
    oxygenProduction: 0, // 동물성은 산소 생산 안 함
    filterFeedingEfficiency: 0.5 + Math.random() * 0.5, // 여과 섭식 효율
  };

  return genome;
}

/**
 * 플랑크톤 특성 돌연변이
 */
export function mutatePlanktonTraits(
  traits: PlanktonTraits,
  rate: number
): PlanktonTraits {
  const mutated = { ...traits };

  // 플랑크톤이 아니면 변이 없음
  if (!traits.isPlankton) return mutated;

  // 부력 변이
  if (Math.random() < rate) {
    mutated.buoyancy = clamp(
      mutated.buoyancy + (Math.random() - 0.5) * 0.1,
      0,
      1
    );
  }

  // 식물성: 산소 생산률 변이
  if (traits.planktonType === 'phyto' && Math.random() < rate) {
    mutated.oxygenProduction = clamp(
      mutated.oxygenProduction + (Math.random() - 0.5) * 0.1,
      0,
      1
    );
  }

  // 동물성: 여과 섭식 효율 변이
  if (traits.planktonType === 'zoo' && Math.random() < rate) {
    mutated.filterFeedingEfficiency = clamp(
      mutated.filterFeedingEfficiency + (Math.random() - 0.5) * 0.1,
      0,
      1
    );
  }

  return mutated;
}

/**
 * 플랑크톤 특성 교배
 */
export function crossoverPlanktonTraits(
  parent1: PlanktonTraits,
  parent2: PlanktonTraits
): PlanktonTraits {
  // 둘 다 플랑크톤이 아니면 기본값 반환
  if (!parent1.isPlankton && !parent2.isPlankton) {
    return {
      isPlankton: false,
      planktonType: 'none',
      buoyancy: 0,
      oxygenProduction: 0,
      filterFeedingEfficiency: 0,
    };
  }

  // 하나만 플랑크톤이면 그쪽 특성 계승
  if (parent1.isPlankton && !parent2.isPlankton) return { ...parent1 };
  if (!parent1.isPlankton && parent2.isPlankton) return { ...parent2 };

  // 둘 다 플랑크톤이면 교배
  return {
    isPlankton: true,
    planktonType: Math.random() < 0.5 ? parent1.planktonType : parent2.planktonType,
    buoyancy: (parent1.buoyancy + parent2.buoyancy) / 2,
    oxygenProduction: (parent1.oxygenProduction + parent2.oxygenProduction) / 2,
    filterFeedingEfficiency: (parent1.filterFeedingEfficiency + parent2.filterFeedingEfficiency) / 2,
  };
}

/**
 * 플랑크톤 기본 특성 생성 (비플랑크톤용)
 */
export function createDefaultPlanktonTraits(): PlanktonTraits {
  return {
    isPlankton: false,
    planktonType: 'none',
    buoyancy: 0,
    oxygenProduction: 0,
    filterFeedingEfficiency: 0,
  };
}
