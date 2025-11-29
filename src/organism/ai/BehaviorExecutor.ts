/**
 * 행동 실행기 (BehaviorExecutor)
 *
 * 기능:
 * - 신경망 출력을 실제 행동으로 변환
 * - 행동 우선순위 처리
 * - 에너지 비용 계산
 * - 행동 실행 결과 반환
 */

import { BehaviorDecision, BrainOutput, SensoryData, Position } from './types';

export interface BehaviorResult {
  action: keyof typeof BrainOutput;
  success: boolean;
  energyCost: number;
  movement?: {
    direction: { x: number; y: number };
    speed: number;
  };
  targetId?: string;
  message?: string;
}

export class BehaviorExecutor {
  private readonly energyCosts = {
    MOVE_DIRECTION: 0.1,
    MOVE_SPEED: 0.2,
    ATTACK: 0.5,
    FLEE: 0.3,
    EAT: 0.1,
    COURT: 0.2,
    REPRODUCE: 1.0,
    REST: -0.1, // 에너지 회복
  };

  /**
   * 신경망 출력을 행동으로 변환
   */
  public decideAction(
    neuralOutput: Float32Array,
    sensoryData: SensoryData,
    currentEnergy: number
  ): BehaviorDecision {
    // 출력값이 가장 높은 행동 선택
    let maxValue = -Infinity;
    let primaryAction: keyof typeof BrainOutput = 'REST';

    const actionKeys = Object.keys(BrainOutput) as Array<keyof typeof BrainOutput>;

    for (const actionKey of actionKeys) {
      const index = BrainOutput[actionKey];
      const value = neuralOutput[index] ?? 0;

      if (value > maxValue) {
        maxValue = value;
        primaryAction = actionKey;
      }
    }

    // 에너지 부족 시 강제로 휴식 또는 먹기
    if (currentEnergy < 20) {
      if (sensoryData.visual.food.length > 0) {
        primaryAction = 'EAT';
        maxValue = 1.0;
      } else {
        primaryAction = 'REST';
        maxValue = 1.0;
      }
    }

    // 행동 결정
    const decision: BehaviorDecision = {
      primaryAction,
      actionStrength: maxValue,
      energyCost: this.energyCosts[primaryAction],
    };

    // 타겟 설정
    switch (primaryAction) {
      case 'EAT': {
        const nearestFood = sensoryData.visual.food[0];
        if (nearestFood) {
          decision.targetPosition = nearestFood.position;
          decision.targetId = nearestFood.id;
        }
        break;
      }

      case 'FLEE': {
        const predator = sensoryData.visual.predators[0];
        if (predator) {
          // 포식자 반대 방향으로 도망
          decision.targetPosition = this.getOppositeDirection(predator.position);
        }
        break;
      }

      case 'ATTACK': {
        const target = sensoryData.visual.predators[0];
        if (target) {
          decision.targetPosition = target.position;
          decision.targetId = target.id;
        }
        break;
      }

      case 'COURT':
      case 'REPRODUCE': {
        const mate = sensoryData.visual.potentialMates[0];
        if (mate) {
          decision.targetPosition = mate.position;
          decision.targetId = mate.id;
        }
        break;
      }

      case 'MOVE_DIRECTION':
      case 'MOVE_SPEED':
        // 탐색 이동 (랜덤 방향)
        decision.targetPosition = this.getRandomDirection();
        break;
    }

    return decision;
  }

