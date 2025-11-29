/**
 * 동물 시스템
 *
 * 이동, 감각, 포식, 도망 등 동물 특화 로직을 처리합니다.
 */

import type {
  AnimalTraits,
  LocomotionType,
  DietType,
  PredationResult,
} from './types';

/**
 * 이동 에너지 소비 계산
 *
 * @description
 * 이동 방식과 속도에 따라 에너지 소비량이 달라집니다.
 * - 걷기: 기본
 * - 수영: 1.5배
 * - 날기: 3배
 * - 기어가기: 0.5배
 *
 * @param traits - 동물 특성
 * @param speed - 현재 이동 속도 (0-1, 최대 속도 대비 비율)
 * @param deltaTime - 시간 델타 (초)
 * @returns 소비된 에너지
 */
export function calculateMovementCost(
  traits: AnimalTraits,
  speed: number,
  deltaTime: number
): number {
  // 이동 방식별 기본 에너지 계수
  const locomotionCost = getLocomotionCost(traits.locomotion);

  // 속도가 빠를수록 제곱으로 증가 (공기저항/물저항)
  const speedFactor = speed * speed;

  // 지구력이 좋을수록 에너지 효율적
  const staminaFactor = 1 - traits.stamina * 0.3;

  const energyCost =
    locomotionCost *
    speedFactor *
    staminaFactor *
    traits.speed *
    deltaTime *
    0.1;

  return energyCost;
}

/**
 * 이동 방식별 에너지 계수
 */
function getLocomotionCost(locomotion: LocomotionType): number {
  switch (locomotion) {
    case 'walk':
      return 1.0;
    case 'swim':
      return 1.5;
    case 'fly':
      return 3.0;
    case 'crawl':
      return 0.5;
    case 'sessile':
      return 0.0;
    default:
      return 1.0;
  }
}

/**
 * 감각 시스템 - 주변 환경 감지
 *
 * @description
 * 시각, 청각, 후각을 통해 주변 객체를 감지합니다.
 * 거리와 감각 범위에 따라 감지 여부가 결정됩니다.
 *
 * @param traits - 동물 특성
 * @param position - 자신의 위치 {x, y}
 * @param targetPosition - 대상의 위치 {x, y}
 * @param targetType - 대상 타입
 * @returns 감지 여부 및 정보
 */
export function detectObject(
  traits: AnimalTraits,
  position: { x: number; y: number },
  targetPosition: { x: number; y: number },
  targetType: 'food' | 'predator' | 'prey' | 'mate' | 'obstacle'
): { detected: boolean; distance: number; angle: number } | null {
  // 거리 계산
  const dx = targetPosition.x - position.x;
  const dy = targetPosition.y - position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 각도 계산 (라디안)
  const angle = Math.atan2(dy, dx);

  // 시각 감지 체크
  const visibleByVision =
    distance <= traits.visionRange &&
    isWithinViewAngle(angle, traits.visionAngle);

  // 청각 감지 체크
  const audibleByHearing = distance <= traits.hearingRange;

  // 후각 감지 체크 (먹이와 포식자에만 적용)
  const smellableByOlfaction =
    (targetType === 'food' || targetType === 'predator') &&
    distance <= traits.smellRange;

  const detected =
    visibleByVision || audibleByHearing || smellableByOlfaction;

  if (!detected) {
    return null;
  }

  return { detected: true, distance, angle };
}

/**
 * 시야각 내에 있는지 확인
 */
