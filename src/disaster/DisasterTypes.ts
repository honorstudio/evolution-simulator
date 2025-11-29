/**
 * 재앙 타입 정의
 * 다양한 카테고리의 자연재해와 환경 변화를 표현합니다
 */
export enum DisasterType {
  // 지질학적 재앙
  METEOR_IMPACT = 'METEOR_IMPACT',        // 운석 충돌 - 즉각적인 대량 사망
  VOLCANIC_ERUPTION = 'VOLCANIC_ERUPTION', // 화산 폭발 - 온도 상승, 식량 감소
  EARTHQUAKE = 'EARTHQUAKE',               // 지진 - 이동 방해, 사망
  TSUNAMI = 'TSUNAMI',                     // 쓰나미 - 특정 영역 초토화

  // 기후 재앙
  ICE_AGE = 'ICE_AGE',                    // 빙하기 - 온도 급감, 식량 감소
  GLOBAL_WARMING = 'GLOBAL_WARMING',       // 지구 온난화 - 온도 상승
  DROUGHT = 'DROUGHT',                     // 가뭄 - 식량 대폭 감소
  MEGA_FLOOD = 'MEGA_FLOOD',              // 대홍수 - 온도 하락, 이동 방해

  // 생물학적 재앙
  PANDEMIC = 'PANDEMIC',                   // 전염병 - 전파성 질병

  // 대기 재앙
  OXYGEN_SPIKE = 'OXYGEN_SPIKE',          // 산소 급증 - 거대 생물 유리
  OXYGEN_DEPLETION = 'OXYGEN_DEPLETION',  // 산소 고갈 - 사망률 증가

  // 우주 재앙
  SOLAR_FLARE = 'SOLAR_FLARE'             // 태양 폭발 - 돌연변이율 급증
}

/**
 * 재앙 설정 인터페이스
 * 각 재앙의 특성과 발생 조건을 정의합니다
 */
export interface DisasterConfig {
  type: DisasterType;
  name: string;
  description: string;
  icon: string;  // 이모지로 시각적 표현
  isGlobal: boolean;  // true: 전역 효과, false: 국지적 효과
  minIntensity: number;  // 최소 강도 (0~1)
  maxIntensity: number;  // 최대 강도 (0~1)
  minDuration: number;  // 최소 지속시간 (밀리초)
  maxDuration: number;  // 최대 지속시간 (밀리초)
  cooldown: number;  // 쿨다운 시간 (밀리초) - 같은 재앙 재발생 방지
  rarity: number;  // 희귀도 (0~1, 낮을수록 희귀) - 랜덤 발생 확률 계산용
}

/**
 * 재앙 효과 인터페이스
 * 재앙이 환경과 생명체에 미치는 영향을 정의합니다
 */
export interface DisasterEffect {
  type: 'temperature' | 'food' | 'mortality' | 'mutation' | 'movement';
  value: number;  // 효과 값
  operation: 'multiply' | 'add';  // 연산 방식
}

/**
 * 모든 재앙의 기본 설정
 * 게임 밸런스를 위한 중앙 집중식 설정 관리
 */