  /**
   * 행동 실행
   */
  public executeAction(
    decision: BehaviorDecision,
    currentPosition: Position,
    currentEnergy: number
  ): BehaviorResult {
    const result: BehaviorResult = {
      action: decision.primaryAction,
      success: false,
      energyCost: decision.energyCost,
    };

    // 에너지 부족 체크
    if (currentEnergy < decision.energyCost && decision.primaryAction !== 'REST') {
      result.message = '에너지 부족';
      return result;
    }

    switch (decision.primaryAction) {
      case 'MOVE_DIRECTION':
      case 'MOVE_SPEED':
        result.movement = this.calculateMovement(decision, currentPosition);
        result.success = true;
        break;

      case 'EAT':
        if (decision.targetId) {
          result.targetId = decision.targetId;
          result.success = true;
          result.message = '먹이 섭취 시도';
        }
        break;

      case 'FLEE':
        result.movement = this.calculateFleeMovement(decision, currentPosition);
        result.success = true;
        break;

      case 'ATTACK':
        if (decision.targetId) {
          result.targetId = decision.targetId;
          result.success = true;
          result.message = '공격 시도';
        }
        break;

      case 'COURT':
        if (decision.targetId) {
          result.targetId = decision.targetId;
          result.success = true;
          result.message = '구애 시도';
        }
        break;

      case 'REPRODUCE':
        if (decision.targetId) {
          result.targetId = decision.targetId;
          result.success = true;
          result.message = '번식 시도';
        }
        break;

      case 'REST':
        result.success = true;
        result.message = '휴식 중 (에너지 회복)';
        break;
    }

    return result;
  }

  /**
   * 이동 계산
   */
  private calculateMovement(
    decision: BehaviorDecision,
    currentPosition: Position
  ): BehaviorResult['movement'] {
    if (!decision.targetPosition) {
      return {
        direction: { x: 0, y: 0 },
        speed: 0,
      };
    }

    // 타겟 방향 계산
    const dx = decision.targetPosition.x - currentPosition.x;
    const dy = decision.targetPosition.y - currentPosition.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude === 0) {
      return {
        direction: { x: 0, y: 0 },
        speed: 0,
      };
    }

    return {
      direction: {
        x: dx / magnitude,
        y: dy / magnitude,
      },
      speed: decision.actionStrength, // 0-1
    };
  }

  /**
   * 도망 이동 계산 (타겟 반대 방향)
   */
  private calculateFleeMovement(
    decision: BehaviorDecision,
    currentPosition: Position
  ): BehaviorResult['movement'] {
    if (!decision.targetPosition) {
      return {
        direction: { x: 0, y: 0 },
        speed: 0,
      };
    }

    // 반대 방향
    const dx = currentPosition.x - decision.targetPosition.x;
    const dy = currentPosition.y - decision.targetPosition.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude === 0) {
      // 랜덤 방향으로 도망
      const angle = Math.random() * Math.PI * 2;
      return {
        direction: {
          x: Math.cos(angle),
          y: Math.sin(angle),
        },
        speed: 1.0, // 최대 속도
      };
    }

    return {
      direction: {
        x: dx / magnitude,
        y: dy / magnitude,
      },
      speed: 1.0, // 최대 속도로 도망
    };
  }

  /**
   * 반대 방향 위치 계산
   */
  private getOppositeDirection(dangerPosition: Position): Position {
    // 임시로 반대 방향 반환 (실제로는 현재 위치 필요)
    return {
      x: -dangerPosition.x,
      y: -dangerPosition.y,
    };
  }

  /**
   * 랜덤 방향 생성
   */
  private getRandomDirection(): Position {
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 50; // 50-100 거리
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }

  /**
   * 행동 우선순위 계산
   */
  public getPriority(action: keyof typeof BrainOutput): number {
    const priorities: Record<keyof typeof BrainOutput, number> = {
      FLEE: 10,        // 도망 최우선
      ATTACK: 9,       // 공격
      EAT: 8,          // 먹기
      REST: 7,         // 휴식
      REPRODUCE: 6,    // 번식
      COURT: 5,        // 구애
      MOVE_SPEED: 3,   // 이동
      MOVE_DIRECTION: 2,
    };

    return priorities[action] || 1;
  }

  /**
   * 에너지 비용 조회
   */
  public getEnergyCost(action: keyof typeof BrainOutput): number {
    return this.energyCosts[action] || 0;
  }
}