function isWithinViewAngle(targetAngle: number, viewAngle: number): boolean {
  // 정면(0도)을 기준으로 viewAngle/2 범위 내에 있는지 체크
  const halfAngle = (viewAngle * Math.PI) / 360; // 라디안으로 변환
  const normalizedAngle = ((targetAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return normalizedAngle <= halfAngle || normalizedAngle >= 2 * Math.PI - halfAngle;
}

/**
 * 포식 시도
 *
 * @description
 * 포식자가 먹이를 공격합니다.
 * 공격력, 방어력, 독성 등이 결과에 영향을 줍니다.
 *
 * @param predator - 포식자 특성
 * @param prey - 피식자 특성
 * @param predatorEnergy - 포식자의 현재 에너지
 * @param preyEnergy - 피식자의 현재 에너지
 * @returns 포식 결과
 */
export function attemptPredation(
  predator: AnimalTraits,
  prey: AnimalTraits,
  predatorEnergy: number,
  preyEnergy: number
): PredationResult {
  // 포식자의 공격 성공 확률 계산
  const attackSuccess = calculateAttackSuccess(
    predator,
    prey,
    predatorEnergy
  );

  const success = Math.random() < attackSuccess;

  if (!success) {
    // 공격 실패: 에너지만 소비
    return {
      success: false,
      energyGained: 0,
      damageToAttacker: 0,
      damageToDefender: 0,
    };
  }

  // 공격 성공: 피해 계산
  const damageToDefender = calculateDamage(predator, prey);

  // 반격 피해 (방어력과 독성에 따라)
  const damageToAttacker = prey.defense * 0.3 + prey.venom * 20;

  // 획득 에너지 (피식자의 에너지 × 소화 효율)
  const energyGained = preyEnergy * predator.digestiveEfficiency;

  return {
    success: true,
    energyGained,
    damageToAttacker,
    damageToDefender,
  };
}

/**
 * 공격 성공 확률 계산
 */
function calculateAttackSuccess(
  predator: AnimalTraits,
  prey: AnimalTraits,
  predatorEnergy: number
): number {
  // 기본 성공률
  let successChance = 0.5;

  // 공격력 vs 방어력
  const powerDiff = predator.attackPower - prey.defense;
  successChance += powerDiff * 0.005; // ±50% 범위

  // 속도 차이 (빠를수록 유리)
  const speedDiff = predator.speed - prey.speed;
  successChance += speedDiff * 0.001;

  // 포식자의 에너지 상태 (낮으면 불리)
  if (predatorEnergy < 30) {
    successChance -= 0.2;
  }

  // 피식자의 위장 능력
  successChance -= prey.camouflage * 0.3;

  return Math.max(0.1, Math.min(0.9, successChance));
}

/**
 * 피해량 계산
 */
function calculateDamage(attacker: AnimalTraits, defender: AnimalTraits): number {
  const baseDamage = attacker.attackPower;
  const defense = defender.defense;
  const venomDamage = attacker.venom * 10;

  // 방어력으로 피해 감소 (최소 20%는 관통)
  const damageReduction = Math.min(0.8, defense / 100);
  const physicalDamage = baseDamage * (1 - damageReduction);

  return physicalDamage + venomDamage;
}

/**
 * 식성에 따른 먹이 판별
 *
 * @description
 * 동물의 식성에 따라 특정 대상이 먹이인지 판별합니다.
 *
 * @param diet - 식성
 * @param targetType - 대상 타입
 * @returns 먹이 여부
 */
export function isValidFood(
  diet: DietType,
  targetType: 'plant' | 'animal'
): boolean {
  switch (diet) {
    case 'herbivore':
      return targetType === 'plant';
    case 'carnivore':
      return targetType === 'animal';
    case 'omnivore':
      return true;
    case 'photosynthesis':
      return false; // 식물은 동물을 먹지 않음
    case 'detritivore':
      return false; // 부식질만 먹음 (별도 처리 필요)
    default:
      return false;
  }
}

/**
 * 도망 행동 계산
 *
 * @description
 * 포식자로부터 도망가는 최적 방향을 계산합니다.
 *
 * @param position - 자신의 위치
 * @param predatorPosition - 포식자 위치
 * @returns 도망 방향 (라디안)
 */
export function calculateEscapeDirection(
  position: { x: number; y: number },
  predatorPosition: { x: number; y: number }
): number {
  const dx = position.x - predatorPosition.x;
  const dy = position.y - predatorPosition.y;

  // 포식자 반대 방향
  return Math.atan2(dy, dx);
}

/**
 * 추적 행동 계산
 *
 * @description
 * 먹이를 추적하는 방향을 계산합니다.
 *
 * @param position - 자신의 위치
 * @param targetPosition - 먹이 위치
 * @param targetVelocity - 먹이의 속도 벡터 (예측 사격)
 * @returns 추적 방향 (라디안)
 */
export function calculatePursuitDirection(
  position: { x: number; y: number },
  targetPosition: { x: number; y: number },
  targetVelocity?: { vx: number; vy: number }
): number {
  let targetX = targetPosition.x;
  let targetY = targetPosition.y;

  // 예측 사격: 목표물의 미래 위치 예측
  if (targetVelocity) {
    const distance = Math.sqrt(
      Math.pow(targetX - position.x, 2) + Math.pow(targetY - position.y, 2)
    );
    const timeToIntercept = distance / 100; // 대략적인 도달 시간

    targetX += targetVelocity.vx * timeToIntercept;
    targetY += targetVelocity.vy * timeToIntercept;
  }

  const dx = targetX - position.x;
  const dy = targetY - position.y;

  return Math.atan2(dy, dx);
}

/**
 * 휴식 필요 여부 판단
 *
 * @description
 * 지구력과 에너지 상태에 따라 휴식이 필요한지 판단합니다.
 *
 * @param traits - 동물 특성
 * @param currentEnergy - 현재 에너지
 * @param maxEnergy - 최대 에너지
 * @param exhaustionLevel - 피로도 (0-1)
 * @returns 휴식 필요 여부
 */
export function needsRest(
  traits: AnimalTraits,
  currentEnergy: number,
  maxEnergy: number,
  exhaustionLevel: number
): boolean {
  // 에너지가 30% 이하
  if (currentEnergy < maxEnergy * 0.3) {
    return true;
  }

  // 피로도가 높고 지구력이 낮음
  if (exhaustionLevel > 0.7 && traits.stamina < 0.5) {
    return true;
  }

  return false;
}

/**
 * 기본 동물 특성 생성기
 *
 * @description
 * 유전자로부터 동물 특성을 생성합니다.
 *
 * @param genes - 유전자 값 배열 (0-1 범위의 12개 이상)
 * @returns 동물 특성 객체
 */
export function createAnimalTraits(genes: number[]): AnimalTraits {
  return {
    type: 'animal',
    locomotion: selectLocomotion(genes[0] ?? 0.5),
    speed: 20 + (genes[1] ?? 0.5) * 80, // 20-100
    stamina: genes[2] ?? 0.5, // 0-1
    visionRange: 50 + (genes[3] ?? 0.5) * 150, // 50-200
    visionAngle: 60 + (genes[4] ?? 0.5) * 240, // 60-300도
    hearingRange: 30 + (genes[5] ?? 0.5) * 120, // 30-150
    smellRange: 40 + (genes[6] ?? 0.5) * 110, // 40-150
    diet: selectDiet(genes[7] ?? 0.5),
    digestiveEfficiency: 0.3 + (genes[8] ?? 0.5) * 0.6, // 0.3-0.9
    attackPower: (genes[9] ?? 0) * 100, // 0-100
    defense: (genes[10] ?? 0) * 100, // 0-100
    venom: genes[11] ?? 0, // 0-1
    camouflage: genes[12] ?? 0.5, // 0-1
  };
}

/**
 * 유전자 값에 따라 이동 방식 선택
 */
function selectLocomotion(geneValue: number): LocomotionType {
  if (geneValue < 0.25) return 'walk';
  if (geneValue < 0.5) return 'swim';
  if (geneValue < 0.75) return 'fly';
  return 'crawl';
}

/**
 * 유전자 값에 따라 식성 선택
 */
function selectDiet(geneValue: number): DietType {
  if (geneValue < 0.33) return 'herbivore';
  if (geneValue < 0.66) return 'carnivore';
  return 'omnivore';
}
