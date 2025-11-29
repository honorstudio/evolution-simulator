/**
 * 확장된 신경망 (AdvancedBrain)
 *
 * 기능:
 * - 다층 신경망 (입력 12 → 은닉 16 → 출력 8)
 * - 은닉층 1-3개 지원
 * - Float32Array로 메모리 최적화
 * - 활성화 함수: tanh (은닉), sigmoid (출력)
 */

import { AdvancedBrainConfig } from './types';

export class AdvancedBrain {
  private config: AdvancedBrainConfig;
  private weights: Float32Array[];
  private biases: Float32Array[];
  private layerSizes: number[];

  constructor(config: AdvancedBrainConfig, weights?: Float32Array[], biases?: Float32Array[]) {
    this.config = config;

    // 레이어 크기 설정
    this.layerSizes = [config.inputSize];
    for (let i = 0; i < config.hiddenLayers; i++) {
      this.layerSizes.push(config.hiddenSize);
    }
    this.layerSizes.push(config.outputSize);

    if (weights && biases) {
      // 기존 가중치 사용 (유전 또는 복제)
      this.weights = weights;
      this.biases = biases;
    } else {
      // 새로운 가중치 초기화
      this.weights = [];
      this.biases = [];
      this.initializeWeights();
    }
  }

  /**
   * Xavier 초기화로 가중치 설정
   */
  private initializeWeights(): void {
    for (let i = 0; i < this.layerSizes.length - 1; i++) {
      const inputSize = this.layerSizes[i] ?? 0;
      const outputSize = this.layerSizes[i + 1] ?? 0;

      // Xavier 초기화: 범위 = sqrt(6 / (inputSize + outputSize))
      const limit = Math.sqrt(6 / (inputSize + outputSize));

      // 가중치 행렬 (outputSize x inputSize)
      const weightCount = outputSize * inputSize;
      const weights = new Float32Array(weightCount);
      for (let j = 0; j < weightCount; j++) {
        weights[j] = (Math.random() * 2 - 1) * limit;
      }
      this.weights.push(weights);

      // 편향 (outputSize)
      const biases = new Float32Array(outputSize);
      for (let j = 0; j < outputSize; j++) {
        biases[j] = 0; // 편향은 0으로 시작
      }
      this.biases.push(biases);
    }
  }

  /**
   * 순방향 전파 (Forward propagation)
   * @param input 입력 데이터 (길이 12)
   * @returns 출력 데이터 (길이 8)
   */
  public forward(input: Float32Array): Float32Array {
    if (input.length !== this.config.inputSize) {
      throw new Error(`입력 크기가 맞지 않습니다. 예상: ${this.config.inputSize}, 실제: ${input.length}`);
    }

    let activation = input;

    // 각 레이어 처리
    for (let i = 0; i < this.weights.length; i++) {
      const isOutputLayer = i === this.weights.length - 1;
      activation = this.layerForward(activation, i, isOutputLayer);
    }

    return activation;
  }

  /**
   * 단일 레이어 순방향 전파
   */
  private layerForward(input: Float32Array, layerIndex: number, isOutputLayer: boolean): Float32Array {
    const weights = this.weights[layerIndex]!;
    const biases = this.biases[layerIndex]!;
    const outputSize = biases.length;
    const inputSize = input.length;
    const output = new Float32Array(outputSize);

    // 행렬 곱셈 + 편향 + 활성화 함수
    for (let o = 0; o < outputSize; o++) {
      let sum = biases[o] ?? 0;
      for (let i = 0; i < inputSize; i++) {
        sum += (input[i] ?? 0) * (weights[o * inputSize + i] ?? 0);
      }

      // 활성화 함수 적용
      output[o] = isOutputLayer
        ? this.sigmoid(sum)  // 출력층: sigmoid (0-1)
        : this.tanh(sum);    // 은닉층: tanh (-1 ~ 1)
    }

    return output;
  }

  /**
   * tanh 활성화 함수
   */
  private tanh(x: number): number {
    return Math.tanh(x);
  }

  /**
   * sigmoid 활성화 함수
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * 가중치 복제 (번식용)
   */
  public cloneWeights(): { weights: Float32Array[], biases: Float32Array[] } {
    const clonedWeights = this.weights.map(w => new Float32Array(w));
    const clonedBiases = this.biases.map(b => new Float32Array(b));
    return { weights: clonedWeights, biases: clonedBiases };
  }

  /**
   * 돌연변이 적용
   * @param mutationRate 돌연변이 확률 (0-1)
   * @param mutationStrength 변이 강도 (0-1)
   */
  public mutate(mutationRate: number, mutationStrength: number): void {
    // 가중치 변이
    for (const weights of this.weights) {
      for (let i = 0; i < weights.length; i++) {
        if (Math.random() < mutationRate) {
          // 가우시안 노이즈 추가
          const noise = (Math.random() - 0.5) * 2 * mutationStrength;
          const current = weights[i] ?? 0;
          weights[i] = Math.max(-2, Math.min(2, current + noise));
        }
      }
    }

    // 편향 변이
    for (const biases of this.biases) {
      for (let i = 0; i < biases.length; i++) {
        if (Math.random() < mutationRate) {
          const noise = (Math.random() - 0.5) * 2 * mutationStrength;
          const current = biases[i] ?? 0;
          biases[i] = Math.max(-2, Math.min(2, current + noise));
        }
      }
    }
  }

  /**
   * 교배 (Crossover)
   * @param parent1 부모 1의 뇌
   * @param parent2 부모 2의 뇌
   * @returns 자식 뇌
   */
  public static crossover(parent1: AdvancedBrain, parent2: AdvancedBrain): AdvancedBrain {
    if (parent1.config.hiddenLayers !== parent2.config.hiddenLayers) {
      throw new Error('부모의 뇌 구조가 다릅니다');
    }

    const childWeights: Float32Array[] = [];
    const childBiases: Float32Array[] = [];

    // 각 레이어의 가중치를 50% 확률로 선택
    for (let i = 0; i < parent1.weights.length; i++) {
      const useParent1 = Math.random() < 0.5;
      const sourceWeights = useParent1 ? parent1.weights[i]! : parent2.weights[i]!;
      const sourceBiases = useParent1 ? parent1.biases[i]! : parent2.biases[i]!;

      childWeights.push(new Float32Array(sourceWeights));
      childBiases.push(new Float32Array(sourceBiases));
    }

    return new AdvancedBrain(parent1.config, childWeights, childBiases);
  }

  /**
   * 직렬화 (저장용)
   */
  public serialize(): string {
    const data = {
      config: this.config,
      weights: this.weights.map(w => Array.from(w)),
      biases: this.biases.map(b => Array.from(b)),
    };
    return JSON.stringify(data);
  }

  /**
   * 역직렬화 (불러오기용)
   */
  public static deserialize(data: string): AdvancedBrain {
    const parsed = JSON.parse(data);
    const weights = parsed.weights.map((w: number[]) => new Float32Array(w));
    const biases = parsed.biases.map((b: number[]) => new Float32Array(b));
    return new AdvancedBrain(parsed.config, weights, biases);
  }

  /**
   * 설정 조회
   */
  public getConfig(): AdvancedBrainConfig {
    return { ...this.config };
  }
}
