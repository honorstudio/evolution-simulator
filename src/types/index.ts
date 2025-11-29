/**
 * Evolution Simulator - 타입 정의
 */

// ============================================
// 기본 타입
// ============================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// ============================================
// 세계/환경 타입
// ============================================

export const TerrainType = {
  DEEP_OCEAN: 'deep_ocean',
  OCEAN: 'ocean',
  BEACH: 'beach',
  DESERT: 'desert',
  SAVANNA: 'savanna',
  GRASSLAND: 'grassland',
  FOREST: 'forest',
  RAINFOREST: 'rainforest',
  TUNDRA: 'tundra',
  MOUNTAIN: 'mountain',
  SNOW: 'snow',
} as const;
export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType];

export interface Cell {
  x: number;
  y: number;
  elevation: number; // 0-1
  moisture: number; // 0-1
  temperature: number; // 0-1 (정규화된 값)
  terrain: TerrainType;
  nutrients: number; // 0-1
  sunlight: number; // 0-1
}

export interface WorldChunk {
  id: string;
  x: number;
  y: number;
  cells: Cell[][];
  loaded: boolean;
  dirty: boolean;
  lastUpdate: number;
}

export interface Atmosphere {
  oxygen: number; // 0-1
  carbonDioxide: number; // 0-1
  temperature: number; // 글로벌 평균 온도
  humidity: number; // 0-1
}

export interface WorldConfig {
  width: number;
  height: number;
  chunkSize: number;
  seed: number;
  oceanLevel: number;
}

// ============================================
// 생명체 타입
// ============================================

export interface Organism {
  id: string;
  speciesId: string;
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;

  // 상태
  energy: number;
  maxEnergy: number;
  health: number;
  age: number;
  isAlive: boolean;

  // 유전자
  genome: Genome;

  // AI
  brain: NeuralNetwork;

  // 번식
  reproductionCooldown: number;
  generation: number;

  // 관계
  parentIds: [string | null, string | null];
}

export interface Genome {
  body: BodyGenome;
  brain: BrainGenome;
  appearance: AppearanceGenome;
  mutationRate: number;
}

export interface BodyGenome {
  size: number;
  speed: number;
  stamina: number;
  metabolismRate: number;
  lifespan: number;
  senseRange: number;
  reproductionCost: number;
}

export interface BrainGenome {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
  weightsSeed: number;
}

export interface AppearanceGenome {
  bodyShape: 'blob' | 'elongated' | 'spherical';
  primaryColor: HSL;
  secondaryColor: HSL;
  pattern: 'solid' | 'stripes' | 'spots';
}

// ============================================
// 신경망 타입
// ============================================

export interface NeuralNetwork {
  layers: number[];
  weights: Float32Array[];
  biases: Float32Array[];

  forward(input: Float32Array): Float32Array;
  clone(): NeuralNetwork;
  getWeights(): Float32Array[];
  setWeights(weights: Float32Array[]): void;
}

// ============================================
// 종 타입
// ============================================

export interface Species {
  id: string;
  name: string;
  founderId: string;
  foundedAt: number;
  population: number;
  isExtinct: boolean;
  extinctAt?: number;
  representativeGenome: Genome;
}

// ============================================
// 시간 타입
// ============================================

export interface TimeSystem {
  currentTick: number;
  currentDay: number;
  currentYear: number;
  speed: number; // 배율
  isPaused: boolean;
}

// ============================================
// 통계 타입
// ============================================

export interface Statistics {
  totalOrganisms: number;
  totalSpecies: number;
  totalBorn: number;
  totalDied: number;
  extinctSpecies: number;
}

// ============================================
// 재앙 타입
// ============================================

export const DisasterType = {
  METEOR_IMPACT: 'meteor_impact',
  VOLCANIC_ERUPTION: 'volcanic_eruption',
  ICE_AGE: 'ice_age',
  GLOBAL_WARMING: 'global_warming',
  PANDEMIC: 'pandemic',
  FLOOD: 'flood',
  DROUGHT: 'drought',
  RADIATION: 'radiation',
} as const;
export type DisasterType = (typeof DisasterType)[keyof typeof DisasterType];

export interface Disaster {
  type: DisasterType;
  position?: Vector2D;
  radius?: number;
  intensity: number;
  duration: number;
  remainingDuration: number;
}

// ============================================
// UI 타입
// ============================================

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface SelectedEntity {
  type: 'organism' | 'species' | 'cell';
  id: string;
}
