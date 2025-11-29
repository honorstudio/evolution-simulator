/**
 * 시뮬레이션 관련 타입 정의
 */

/**
 * 사망 원因
 */
export enum DeathCause {
  STARVATION = 'starvation', // 굶어 죽음
  OLD_AGE = 'old_age', // 노령
  PREDATION = 'predation', // 포식됨 (추후 구현)
  COLLISION = 'collision', // 충돌 (추후 구현)
}

/**
 * 생명체 상태
 */
export enum OrganismState {
  IDLE = 'idle', // 대기
  MOVING = 'moving', // 이동 중
  EATING = 'eating', // 먹는 중
  REPRODUCING = 'reproducing', // 번식 중
  DYING = 'dying', // 죽어가는 중
}

/**
 * 음식 타입
 */
export enum FoodType {
  PLANT = 'plant', // 식물
  MEAT = 'meat', // 고기 (추후 구현)
}

/**
 * 게임 이벤트
 */
export interface GameEvent {
  type: 'birth' | 'death' | 'eat' | 'reproduce';
  timestamp: number;
  organismId?: string;
  cause?: DeathCause;
  data?: any;
}

/**
 * 생명체 유전자
 */
export interface Genome {
  // 물리적 특성
  size: number; // 크기 (5 ~ 20)
  speed: number; // 속도 (10 ~ 100)

  // 감각
  visionRange: number; // 시야 (50 ~ 300)
  visionAngle: number; // 시야각 (30 ~ 180도)

  // 에너지
  maxEnergy: number; // 최대 에너지 (50 ~ 200)
  metabolismRate: number; // 대사율 (0.5 ~ 2.0)

  // 색상 (식별용)
  color: string; // RGB 문자열
}

/**
 * 공간 쿼리 결과
 */
export interface SpatialQueryResult {
  id: string;
  x: number;
  y: number;
  type: 'organism' | 'food';
  distance: number;
}
