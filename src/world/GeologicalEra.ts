/**
 * 지질 시대 시스템 (Geological Era System)
 *
 * 원시 지구의 진화 과정을 시뮬레이션합니다.
 * 실제 지구 역사를 기반으로 한 시대별 환경 조건을 정의합니다.
 */

import { Atmosphere } from './Atmosphere';

/**
 * 지질 시대 정의
 */
export const GeologicalEra = {
  // 명왕누대 (Hadean) - 45억~40억 년 전
  // 용암 바다, 소행성 충돌, 생명 없음
  HADEAN: 'HADEAN',

  // 초기 시생누대 (Early Archean) - 40억~35억 년 전
  // 바다 형성, 열수구, 최초의 원핵생물
  EARLY_ARCHEAN: 'EARLY_ARCHEAN',

  // 후기 시생누대 (Late Archean) - 35억~25억 년 전
  // 시아노박테리아 등장, 광합성 시작
  LATE_ARCHEAN: 'LATE_ARCHEAN',

  // 초기 원생누대 (Early Proterozoic) - 25억~18억 년 전
  // 대산화 사건, 산소 증가
  EARLY_PROTEROZOIC: 'EARLY_PROTEROZOIC',

  // 후기 원생누대 (Late Proterozoic) - 18억~5.4억 년 전
  // 진핵생물, 다세포 생물 등장
  LATE_PROTEROZOIC: 'LATE_PROTEROZOIC',

  // 고생대 (Paleozoic) - 5.4억~2.5억 년 전
  // 캄브리아 대폭발, 어류, 양서류, 파충류
  PALEOZOIC: 'PALEOZOIC',

  // 중생대 (Mesozoic) - 2.5억~6600만 년 전
  // 공룡 시대, 포유류 등장
  MESOZOIC: 'MESOZOIC',

  // 신생대 (Cenozoic) - 6600만 년 전~현재
  // 포유류 번성, 인류 등장
  CENOZOIC: 'CENOZOIC',
} as const;

export type GeologicalEraType = (typeof GeologicalEra)[keyof typeof GeologicalEra];

/**
 * 각 시대별 환경 조건
 */
export interface EraEnvironment {
  // 시대 이름
  era: GeologicalEraType;

  // 한글 이름
  nameKo: string;

  // 영문 이름
  nameEn: string;

  // 시대 설명
  description: string;

  // 시작 연도 (억 년 전)
  startYearsBillionAgo: number;

  // 대기 조성
  atmosphere: Atmosphere;

  // 생명 존재 가능 여부
  lifePossible: boolean;

  // 가능한 생명 형태
  lifeTypes: LifeType[];

  // 배경 색상 (렌더링용)
  backgroundColor: number;

  // 물 색상 (렌더링용)
  waterColor: number;

  // 식량 생성률 배율
  foodSpawnMultiplier: number;

  // 돌연변이율 배율
  mutationMultiplier: number;
}

/**
 * 생명 형태 타입
 */
export const LifeType = {
  NONE: 'NONE', // 생명 없음
  ORGANIC_MOLECULES: 'ORGANIC_MOLECULES', // 유기 분자
  PROKARYOTE: 'PROKARYOTE', // 원핵생물 (박테리아, 고세균)
  CYANOBACTERIA: 'CYANOBACTERIA', // 시아노박테리아 (광합성)
  EUKARYOTE: 'EUKARYOTE', // 진핵생물
  MULTICELLULAR: 'MULTICELLULAR', // 다세포 생물
  PLANT: 'PLANT', // 식물
  ANIMAL: 'ANIMAL', // 동물
} as const;

export type LifeType = (typeof LifeType)[keyof typeof LifeType];

/**
 * 시대별 환경 데이터
 */
