/**
 * 감각 시스템 (SensorySystem)
 *
 * 기능:
 * - 시각: 주변 개체 감지 (먹이, 포식자, 동료, 짝)
 * - 청각: 위협 소리, 사회적 소리 감지
 * - 후각: 먹이 냄새, 위험 냄새 감지
 * - 내부 상태: 에너지, 체력, 번식욕, 나이
 */

import { SensoryData, DetectedEntity, Position, SensoryInput } from './types';

export interface OrganismData {
  id: string;
  position: Position;
  isAlive: boolean;
  energy: number;
  species?: string;
  reproductionReady?: boolean;
  isPredator?: boolean;
}

export interface FoodData {
  id: string;
  position: Position;
  nutritionValue: number;
}

export interface WorldContext {
  organisms: OrganismData[];
  foods: FoodData[];
  dangerLevel: number; // 0-1 (환경적 위험도)
}

export class SensorySystem {
  private senseRange: number;
  private hearingRange: number;
  private smellRange: number;

  constructor(senseRange: number = 100) {
    this.senseRange = senseRange;
    this.hearingRange = senseRange * 1.5; // 청각은 시각보다 넓음
    this.smellRange = senseRange * 2; // 후각은 더 넓음
  }

  /**
   * 모든 감각 정보 수집
   */
  public gatherSensoryData(
    selfPosition: Position,
    selfId: string,
    world: WorldContext,
    internalState: {
      energy: number;
      maxEnergy: number;
      health: number;
      reproductionReady: boolean;
      age: number;
      maxAge: number;
    }
  ): SensoryData {
    return {
      visual: this.gatherVisualInput(selfPosition, selfId, world),
      auditory: this.gatherAuditoryInput(selfPosition, selfId, world),
      olfactory: this.gatherOlfactoryInput(selfPosition, world),
      internal: this.gatherInternalState(internalState),
    };
  }

  /**
   * 시각 정보 수집
   */
  private gatherVisualInput(
    selfPosition: Position,
    selfId: string,
    world: WorldContext
  ): SensoryData['visual'] {
    const food: DetectedEntity[] = [];
    const predators: DetectedEntity[] = [];
    const peers: DetectedEntity[] = [];
    const potentialMates: DetectedEntity[] = [];

    // 먹이 감지
    for (const foodItem of world.foods) {
      const distance = this.getDistance(selfPosition, foodItem.position);
      if (distance <= this.senseRange) {
        food.push({
          id: foodItem.id,
          position: foodItem.position,
          distance,
          type: 'food',
          strength: foodItem.nutritionValue,
        });
      }
    }

    // 다른 생명체 감지
    for (const organism of world.organisms) {
      if (organism.id === selfId || !organism.isAlive) continue;

      const distance = this.getDistance(selfPosition, organism.position);
      if (distance <= this.senseRange) {
        // 포식자 감지
        if (organism.isPredator) {
          predators.push({
            id: organism.id,
            position: organism.position,
            distance,
            type: 'predator',
            strength: 1.0, // 위협도
          });
        }
        // 짝 감지
        else if (organism.reproductionReady) {
          potentialMates.push({
            id: organism.id,
            position: organism.position,
            distance,
            type: 'mate',
            strength: organism.energy / 100, // 에너지가 높을수록 매력적
          });
        }
        // 동료 감지
        else {
          peers.push({
            id: organism.id,
            position: organism.position,
            distance,
            type: 'organism',
          });
        }
      }
    }

    // 가까운 순으로 정렬
    food.sort((a, b) => a.distance - b.distance);
    predators.sort((a, b) => a.distance - b.distance);
    peers.sort((a, b) => a.distance - b.distance);
    potentialMates.sort((a, b) => a.distance - b.distance);

    return {
      food: food.slice(0, 5), // 최대 5개만
      predators: predators.slice(0, 3),
      peers: peers.slice(0, 5),
      potentialMates: potentialMates.slice(0, 3),
    };
  }