export const DISASTER_CONFIGS: Map<DisasterType, DisasterConfig> = new Map([
  // 지질학적 재앙
  [DisasterType.METEOR_IMPACT, {
    type: DisasterType.METEOR_IMPACT,
    name: '운석 충돌',
    description: '거대한 운석이 충돌하여 충격파와 화염을 일으킵니다',
    icon: '☄️',
    isGlobal: false,  // 국지적 - 충돌 지점 중심
    minIntensity: 0.7,
    maxIntensity: 1.0,
    minDuration: 5000,  // 5초
    maxDuration: 15000,  // 15초
    cooldown: 120000,  // 2분
    rarity: 0.1  // 매우 희귀
  }],

  [DisasterType.VOLCANIC_ERUPTION, {
    type: DisasterType.VOLCANIC_ERUPTION,
    name: '화산 폭발',
    description: '화산이 폭발하여 용암과 화산재를 뿜어냅니다',
    icon: '🌋',
    isGlobal: false,
    minIntensity: 0.5,
    maxIntensity: 0.9,
    minDuration: 20000,  // 20초
    maxDuration: 60000,  // 1분
    cooldown: 90000,  // 1.5분
    rarity: 0.2
  }],

  [DisasterType.EARTHQUAKE, {
    type: DisasterType.EARTHQUAKE,
    name: '지진',
    description: '땅이 흔들려 생명체의 이동을 방해합니다',
    icon: '🌍',
    isGlobal: false,
    minIntensity: 0.3,
    maxIntensity: 0.8,
    minDuration: 3000,  // 3초
    maxDuration: 10000,  // 10초
    cooldown: 60000,  // 1분
    rarity: 0.3
  }],

  [DisasterType.TSUNAMI, {
    type: DisasterType.TSUNAMI,
    name: '쓰나미',
    description: '거대한 파도가 모든 것을 휩쓸어갑니다',
    icon: '🌊',
    isGlobal: false,
    minIntensity: 0.6,
    maxIntensity: 1.0,
    minDuration: 8000,  // 8초
    maxDuration: 20000,  // 20초
    cooldown: 100000,  // 1분 40초
    rarity: 0.15
  }],

  // 기후 재앙
  [DisasterType.ICE_AGE, {
    type: DisasterType.ICE_AGE,
    name: '빙하기',
    description: '지구 전체의 온도가 급격히 떨어집니다',
    icon: '🧊',
    isGlobal: true,  // 전역 효과
    minIntensity: 0.4,
    maxIntensity: 0.8,
    minDuration: 60000,  // 1분
    maxDuration: 180000,  // 3분
    cooldown: 240000,  // 4분
    rarity: 0.1
  }],

  [DisasterType.GLOBAL_WARMING, {
    type: DisasterType.GLOBAL_WARMING,
    name: '지구 온난화',
    description: '지구 전체의 온도가 상승합니다',
    icon: '🔥',
    isGlobal: true,
    minIntensity: 0.3,
    maxIntensity: 0.7,
    minDuration: 60000,  // 1분
    maxDuration: 180000,  // 3분
    cooldown: 240000,  // 4분
    rarity: 0.15
  }],

  [DisasterType.DROUGHT, {
    type: DisasterType.DROUGHT,
    name: '가뭄',
    description: '물과 식량이 극도로 부족해집니다',
    icon: '🏜️',
    isGlobal: false,
    minIntensity: 0.4,
    maxIntensity: 0.9,
    minDuration: 30000,  // 30초
    maxDuration: 120000,  // 2분
    cooldown: 150000,  // 2.5분
    rarity: 0.25
  }],

  [DisasterType.MEGA_FLOOD, {
    type: DisasterType.MEGA_FLOOD,
    name: '대홍수',
    description: '폭우로 인해 대규모 홍수가 발생합니다',
    icon: '💧',
    isGlobal: false,
    minIntensity: 0.5,
    maxIntensity: 0.9,
    minDuration: 20000,  // 20초
    maxDuration: 60000,  // 1분
    cooldown: 120000,  // 2분
    rarity: 0.2
  }],

  // 생물학적 재앙
  [DisasterType.PANDEMIC, {
    type: DisasterType.PANDEMIC,
    name: '전염병',
    description: '치명적인 질병이 빠르게 퍼져나갑니다',
    icon: '🦠',
    isGlobal: false,  // 발생 지점에서 시작하여 퍼짐
    minIntensity: 0.5,
    maxIntensity: 1.0,
    minDuration: 40000,  // 40초
    maxDuration: 120000,  // 2분
    cooldown: 180000,  // 3분
    rarity: 0.12
  }],

  // 대기 재앙
  [DisasterType.OXYGEN_SPIKE, {
    type: DisasterType.OXYGEN_SPIKE,
    name: '산소 급증',
    description: '대기 중 산소가 급증하여 거대 생물이 유리해집니다',
    icon: '💨',
    isGlobal: true,
    minIntensity: 0.3,
    maxIntensity: 0.6,
    minDuration: 45000,  // 45초
    maxDuration: 120000,  // 2분
    cooldown: 200000,  // 3분 20초
    rarity: 0.18
  }],

  [DisasterType.OXYGEN_DEPLETION, {
    type: DisasterType.OXYGEN_DEPLETION,
    name: '산소 고갈',
    description: '대기 중 산소가 급감하여 호흡이 어려워집니다',
    icon: '😮‍💨',
    isGlobal: true,
    minIntensity: 0.4,
    maxIntensity: 0.8,
    minDuration: 30000,  // 30초
    maxDuration: 90000,  // 1.5분
    cooldown: 180000,  // 3분
    rarity: 0.15
  }],

  // 우주 재앙
  [DisasterType.SOLAR_FLARE, {
    type: DisasterType.SOLAR_FLARE,
    name: '태양 폭발',
    description: '태양의 강력한 방사선이 지구에 도달합니다',
    icon: '☀️',
    isGlobal: true,
    minIntensity: 0.5,
    maxIntensity: 0.9,
    minDuration: 10000,  // 10초
    maxDuration: 30000,  // 30초
    cooldown: 150000,  // 2.5분
    rarity: 0.15
  }]
]);