export const ERA_ENVIRONMENTS: Record<GeologicalEraType, EraEnvironment> = {
  [GeologicalEra.HADEAN]: {
    era: GeologicalEra.HADEAN,
    nameKo: '명왕누대',
    nameEn: 'Hadean Eon',
    description: '용암 바다와 소행성 충돌. 대기는 CO₂, N₂, 수증기로 가득. 생명 없음.',
    startYearsBillionAgo: 4.5,
    atmosphere: {
      oxygen: 0,
      carbonDioxide: 100000, // 10% = 100,000 ppm
      globalTemperature: 200, // 극고온
      nitrogen: 3,
      other: 97, // CO₂, 수증기, 메탄 등
    },
    lifePossible: false,
    lifeTypes: [LifeType.NONE],
    backgroundColor: 0x2a0a0a, // 어두운 적색 (용암)
    waterColor: 0x1a0505, // 거의 없음
    foodSpawnMultiplier: 0,
    mutationMultiplier: 5, // 방사선으로 높은 돌연변이
  },

  [GeologicalEra.EARLY_ARCHEAN]: {
    era: GeologicalEra.EARLY_ARCHEAN,
    nameKo: '초기 시생누대',
    nameEn: 'Early Archean',
    description: '바다 형성. 열수구 주변에서 최초의 생명 등장. 혐기성 원핵생물.',
    startYearsBillionAgo: 4.0,
    atmosphere: {
      oxygen: 0.001, // 거의 없음
      carbonDioxide: 50000, // 5%
      globalTemperature: 70, // 뜨거운 바다
      nitrogen: 10,
      other: 90,
    },
    lifePossible: true,
    lifeTypes: [LifeType.ORGANIC_MOLECULES, LifeType.PROKARYOTE],
    backgroundColor: 0x0a1a2a, // 어두운 바다색
    waterColor: 0x1a3050, // 짙은 바다
    foodSpawnMultiplier: 0.3, // 열수구 주변에서만
    mutationMultiplier: 3,
  },

  [GeologicalEra.LATE_ARCHEAN]: {
    era: GeologicalEra.LATE_ARCHEAN,
    nameKo: '후기 시생누대',
    nameEn: 'Late Archean',
    description: '시아노박테리아 등장! 광합성 시작. 산소가 천천히 생성되기 시작.',
    startYearsBillionAgo: 3.5,
    atmosphere: {
      oxygen: 0.1, // 아직 미미
      carbonDioxide: 30000, // 3%
      globalTemperature: 50,
      nitrogen: 20,
      other: 80,
    },
    lifePossible: true,
    lifeTypes: [LifeType.PROKARYOTE, LifeType.CYANOBACTERIA],
    backgroundColor: 0x0a2030, // 약간 밝아진 바다
    waterColor: 0x2a4060, // 청록빛 바다
    foodSpawnMultiplier: 0.5,
    mutationMultiplier: 2,
  },

  [GeologicalEra.EARLY_PROTEROZOIC]: {
    era: GeologicalEra.EARLY_PROTEROZOIC,
    nameKo: '초기 원생누대',
    nameEn: 'Early Proterozoic',
    description: '대산화 사건! 산소가 대기에 축적. 혐기성 생물 대멸종. 진핵생물 등장.',
    startYearsBillionAgo: 2.5,
    atmosphere: {
      oxygen: 2, // 산소 증가 시작!
      carbonDioxide: 5000, // 0.5%
      globalTemperature: 25,
      nitrogen: 50,
      other: 48,
    },
    lifePossible: true,
    lifeTypes: [LifeType.PROKARYOTE, LifeType.CYANOBACTERIA, LifeType.EUKARYOTE],
    backgroundColor: 0x1a3040, // 점점 밝아짐
    waterColor: 0x3a6080, // 푸른 바다
    foodSpawnMultiplier: 0.7,
    mutationMultiplier: 1.5,
  },

  [GeologicalEra.LATE_PROTEROZOIC]: {
    era: GeologicalEra.LATE_PROTEROZOIC,
    nameKo: '후기 원생누대',
    nameEn: 'Late Proterozoic',
    description: '다세포 생물 등장! 에디아카라 생물군. 눈덩이 지구 빙하기.',
    startYearsBillionAgo: 1.8,
    atmosphere: {
      oxygen: 10, // 현재의 절반
      carbonDioxide: 1000,
      globalTemperature: 15,
      nitrogen: 70,
      other: 20,
    },
    lifePossible: true,
    lifeTypes: [
      LifeType.PROKARYOTE,
      LifeType.CYANOBACTERIA,
      LifeType.EUKARYOTE,
      LifeType.MULTICELLULAR,
    ],
    backgroundColor: 0x2a4050, // 밝은 바다
    waterColor: 0x4080a0, // 현대적 바다색
    foodSpawnMultiplier: 0.8,
    mutationMultiplier: 1.2,
  },

  [GeologicalEra.PALEOZOIC]: {
    era: GeologicalEra.PALEOZOIC,
    nameKo: '고생대',
    nameEn: 'Paleozoic Era',
    description: '캄브리아 대폭발! 식물 육상 진출. 어류, 양서류, 파충류 진화.',
    startYearsBillionAgo: 0.54,
    atmosphere: {
      oxygen: 21, // 현대 수준
      carbonDioxide: 500,
      globalTemperature: 18,
      nitrogen: 78,
      other: 1,
    },
    lifePossible: true,
    lifeTypes: [
      LifeType.PROKARYOTE,
      LifeType.EUKARYOTE,
      LifeType.MULTICELLULAR,
      LifeType.PLANT,
      LifeType.ANIMAL,
    ],
    backgroundColor: 0x1a4030, // 녹색빛 육지
    waterColor: 0x4080c0, // 푸른 바다
    foodSpawnMultiplier: 1.0,
    mutationMultiplier: 1.0,
  },

  [GeologicalEra.MESOZOIC]: {
    era: GeologicalEra.MESOZOIC,
    nameKo: '중생대',
    nameEn: 'Mesozoic Era',
    description: '공룡 시대! 온난한 기후. 포유류와 조류 등장. 꽃피는 식물 진화.',
    startYearsBillionAgo: 0.25,
    atmosphere: {
      oxygen: 25, // 높은 산소
      carbonDioxide: 1000,
      globalTemperature: 22, // 온난
      nitrogen: 74,
      other: 1,
    },
    lifePossible: true,
    lifeTypes: [
      LifeType.PROKARYOTE,
      LifeType.EUKARYOTE,
      LifeType.MULTICELLULAR,
      LifeType.PLANT,
      LifeType.ANIMAL,
    ],
    backgroundColor: 0x2a5040, // 울창한 녹색
    waterColor: 0x3070b0,
    foodSpawnMultiplier: 1.5, // 풍부한 식물
    mutationMultiplier: 0.8,
  },

  [GeologicalEra.CENOZOIC]: {
    era: GeologicalEra.CENOZOIC,
    nameKo: '신생대',
    nameEn: 'Cenozoic Era',
    description: '현대. 포유류 번성. 인류 등장. 빙하기와 간빙기 반복.',
    startYearsBillionAgo: 0.066,
    atmosphere: {
      oxygen: 21,
      carbonDioxide: 415,
      globalTemperature: 15,
      nitrogen: 78,
      other: 1,
    },
    lifePossible: true,
    lifeTypes: [
      LifeType.PROKARYOTE,
      LifeType.EUKARYOTE,
      LifeType.MULTICELLULAR,
      LifeType.PLANT,
      LifeType.ANIMAL,
    ],
    backgroundColor: 0x3a6050, // 현대 지구
    waterColor: 0x2060a0, // 현대 바다
    foodSpawnMultiplier: 1.0,
    mutationMultiplier: 1.0,
  },
};

