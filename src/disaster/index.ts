/**
 * 재앙 시스템 모듈
 *
 * Phase 3: 재앙과 환경 변화
 *
 * 이 모듈은 게임의 핵심 시뮬레이션 요소인 재앙 시스템을 제공합니다.
 * 다양한 타입의 자연재해와 환경 변화를 통해 진화 압력을 생성합니다.
 */

// 타입 정의
export {
  DisasterType,
  DISASTER_CONFIGS,
  DISASTER_BASE_EFFECTS
} from './DisasterTypes';

export type {
  DisasterConfig,
  DisasterEffect,
} from './DisasterTypes';

// 재앙 클래스
export { Disaster } from './Disaster';
export type { ActiveDisaster } from './Disaster';

// 재앙 관리자
export { DisasterManager } from './DisasterManager';

// === 편의 함수 ===
import { DisasterType, DISASTER_CONFIGS } from './DisasterTypes';

/**
 * 편의 함수: 모든 재앙 타입 목록 반환
 */
export function getAllDisasterTypes(): DisasterType[] {
  return Object.values(DisasterType) as DisasterType[];
}

/**
 * 편의 함수: 재앙 타입을 한글 이름으로 변환
 */
export function getDisasterTypeName(type: DisasterType): string {
  const config = DISASTER_CONFIGS.get(type);
  return config?.name || String(type);
}

/**
 * 편의 함수: 재앙 타입을 이모지로 변환
 */
export function getDisasterTypeIcon(type: DisasterType): string {
  const config = DISASTER_CONFIGS.get(type);
  return config?.icon || '❓';
}
