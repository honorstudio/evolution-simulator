/**
 * 저장 데이터 타입 정의
 *
 * IndexedDB에 저장되는 모든 데이터의 구조를 정의합니다.
 *
 * Phase 2 업데이트:
 * - 외형, 종분화, 성선택, 다세포 시스템 지원
 * - 고급 AI (AIController) 직렬화 지원
 */

import type { AppearanceGene, Kingdom, DietType, LocomotionType, HabitatType, AmphibiousTraits, PlanktonTraits } from '../organism/Genome';
import type { Sex } from '../organism/Organism';
import type { MulticellularTraits } from '../organism/multicellular/types';

/**
 * 저장 슬롯 메타데이터
 */
export interface SaveMeta {
  version: string;          // 게임 버전 (호환성 체크용)
  slotIndex: number;        // 저장 슬롯 번호 (0~5, 0은 자동저장)
  name: string;             // 저장 이름 (예: "세대 100 - 개체수 245")
  createdAt: number;        // 생성 시간 (timestamp)
  updatedAt: number;        // 마지막 업데이트 시간 (timestamp)
  playTime: number;         // 플레이 시간 (밀리초)
  thumbnail?: string;       // 썸네일 이미지 (base64, 선택사항)
}

/**
 * 시뮬레이션 상태
 */
export interface SavedSimulation {
  tick: number;             // 현재 틱 (시간)
  speed: number;            // 게임 속도
  worldWidth: number;       // 월드 가로 크기
  worldHeight: number;      // 월드 세로 크기
  generation: number;       // 현재 세대
}

/**
 * 직렬화된 유전자 정보
 */
export interface SerializedGenome {
  // 기본 속성
  size: number;
  speed: number;
  metabolism: number;
  sensorRange: number;
  sensorCount: number;
  hue: number;
  saturation: number;
  lightness: number;
  hiddenLayers: number;
  neuronsPerLayer: number;
  mutationRate: number;

  // Phase 2: 외형 유전자
  appearance: AppearanceGene;

  // Phase 2: 다세포 관련
  cooperation: number;
  bondStrength: number;
  specialization: number;

  // Phase 2: 종 분화 관련
  kingdom: Kingdom;
  diet: DietType;
  locomotion: LocomotionType;

  // Phase 2: 성선택 관련
  sexualMaturity: number;
  displayIntensity: number;
  preferenceStrength: number;

  // Phase 5: 서식지 관련 (선택적 - 이전 버전 호환성)
  habitat?: HabitatType;
  amphibiousTraits?: AmphibiousTraits;

  // Phase 5.2: 플랑크톤 관련 (선택적 - 이전 버전 호환성)
  planktonTraits?: PlanktonTraits;

  // Phase 6: 질병 시스템 관련 (선택적 - 이전 버전 호환성)
  immunity?: number;
  diseaseResistance?: number;
  maxLifespan?: number;
}

/**
 * 직렬화된 생명체
 */
export interface SerializedOrganism {
  // 기본 상태
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  energy: number;
  maxEnergy: number;
  age: number;
  genome: SerializedGenome;

  // 기본 뇌 (호환성 유지)
  brainWeights: number[][][];  // 뇌 가중치
  brainBiases: number[][];     // 뇌 바이어스

  // Phase 2: 추가 상태
  generation: number;          // 세대
  health: number;              // 건강도
  reproductionCooldown: number;// 번식 쿨다운

  // Phase 2: 성선택
  sex: Sex;                    // 성별
  attractiveness: number;      // 매력도
  matingDesire: number;        // 짝짓기 욕구

  // Phase 2: 다세포 시스템
  multicellular?: MulticellularTraits;  // 다세포 데이터 (단세포면 없음)

  // Phase 2: 고급 AI
  useAdvancedAI: boolean;      // 고급 AI 사용 여부
  aiControllerData?: string;   // AIController 직렬화 데이터 (JSON)
}

/**
 * 직렬화된 음식
 */
export interface SerializedFood {
  id: string;
  x: number;
  y: number;
  energy: number;
}

/**
 * 통계 데이터
 */
export interface SavedStatistics {
  totalBorn: number;        // 누적 출생 수
  totalDied: number;        // 누적 사망 수
  maxPopulation: number;    // 최대 개체 수 기록
  oldestAge: number;        // 최고령 기록
}

/**
 * 완전한 저장 데이터
 */
export interface SaveData {
  meta: SaveMeta;
  simulation: SavedSimulation;
  organisms: SerializedOrganism[];
  foods: SerializedFood[];
  statistics: SavedStatistics;
}

/**
 * 저장 슬롯 목록 아이템
 */
export interface SaveSlotInfo {
  slotIndex: number;
  exists: boolean;          // 저장 데이터가 있는지 여부
  meta?: SaveMeta;          // 저장 데이터가 있으면 메타 정보
}

/**
 * 게임 버전 (호환성 관리용)
 * - 1.0.0: Phase 1 기본 시스템
 * - 2.0.0: Phase 2 다세포, 성선택, 고급 AI 추가
 */
export const SAVE_VERSION = '2.0.0';
