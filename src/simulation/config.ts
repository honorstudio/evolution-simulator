/**
 * 시뮬레이션 설정
 *
 * 게임의 전반적인 규칙과 초기값을 정의합니다.
 */

export interface SimulationConfig {
  // 월드 크기
  worldWidth: number;
  worldHeight: number;

  // 초기 개체 수
  initialOrganisms: number;
  initialFood: number;

  // 생성 규칙
  foodSpawnRate: number; // 틱당 음식 생성 확률 (0.0 ~ 1.0)

  // 진화 규칙
  mutationRate: number; // 돌연변이 확률 (0.0 ~ 1.0)

  // 에너지 규칙
  energyCostPerTick: number; // 틱당 기본 에너지 소모량
  reproductionEnergyCost: number; // 번식에 필요한 에너지
}

/**
 * 기본 설정값
 *
 * 균형잡힌 게임플레이를 위한 초기값입니다.
 * 약 50마리로 시작해서 자연스럽게 증가/감소하도록 조정되었습니다.
 */
export const DEFAULT_CONFIG: SimulationConfig = {
  worldWidth: 8000,  // 대륙 규모 (WORLD_CONFIG와 동일)
  worldHeight: 6000, // 대륙 규모 (WORLD_CONFIG와 동일)
  initialOrganisms: 50,
  initialFood: 200,
  foodSpawnRate: 0.1, // 10% 확률로 음식 생성
  mutationRate: 0.05, // 5% 돌연변이 확률
  energyCostPerTick: 0.1, // 매우 작은 에너지 소모
  reproductionEnergyCost: 30, // 번식에 큰 에너지 필요
};

/**
 * 빠른 진화 설정
 *
 * 테스트나 데모용으로 빠르게 진화를 관찰하고 싶을 때 사용합니다.
 */
export const FAST_EVOLUTION_CONFIG: SimulationConfig = {
  ...DEFAULT_CONFIG,
  mutationRate: 0.2, // 20% 돌연변이 - 빠른 진화
  foodSpawnRate: 0.3, // 음식 풍부 - 빠른 성장
  reproductionEnergyCost: 20, // 번식 쉬움
};

/**
 * 생존 난이도 높은 설정
 *
 * 강한 개체만 살아남는 하드코어 모드입니다.
 */
export const HARDCORE_CONFIG: SimulationConfig = {
  ...DEFAULT_CONFIG,
  foodSpawnRate: 0.05, // 음식 부족
  energyCostPerTick: 0.2, // 에너지 빨리 소모
  reproductionEnergyCost: 50, // 번식 어려움
};