  /**
   * 청각 정보 수집
   */
  private gatherAuditoryInput(
    selfPosition: Position,
    selfId: string,
    world: WorldContext
  ): SensoryData['auditory'] {
    let threatLevel = 0;
    let socialLevel = 0;
    let threatCount = 0;
    let socialCount = 0;

    for (const organism of world.organisms) {
      if (organism.id === selfId || !organism.isAlive) continue;

      const distance = this.getDistance(selfPosition, organism.position);
      if (distance <= this.hearingRange) {
        const intensity = 1 - distance / this.hearingRange; // 거리에 따른 강도

        if (organism.isPredator) {
          threatLevel += intensity;
          threatCount++;
        } else {
          socialLevel += intensity;
          socialCount++;
        }
      }
    }

    // 환경적 위험도 추가
    threatLevel += world.dangerLevel;

    return {
      threatLevel: Math.min(1, threatCount > 0 ? threatLevel / threatCount : world.dangerLevel),
      socialLevel: Math.min(1, socialCount > 0 ? socialLevel / socialCount : 0),
    };
  }

  /**
   * 후각 정보 수집
   */
  private gatherOlfactoryInput(
    selfPosition: Position,
    world: WorldContext
  ): SensoryData['olfactory'] {
    let foodScent = 0;
    let dangerScent = 0;

    // 먹이 냄새
    for (const foodItem of world.foods) {
      const distance = this.getDistance(selfPosition, foodItem.position);
      if (distance <= this.smellRange) {
        const intensity = 1 - distance / this.smellRange;
        foodScent += intensity * (foodItem.nutritionValue / 10);
      }
    }

    // 위험 냄새 (포식자)
    for (const organism of world.organisms) {
      if (!organism.isAlive) continue;

      const distance = this.getDistance(selfPosition, organism.position);
      if (distance <= this.smellRange && organism.isPredator) {
        const intensity = 1 - distance / this.smellRange;
        dangerScent += intensity;
      }
    }

    // 환경적 위험
    dangerScent += world.dangerLevel * 0.5;

    return {
      foodScent: Math.min(1, foodScent),
      dangerScent: Math.min(1, dangerScent),
    };
  }

  /**
   * 내부 상태 수집
   */
  private gatherInternalState(state: {
    energy: number;
    maxEnergy: number;
    health: number;
    reproductionReady: boolean;
    age: number;
    maxAge: number;
  }): SensoryData['internal'] {
    return {
      energy: state.energy / state.maxEnergy,
      health: state.health / 100,
      reproductionUrge: state.reproductionReady ? 1 : 0,
      age: state.age / state.maxAge,
    };
  }

  /**
   * 감각 데이터를 신경망 입력으로 변환
   */
  public sensoryDataToNeuralInput(data: SensoryData): Float32Array {
    const input = new Float32Array(12);

    // 시각 (0-3)
    const nearestFood = data.visual.food[0];
    input[SensoryInput.VISION_FOOD] = nearestFood
      ? 1 - (nearestFood.distance / this.senseRange)
      : 0;

    const nearestPredator = data.visual.predators[0];
    input[SensoryInput.VISION_PREDATOR] = nearestPredator
      ? 1 - (nearestPredator.distance / this.senseRange)
      : 0;

    const nearestPeer = data.visual.peers[0];
    input[SensoryInput.VISION_PEER] = nearestPeer
      ? 1 - (nearestPeer.distance / this.senseRange)
      : 0;

    const nearestMate = data.visual.potentialMates[0];
    input[SensoryInput.VISION_MATE] = nearestMate
      ? 1 - (nearestMate.distance / this.senseRange)
      : 0;

    // 청각 (4-5)
    input[SensoryInput.AUDIO_THREAT] = data.auditory.threatLevel;
    input[SensoryInput.AUDIO_SOCIAL] = data.auditory.socialLevel;

    // 후각 (6-7)
    input[SensoryInput.SMELL_FOOD] = data.olfactory.foodScent;
    input[SensoryInput.SMELL_DANGER] = data.olfactory.dangerScent;

    // 내부 상태 (8-11)
    input[SensoryInput.INTERNAL_ENERGY] = data.internal.energy;
    input[SensoryInput.INTERNAL_HEALTH] = data.internal.health;
    input[SensoryInput.INTERNAL_REPRODUCTION] = data.internal.reproductionUrge;
    input[SensoryInput.INTERNAL_AGE] = data.internal.age;

    return input;
  }

  /**
   * 감각 범위 조정
   */
  public setSenseRange(range: number): void {
    this.senseRange = range;
    this.hearingRange = range * 1.5;
    this.smellRange = range * 2;
  }

  /**
   * 거리 계산
   */
  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
