/**
 * AI 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import { AIController } from './AIController';
import { AdvancedBrain } from './AdvancedBrain';
import { MemorySystem } from './Memory';
import { SensorySystem } from './SensorySystem';
import { BehaviorExecutor } from './BehaviorExecutor';

describe('AdvancedBrain', () => {
  it('신경망 생성 및 순방향 전파', () => {
    const brain = new AdvancedBrain({
      inputSize: 12,
      hiddenSize: 16,
      outputSize: 8,
      hiddenLayers: 2,
    });

    const input = new Float32Array(12);
    for (let i = 0; i < 12; i++) {
      input[i] = Math.random();
    }

    const output = brain.forward(input);

    expect(output.length).toBe(8);
    // sigmoid 출력이므로 0-1 범위
    for (let i = 0; i < 8; i++) {
      expect(output[i]).toBeGreaterThanOrEqual(0);
      expect(output[i]).toBeLessThanOrEqual(1);
    }
  });

  it('돌연변이 적용', () => {
    const brain = new AdvancedBrain({
      inputSize: 12,
      hiddenSize: 16,
      outputSize: 8,
      hiddenLayers: 1,
    });

    const originalWeights = brain.cloneWeights();
    brain.mutate(1.0, 0.5); // 100% 확률로 변이

    const newWeights = brain.cloneWeights();

    // 가중치가 변경되었는지 확인
    let hasChanged = false;
    for (let i = 0; i < originalWeights.weights.length; i++) {
      for (let j = 0; j < originalWeights.weights[i].length; j++) {
        if (originalWeights.weights[i][j] !== newWeights.weights[i][j]) {
          hasChanged = true;
          break;
        }
      }
    }

    expect(hasChanged).toBe(true);
  });

  it('교배 (Crossover)', () => {
    const parent1 = new AdvancedBrain({
      inputSize: 12,
      hiddenSize: 16,
      outputSize: 8,
      hiddenLayers: 2,
    });

    const parent2 = new AdvancedBrain({
      inputSize: 12,
      hiddenSize: 16,
      outputSize: 8,
      hiddenLayers: 2,
    });

    const child = AdvancedBrain.crossover(parent1, parent2);

    const input = new Float32Array(12).fill(0.5);
    const output = child.forward(input);

    expect(output.length).toBe(8);
  });

  it('직렬화 및 역직렬화', () => {
    const brain = new AdvancedBrain({
      inputSize: 12,
      hiddenSize: 16,
      outputSize: 8,
      hiddenLayers: 2,
    });

    const input = new Float32Array(12).fill(0.5);
    const originalOutput = brain.forward(input);

    const serialized = brain.serialize();
    const deserialized = AdvancedBrain.deserialize(serialized);

    const deserializedOutput = deserialized.forward(input);

    // 같은 출력 확인
    for (let i = 0; i < 8; i++) {
      expect(deserializedOutput[i]).toBeCloseTo(originalOutput[i]);
    }
  });
});

describe('MemorySystem', () => {
  it('먹이 위치 기억', () => {
    const memory = new MemorySystem({ x: 0, y: 0 });

    memory.rememberFood({ x: 10, y: 10 });
    memory.rememberFood({ x: 20, y: 20 });

    const nearest = memory.getNearestRememberedFood({ x: 15, y: 15 });

    expect(nearest).not.toBeNull();
    expect(nearest?.x).toBeCloseTo(10, 0);
  });

  it('위험 지역 감지', () => {
    const memory = new MemorySystem({ x: 0, y: 0 });

    memory.rememberDanger({ x: 50, y: 50 });

    const isDangerous = memory.isDangerousArea({ x: 55, y: 55 });
    const isSafe = memory.isDangerousArea({ x: 100, y: 100 });

    expect(isDangerous).toBe(true);
    expect(isSafe).toBe(false);
  });

  it('집 영역 설정 및 귀환 판단', () => {
    const memory = new MemorySystem({ x: 0, y: 0 });

    memory.establishTerritory({ x: 100, y: 100 }, 50);

    // 반경 50의 1.5배 = 75를 벗어나야 귀환 필요
    // (200,200)에서 (100,100)까지 거리 = ~141 > 75 → 귀환 필요
    const shouldReturn1 = memory.shouldReturnHome({ x: 200, y: 200 });
    // (110,110)에서 (100,100)까지 거리 = ~14 < 75 → 귀환 불필요
    const shouldReturn2 = memory.shouldReturnHome({ x: 110, y: 110 });

    expect(shouldReturn1).toBe(true); // 멀리 떨어짐
    expect(shouldReturn2).toBe(false); // 영역 내
  });

  it('기억 복제 (번식)', () => {
    const memory = new MemorySystem({ x: 0, y: 0 });

    // 같은 위치 근처(거리 10 이내)에서 3번 이상 먹이를 발견해야 장기 기억으로 이동
    // 중복 체크는 거리 5 이내이므로 5~10 사이 거리로 호출하면 다른 위치로 저장되지만
    // 장기 기억 강화 시에는 거리 10 이내로 체크하므로 장기 기억에 추가됨
    memory.rememberFood({ x: 10, y: 10 });
    memory.rememberFood({ x: 16, y: 10 }); // 거리 6 (5 초과이므로 새로 저장, 10 이내이므로 강화)
    memory.rememberFood({ x: 10, y: 16 }); // 거리 6 (5 초과이므로 새로 저장, 10 이내이므로 강화)
    memory.establishTerritory({ x: 50, y: 50 }, 30);

    const cloned = memory.clone();
    const clonedMemory = cloned.getMemory();

    // 장기 기억만 상속 (3번 이상 본 먹이 위치)
    expect(clonedMemory.longTerm.foodSources.length).toBeGreaterThan(0);
    // 단기 기억은 초기화
    expect(clonedMemory.shortTerm.recentFood.length).toBe(0);
  });
});

describe('SensorySystem', () => {
  it('감각 데이터 수집', () => {
    const sensory = new SensorySystem(100);

    const sensoryData = sensory.gatherSensoryData(
      { x: 0, y: 0 },
      'self-id',
      {
        organisms: [
          {
            id: 'org-1',
            position: { x: 10, y: 10 },
            isAlive: true,
            energy: 50,
            reproductionReady: true,
          },
        ],
        foods: [
          {
            id: 'food-1',
            position: { x: 5, y: 5 },
            nutritionValue: 10,
          },
        ],
        dangerLevel: 0.3,
      },
      {
        energy: 50,
        maxEnergy: 100,
        health: 80,
        reproductionReady: false,
        age: 100,
        maxAge: 1000,
      }
    );

    expect(sensoryData.visual.food.length).toBe(1);
    expect(sensoryData.visual.potentialMates.length).toBe(1);
    expect(sensoryData.internal.energy).toBeCloseTo(0.5);
  });

  it('신경망 입력 변환', () => {
    const sensory = new SensorySystem(100);

    const sensoryData = sensory.gatherSensoryData(
      { x: 0, y: 0 },
      'self-id',
      {
        organisms: [],
        foods: [],
        dangerLevel: 0,
      },
      {
        energy: 75,
        maxEnergy: 100,
        health: 100,
        reproductionReady: true,
        age: 500,
        maxAge: 1000,
      }
    );

    const neuralInput = sensory.sensoryDataToNeuralInput(sensoryData);

    expect(neuralInput.length).toBe(12);
    expect(neuralInput[8]).toBeCloseTo(0.75); // 에너지
    expect(neuralInput[9]).toBeCloseTo(1.0); // 체력
    expect(neuralInput[10]).toBeCloseTo(1.0); // 번식 준비
    expect(neuralInput[11]).toBeCloseTo(0.5); // 나이
  });
});

describe('BehaviorExecutor', () => {
  it('행동 결정', () => {
    const executor = new BehaviorExecutor();

    const neuralOutput = new Float32Array([
      0.1, // MOVE_DIRECTION
      0.2, // MOVE_SPEED
      0.3, // ATTACK
      0.9, // FLEE (가장 높음)
      0.5, // EAT
      0.4, // COURT
      0.2, // REPRODUCE
      0.1, // REST
    ]);

    const decision = executor.decideAction(
      neuralOutput,
      {
        visual: { food: [], predators: [], peers: [], potentialMates: [] },
        auditory: { threatLevel: 0, socialLevel: 0 },
        olfactory: { foodScent: 0, dangerScent: 0 },
        internal: { energy: 0.5, health: 1, reproductionUrge: 0, age: 0.3 },
      },
      50
    );

    expect(decision.primaryAction).toBe('FLEE');
    expect(decision.actionStrength).toBeCloseTo(0.9);
  });

  it('에너지 부족 시 강제 휴식', () => {
    const executor = new BehaviorExecutor();

    const neuralOutput = new Float32Array(8).fill(0.5);

    const decision = executor.decideAction(
      neuralOutput,
      {
        visual: { food: [], predators: [], peers: [], potentialMates: [] },
        auditory: { threatLevel: 0, socialLevel: 0 },
        olfactory: { foodScent: 0, dangerScent: 0 },
        internal: { energy: 0.1, health: 1, reproductionUrge: 0, age: 0.3 },
      },
      10 // 에너지 부족
    );

    expect(decision.primaryAction).toBe('REST');
  });
});

describe('AIController', () => {
  it('AI 통합 업데이트', () => {
    const ai = new AIController({
      brainConfig: {
        inputSize: 12,
        hiddenSize: 16,
        outputSize: 8,
        hiddenLayers: 2,
      },
      senseRange: 100,
      birthPosition: { x: 0, y: 0 },
    });

    const result = ai.update(
      'self-id',
      { x: 50, y: 50 },
      {
        organisms: [],
        foods: [{ id: 'food-1', position: { x: 60, y: 60 }, nutritionValue: 10 }],
        dangerLevel: 0,
      },
      {
        energy: 50,
        maxEnergy: 100,
        health: 100,
        reproductionReady: false,
        age: 100,
        maxAge: 1000,
      },
      Date.now()
    );

    expect(result.action).toBeDefined();
    expect(result.energyCost).toBeGreaterThanOrEqual(0);
  });

  it('번식 (교배)', () => {
    const parent1 = new AIController({
      brainConfig: {
        inputSize: 12,
        hiddenSize: 16,
        outputSize: 8,
        hiddenLayers: 2,
      },
      senseRange: 100,
      birthPosition: { x: 0, y: 0 },
    });

    const parent2 = new AIController({
      brainConfig: {
        inputSize: 12,
        hiddenSize: 16,
        outputSize: 8,
        hiddenLayers: 2,
      },
      senseRange: 100,
      birthPosition: { x: 100, y: 100 },
    });

    const child = parent1.reproduce(parent2, { x: 50, y: 50 });

    expect(child).toBeInstanceOf(AIController);
    expect(child.getStats().brainLayers).toBe(2);
  });

  it('무성 번식 (복제)', () => {
    const parent = new AIController({
      brainConfig: {
        inputSize: 12,
        hiddenSize: 16,
        outputSize: 8,
        hiddenLayers: 2,
      },
      senseRange: 100,
      birthPosition: { x: 0, y: 0 },
    });

    const child = parent.clone({ x: 10, y: 10 });

    expect(child).toBeInstanceOf(AIController);
    expect(child.getStats().brainLayers).toBe(2);
  });

  it('직렬화 및 역직렬화', () => {
    const ai = new AIController({
      brainConfig: {
        inputSize: 12,
        hiddenSize: 16,
        outputSize: 8,
        hiddenLayers: 2,
      },
      senseRange: 100,
      birthPosition: { x: 0, y: 0 },
    });

    const serialized = ai.serialize();
    const deserialized = AIController.deserialize(serialized);

    expect(deserialized).toBeInstanceOf(AIController);
    expect(deserialized.getStats().brainLayers).toBe(2);
  });
});
