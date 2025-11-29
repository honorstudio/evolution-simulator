/**
 * 질병 시스템 모듈
 * Phase 6: 질병과 면역 시스템
 *
 * 생명체가 감염될 수 있는 다양한 질병과 전파 시스템을 제공합니다.
 */

// 타입 정의
export {
  DiseaseType,
  DISEASE_CONFIGS,
  getAllDiseaseTypes,
  getContagiousDiseases,
  getEnvironmentalDiseases,
} from './DiseaseTypes';

export type {
  DiseaseConfig,
  DiseaseSymptoms,
  OrganismDiseaseState,
} from './DiseaseTypes';

// 질병 관리자
export { DiseaseManager } from './DiseaseManager';
export type { DiseaseStats } from './DiseaseManager';
