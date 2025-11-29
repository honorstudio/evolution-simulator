/**
 * AI 시스템 타입 정의
 */

// 행동 출력 인덱스
export const BrainOutput = {
  MOVE_DIRECTION: 0, // 이동 방향 (-1 ~ 1)
  MOVE_SPEED: 1, // 이동 속도 (0 ~ 1)
  ATTACK: 2, // 공격 (0 ~ 1)
  FLEE: 3, // 도망 (0 ~ 1)
  EAT: 4, // 먹기 (0 ~ 1)
  COURT: 5, // 구애 (0 ~ 1)
  REPRODUCE: 6, // 번식 (0 ~ 1)
  REST: 7, // 휴식 (0 ~ 1)
} as const;

// 감각 입력 인덱스
export const SensoryInput = {
  // 시각 (0-3)
  VISION_FOOD: 0,
  VISION_PREDATOR: 1,
  VISION_PEER: 2,
  VISION_MATE: 3,
  // 청각 (4-5)
  AUDIO_THREAT: 4,
  AUDIO_SOCIAL: 5,
  // 후각 (6-7)
  SMELL_FOOD: 6,
  SMELL_DANGER: 7,
  // 내부 상태 (8-11)
  INTERNAL_ENERGY: 8,
  INTERNAL_HEALTH: 9,
  INTERNAL_REPRODUCTION: 10,
  INTERNAL_AGE: 11,
} as const;

// 신경망 설정
export interface AdvancedBrainConfig {
  inputSize: 12;
  hiddenSize: 16;
  outputSize: 8;
  hiddenLayers: number; // 1-3
}

// 위치 정보
export interface Position {
  x: number;
  y: number;
}

// 감지된 개체 정보
export interface DetectedEntity {
  id: string;
  position: Position;
  distance: number;
  type: 'food' | 'organism' | 'predator' | 'mate';
  strength?: number; // 위협도 또는 매력도
}

// 단기 기억
export interface ShortTermMemory {
  recentFood: Position[]; // 최근 본 먹이 위치 (최대 10개)
  recentDanger: Position[]; // 최근 위험 지역 (최대 10개)
  recentMates: string[]; // 최근 만난 짝 ID (최대 5개)
  lastUpdateTime: number;
}

// 장기 기억
export interface LongTermMemory {
  homeTerritory: {
    x: number;
    y: number;
    radius: number;
  } | null;
  foodSources: Position[]; // 신뢰할 수 있는 먹이 위치 (최대 5개)
  dangerZones: Position[]; // 위험 지역 (최대 5개)
  birthPlace: Position; // 태어난 곳
}

// 전체 기억
export interface Memory {
  shortTerm: ShortTermMemory;
  longTerm: LongTermMemory;
}

// 행동 결정
export interface BehaviorDecision {
  primaryAction: keyof typeof BrainOutput;
  actionStrength: number; // 0-1
  targetPosition?: Position;
  targetId?: string;
  energyCost: number;
}

// 감각 데이터
export interface SensoryData {
  visual: {
    food: DetectedEntity[];
    predators: DetectedEntity[];
    peers: DetectedEntity[];
    potentialMates: DetectedEntity[];
  };
  auditory: {
    threatLevel: number; // 0-1
    socialLevel: number; // 0-1
  };
  olfactory: {
    foodScent: number; // 0-1
    dangerScent: number; // 0-1
  };
  internal: {
    energy: number; // 0-1
    health: number; // 0-1
    reproductionUrge: number; // 0-1
    age: number; // 0-1
  };
}
