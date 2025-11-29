/**
 * 시뮬레이션 모듈 내보내기
 *
 * 시뮬레이션 관련 모든 클래스와 타입을 한 곳에서 관리합니다.
 */

// 설정
export {
  DEFAULT_CONFIG,
  FAST_EVOLUTION_CONFIG,
  HARDCORE_CONFIG,
} from './config';
export type { SimulationConfig } from './config';

// 시간 관리
export { TimeManager } from './Time';

// 통계
export { StatisticsTracker } from './Statistics';
export type { SimulationStats } from './Statistics';

// 시뮬레이션 엔진
export { SimulationEngine } from './SimulationEngine';

// Phase 3: 재앙 시스템 (재내보내기)
export { DisasterType, DisasterManager, Disaster } from '../disaster';
export type { DisasterEffect, DisasterConfig } from '../disaster';