/**
 * 시대 순서 (시간 순)
 */
export const ERA_ORDER: GeologicalEraType[] = [
  GeologicalEra.HADEAN,
  GeologicalEra.EARLY_ARCHEAN,
  GeologicalEra.LATE_ARCHEAN,
  GeologicalEra.EARLY_PROTEROZOIC,
  GeologicalEra.LATE_PROTEROZOIC,
  GeologicalEra.PALEOZOIC,
  GeologicalEra.MESOZOIC,
  GeologicalEra.CENOZOIC,
];

/**
 * 시대 관리자 클래스
 */
export class GeologicalEraManager {
  private currentEra: GeologicalEraType;
  private simulationTime: number = 0; // 시뮬레이션 경과 시간 (ms)
  private eraTransitionTime: number = 60000; // 기본 60초마다 시대 전환

  // 시대 전환 콜백
  private onEraChange?: (newEra: GeologicalEraType, oldEra: GeologicalEraType) => void;

  constructor(startEra: GeologicalEraType = GeologicalEra.HADEAN) {
    this.currentEra = startEra;
  }

  /**
   * 현재 시대 반환
   */
  getCurrentEra(): GeologicalEraType {
    return this.currentEra;
  }

  /**
   * 현재 시대 환경 반환
   */
  getCurrentEnvironment(): EraEnvironment {
    return ERA_ENVIRONMENTS[this.currentEra];
  }

