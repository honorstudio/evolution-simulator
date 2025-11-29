/**
 * AI 컨트롤러 (AIController)
 *
 * 기능:
 * - 모든 AI 시스템 통합 관리
 * - 감각 → 신경망 → 행동 파이프라인
 * - 기억 시스템 연동
 * - 생명체와의 인터페이스
 */

import { AdvancedBrain } from './AdvancedBrain';
import { MemorySystem } from './Memory';
import { SensorySystem, WorldContext } from './SensorySystem';
import { BehaviorExecutor, BehaviorResult } from './BehaviorExecutor';
import { Position, AdvancedBrainConfig } from './types';

export interface AIControllerConfig {
  brainConfig: AdvancedBrainConfig;
  senseRange: number;
  birthPosition: Position;
}

export class AIController {
  private brain: AdvancedBrain;
  private memory: MemorySystem;
  private sensorySystem: SensorySystem;
  private behaviorExecutor: BehaviorExecutor;

  constructor(config: AIControllerConfig, existingBrain?: AdvancedBrain) {
    this.brain = existingBrain || new AdvancedBrain(config.brainConfig);
    this.memory = new MemorySystem(config.birthPosition);
    this.sensorySystem = new SensorySystem(config.senseRange);
    this.behaviorExecutor = new BehaviorExecutor();
  }

  /**
   * 메인 AI 업데이트 (매 프레임 호출)
   */
  public update(
    selfId: string,
    selfPosition: Position,
    world: WorldContext,
    internalState: {
      energy: number;
      maxEnergy: number;
      health: number;
      reproductionReady: boolean;
      age: number;
      maxAge: number;
    },
    currentTime: number
  ): BehaviorResult {
    // 1. 감각 정보 수집
    const sensoryData = this.sensorySystem.gatherSensoryData(
      selfPosition,
      selfId,
      world,
      internalState
    );

    // 2. 기억 업데이트
    this.updateMemory(sensoryData, currentTime);

    // 3. 신경망 입력 생성
    const neuralInput = this.sensorySystem.sensoryDataToNeuralInput(sensoryData);

    // 4. 신경망 추론
    const neuralOutput = this.brain.forward(neuralInput);

    // 5. 행동 결정
    const decision = this.behaviorExecutor.decideAction(
      neuralOutput,
      sensoryData,
      internalState.energy
    );

    // 6. 행동 실행
    const result = this.behaviorExecutor.executeAction(
      decision,
      selfPosition,
      internalState.energy
    );

    return result;
  }

  /**
   * 기억 업데이트
   */
  private updateMemory(sensoryData: any, currentTime: number): void {
    // 먹이 위치 기억
    for (const food of sensoryData.visual.food) {
      this.memory.rememberFood(food.position);
    }

    // 위험 위치 기억
    for (const predator of sensoryData.visual.predators) {
      this.memory.rememberDanger(predator.position);
    }

    // 짝 ID 기억
    for (const mate of sensoryData.visual.potentialMates) {
      this.memory.rememberMate(mate.id);
    }

    this.memory.update(currentTime);
  }

  /**
   * 영역 설정
   */
  public establishTerritory(position: Position, radius: number): void {
    this.memory.establishTerritory(position, radius);
  }

  /**
   * 뇌 조회
   */
  public getBrain(): AdvancedBrain {
    return this.brain;
  }

  /**
   * 기억 조회
   */
  public getMemory(): MemorySystem {
    return this.memory;
  }

  /**
   * 감각 범위 조정
   */
  public setSenseRange(range: number): void {
    this.sensorySystem.setSenseRange(range);
  }

  /**
   * 번식 시 자식 AI 생성
   */
  public reproduce(partnerController: AIController, birthPosition: Position): AIController {
    // 부모 뇌 교배
    const childBrain = AdvancedBrain.crossover(this.brain, partnerController.brain);

    // 돌연변이 적용 (작은 확률)
    const mutationRate = 0.05; // 5%
    const mutationStrength = 0.1; // 10%
    childBrain.mutate(mutationRate, mutationStrength);

    // 자식 AI 생성
    const childConfig: AIControllerConfig = {
      brainConfig: this.brain.getConfig(),
      senseRange: this.sensorySystem['senseRange'], // private 필드 접근
      birthPosition,
    };

    const childController = new AIController(childConfig, childBrain);

    // 부모의 장기 기억 일부 상속
    const parentMemory = this.memory.clone();
    childController.memory = parentMemory;

    return childController;
  }

  /**
   * AI 복제 (무성 번식)
   */
  public clone(birthPosition: Position): AIController {
    const clonedWeights = this.brain.cloneWeights();
    const clonedBrain = new AdvancedBrain(
      this.brain.getConfig(),
      clonedWeights.weights,
      clonedWeights.biases
    );

    // 돌연변이 적용
    const mutationRate = 0.1; // 10%
    const mutationStrength = 0.15; // 15%
    clonedBrain.mutate(mutationRate, mutationStrength);

    const cloneConfig: AIControllerConfig = {
      brainConfig: this.brain.getConfig(),
      senseRange: this.sensorySystem['senseRange'],
      birthPosition,
    };

    return new AIController(cloneConfig, clonedBrain);
  }

  /**
   * 직렬화 (저장)
   */
  public serialize(): string {
    return JSON.stringify({
      brain: this.brain.serialize(),
      memory: this.memory.serialize(),
      senseRange: this.sensorySystem['senseRange'],
    });
  }

  /**
   * 역직렬화 (불러오기)
   */
  public static deserialize(data: string): AIController {
    const parsed = JSON.parse(data);
    const brain = AdvancedBrain.deserialize(parsed.brain);
    const memory = MemorySystem.deserialize(parsed.memory);

    const controller = new AIController(
      {
        brainConfig: brain.getConfig(),
        senseRange: parsed.senseRange,
        birthPosition: memory.getMemory().longTerm.birthPlace,
      },
      brain
    );

    controller.memory = memory;
    return controller;
  }

  /**
   * AI 성능 통계
   */
  public getStats(): {
    brainLayers: number;
    memoryCount: {
      shortTermFood: number;
      shortTermDanger: number;
      longTermFood: number;
      longTermDanger: number;
    };
    hasTerritory: boolean;
  } {
    const mem = this.memory.getMemory();
    return {
      brainLayers: this.brain.getConfig().hiddenLayers,
      memoryCount: {
        shortTermFood: mem.shortTerm.recentFood.length,
        shortTermDanger: mem.shortTerm.recentDanger.length,
        longTermFood: mem.longTerm.foodSources.length,
        longTermDanger: mem.longTerm.dangerZones.length,
      },
      hasTerritory: mem.longTerm.homeTerritory !== null,
    };
  }
}