/**
 * 재앙별 기본 효과 정의
 * 각 재앙이 환경에 미치는 영향을 사전 정의합니다
 * 실제 효과는 intensity에 따라 스케일링됩니다
 */
export const DISASTER_BASE_EFFECTS: Map<DisasterType, DisasterEffect[]> = new Map([
  [DisasterType.METEOR_IMPACT, [
    { type: 'mortality', value: 0.8, operation: 'add' },  // 80% 사망률 증가
    { type: 'temperature', value: 50, operation: 'add' },  // 온도 급상승
    { type: 'food', value: 0.3, operation: 'multiply' }  // 식량 70% 감소
  ]],

  [DisasterType.VOLCANIC_ERUPTION, [
    { type: 'mortality', value: 0.5, operation: 'add' },
    { type: 'temperature', value: 30, operation: 'add' },
    { type: 'food', value: 0.4, operation: 'multiply' }
  ]],

  [DisasterType.EARTHQUAKE, [
    { type: 'mortality', value: 0.3, operation: 'add' },
    { type: 'movement', value: 0.5, operation: 'multiply' }  // 이동속도 50% 감소
  ]],

  [DisasterType.TSUNAMI, [
    { type: 'mortality', value: 0.9, operation: 'add' },
    { type: 'movement', value: 0.2, operation: 'multiply' }
  ]],

  [DisasterType.ICE_AGE, [
    { type: 'temperature', value: -40, operation: 'add' },
    { type: 'food', value: 0.5, operation: 'multiply' },
    { type: 'mortality', value: 0.2, operation: 'add' }
  ]],

  [DisasterType.GLOBAL_WARMING, [
    { type: 'temperature', value: 35, operation: 'add' },
    { type: 'food', value: 0.7, operation: 'multiply' },
    { type: 'mortality', value: 0.15, operation: 'add' }
  ]],

  [DisasterType.DROUGHT, [
    { type: 'food', value: 0.2, operation: 'multiply' },  // 식량 80% 감소
    { type: 'mortality', value: 0.4, operation: 'add' }
  ]],

  [DisasterType.MEGA_FLOOD, [
    { type: 'temperature', value: -15, operation: 'add' },
    { type: 'food', value: 0.5, operation: 'multiply' },
    { type: 'movement', value: 0.6, operation: 'multiply' },
    { type: 'mortality', value: 0.25, operation: 'add' }
  ]],

  [DisasterType.PANDEMIC, [
    { type: 'mortality', value: 0.7, operation: 'add' }
  ]],

  [DisasterType.OXYGEN_SPIKE, [
    { type: 'mutation', value: 1.5, operation: 'multiply' },  // 돌연변이율 50% 증가
    { type: 'food', value: 1.2, operation: 'multiply' }  // 식량 20% 증가 (식물 성장)
  ]],

  [DisasterType.OXYGEN_DEPLETION, [
    { type: 'mortality', value: 0.5, operation: 'add' },
    { type: 'movement', value: 0.7, operation: 'multiply' }
  ]],

  [DisasterType.SOLAR_FLARE, [
    { type: 'mutation', value: 3.0, operation: 'multiply' },  // 돌연변이율 3배
    { type: 'mortality', value: 0.3, operation: 'add' }
  ]]
]);