  /**
   * 다음 시대로 진행
   */
  advanceToNextEra(): boolean {
    const currentIndex = ERA_ORDER.indexOf(this.currentEra);
    if (currentIndex < ERA_ORDER.length - 1) {
      const oldEra = this.currentEra;
      const nextEra = ERA_ORDER[currentIndex + 1];
      if (!nextEra) return false;

      this.currentEra = nextEra;

      if (this.onEraChange) {
        this.onEraChange(this.currentEra, oldEra);
      }

      console.log(`🌍 시대 전환: ${ERA_ENVIRONMENTS[oldEra].nameKo} → ${ERA_ENVIRONMENTS[this.currentEra].nameKo}`);
      return true;
    }
    return false;
  }

  /**
   * 특정 시대로 이동
   */
  setEra(era: GeologicalEraType): void {
    const oldEra = this.currentEra;
    this.currentEra = era;

    if (this.onEraChange && oldEra !== era) {
      this.onEraChange(this.currentEra, oldEra);
    }
  }

  /**
   * 시간 업데이트 (자동 시대 전환)
   */
  update(delta: number): void {
    this.simulationTime += delta;

    // 시대 전환 시간 체크
    const targetEraIndex = Math.floor(this.simulationTime / this.eraTransitionTime);
    const currentIndex = ERA_ORDER.indexOf(this.currentEra);

    if (targetEraIndex > currentIndex && currentIndex < ERA_ORDER.length - 1) {
      this.advanceToNextEra();
    }
  }

  /**
   * 시대 전환 시간 설정
   */
  setEraTransitionTime(ms: number): void {
    this.eraTransitionTime = ms;
  }

  /**
   * 시대 변경 콜백 등록
   */
  setOnEraChange(callback: (newEra: GeologicalEraType, oldEra: GeologicalEraType) => void): void {
    this.onEraChange = callback;
  }

  /**
   * 시뮬레이션 시간 반환
   */
  getSimulationTime(): number {
    return this.simulationTime;
  }

  /**
   * 다음 시대까지 남은 시간 (%)
   */
  getProgressToNextEra(): number {
    const timeInCurrentEra = this.simulationTime % this.eraTransitionTime;
    return (timeInCurrentEra / this.eraTransitionTime) * 100;
  }

  /**
   * 리셋
   */
  reset(startEra: GeologicalEraType = GeologicalEra.HADEAN): void {
    this.currentEra = startEra;
    this.simulationTime = 0;
  }

  /**
   * 특정 생명 형태가 현재 시대에서 가능한지 확인
   */
  isLifeTypePossible(lifeType: LifeType): boolean {
    const env = this.getCurrentEnvironment();
    return env.lifeTypes.includes(lifeType);
  }

  /**
   * 직렬화
   */
  serialize(): string {
    return JSON.stringify({
      currentEra: this.currentEra,
      simulationTime: this.simulationTime,
      eraTransitionTime: this.eraTransitionTime,
    });
  }

  /**
   * 역직렬화
   */
  static deserialize(data: string): GeologicalEraManager {
    const parsed = JSON.parse(data);
    const manager = new GeologicalEraManager(parsed.currentEra);
    manager.simulationTime = parsed.simulationTime;
    manager.eraTransitionTime = parsed.eraTransitionTime;
    return manager;
  }
}
