/**
 * 간단한 순전파 신경망 (Feedforward Neural Network)
 * 생명체의 행동을 결정하는 AI 뇌
 */
export class Brain {
  private inputSize: number;
  private outputSize: number;
  private hiddenLayers: number;
  private neuronsPerLayer: number;

  // 가중치: weights[레이어][출력뉴런][입력뉴런]
  private weights: number[][][];

  // 바이어스: biases[레이어][뉴런]
  private biases: number[][];

  constructor(
    inputSize: number,       // 입력 개수 (센서 데이터)
    hiddenLayers: number,    // 은닉층 개수
    neuronsPerLayer: number, // 각 은닉층의 뉴런 개수
    outputSize: number       // 출력 개수 (행동)
  ) {
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    this.hiddenLayers = hiddenLayers;
    this.neuronsPerLayer = neuronsPerLayer;

    this.weights = [];
    this.biases = [];

    this.initializeWeights();
  }

  /**
   * 가중치와 바이어스 초기화
   * Xavier 초기화 사용: 평균 0, 분산 1/n
   */
  private initializeWeights(): void {
    const layerSizes = this.getLayerSizes();

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const inputCount = layerSizes[i]!;
      const outputCount = layerSizes[i + 1]!;

      // Xavier 초기화 범위
      const limit = Math.sqrt(6 / (inputCount + outputCount));

      // 가중치 초기화
      const layerWeights: number[][] = [];
      for (let o = 0; o < outputCount; o++) {
        const neuronWeights: number[] = [];
        for (let j = 0; j < inputCount; j++) {
          neuronWeights.push((Math.random() * 2 - 1) * limit);
        }
        layerWeights.push(neuronWeights);
      }
      this.weights.push(layerWeights);

      // 바이어스 초기화 (0으로 시작)
      const layerBiases: number[] = [];
      for (let o = 0; o < outputCount; o++) {
        layerBiases.push(0);
      }
      this.biases.push(layerBiases);
    }
  }

  /**
   * 각 레이어의 크기 배열 반환
   * [입력, 은닉1, 은닉2, ..., 출력]
   */
  private getLayerSizes(): number[] {
    const sizes = [this.inputSize];

    // 은닉층들
    for (let i = 0; i < this.hiddenLayers; i++) {
      sizes.push(this.neuronsPerLayer);
    }

    // 출력층
    sizes.push(this.outputSize);

    return sizes;
  }

  /**
   * 순전파 (Forward Propagation)
   * 입력 데이터를 받아서 출력 계산
   */
  forward(inputs: number[]): number[] {
    if (inputs.length !== this.inputSize) {
      throw new Error(`입력 크기 불일치: 예상 ${this.inputSize}, 실제 ${inputs.length}`);
    }

    let activation = [...inputs];

    // 각 레이어를 순차적으로 처리
    for (let layer = 0; layer < this.weights.length; layer++) {
      activation = this.processLayer(activation, layer);
    }

    return activation;
  }

  /**
   * 한 레이어 처리
   */
  private processLayer(inputs: number[], layerIndex: number): number[] {
    const layerWeights = this.weights[layerIndex]!;
    const layerBiases = this.biases[layerIndex]!;
    const outputs: number[] = [];

    // 각 뉴런 계산
    for (let i = 0; i < layerWeights.length; i++) {
      let sum = layerBiases[i] ?? 0;

      // 가중치 합 계산
      const neuronWeights = layerWeights[i]!;
      for (let j = 0; j < inputs.length; j++) {
        sum += (inputs[j] ?? 0) * (neuronWeights[j] ?? 0);
      }

      // 활성화 함수 적용 (tanh)
      // tanh는 -1 ~ 1 범위의 출력을 만들어 행동 제어에 적합
      outputs.push(Math.tanh(sum));
    }

    return outputs;
  }

  /**
   * 뇌 복제 (번식시 사용)
   */
  clone(): Brain {
    const cloned = new Brain(
      this.inputSize,
      this.hiddenLayers,
      this.neuronsPerLayer,
      this.outputSize
    );

    // 가중치와 바이어스 깊은 복사
    cloned.weights = this.weights.map(layer =>
      layer.map(neuron => [...neuron])
    );

    cloned.biases = this.biases.map(layer => [...layer]);

    return cloned;
  }

  /**
   * 돌연변이 적용
   * 각 가중치와 바이어스를 확률적으로 변경
   */
  mutate(rate: number): void {
    // 가중치 변이
    for (const layer of this.weights) {
      for (const neuronWeights of layer) {
        for (let k = 0; k < neuronWeights.length; k++) {
          if (Math.random() < rate) {
            // 기존 값에 작은 변화 추가
            neuronWeights[k] = (neuronWeights[k] ?? 0) + (Math.random() - 0.5) * 0.5;

            // 너무 큰 값 방지
            neuronWeights[k] = Math.max(-2, Math.min(2, neuronWeights[k]!));
          }
        }
      }
    }

    // 바이어스 변이
    for (const layerBiases of this.biases) {
      for (let j = 0; j < layerBiases.length; j++) {
        if (Math.random() < rate) {
          layerBiases[j] = (layerBiases[j] ?? 0) + (Math.random() - 0.5) * 0.5;
          layerBiases[j] = Math.max(-2, Math.min(2, layerBiases[j]!));
        }
      }
    }
  }

  /**
   * 두 뇌의 가중치 교배 (유성생식용)
   */
  static crossover(brain1: Brain, brain2: Brain): Brain {
    if (brain1.inputSize !== brain2.inputSize ||
        brain1.outputSize !== brain2.outputSize ||
        brain1.hiddenLayers !== brain2.hiddenLayers ||
        brain1.neuronsPerLayer !== brain2.neuronsPerLayer) {
      throw new Error('뇌 구조가 다른 개체끼리는 교배할 수 없습니다');
    }

    const child = brain1.clone();

    // 각 가중치를 50% 확률로 선택
    for (let i = 0; i < child.weights.length; i++) {
      const childLayer = child.weights[i]!;
      const brain2Layer = brain2.weights[i]!;
      for (let j = 0; j < childLayer.length; j++) {
        const childNeuron = childLayer[j]!;
        const brain2Neuron = brain2Layer[j]!;
        for (let k = 0; k < childNeuron.length; k++) {
          if (Math.random() < 0.5) {
            childNeuron[k] = brain2Neuron[k] ?? 0;
          }
        }
      }
    }

    // 바이어스도 교배
    for (let i = 0; i < child.biases.length; i++) {
      const childBiases = child.biases[i]!;
      const brain2Biases = brain2.biases[i]!;
      for (let j = 0; j < childBiases.length; j++) {
        if (Math.random() < 0.5) {
          childBiases[j] = brain2Biases[j] ?? 0;
        }
      }
    }

    return child;
  }

  /**
   * 다른 뇌와 교배 (인스턴스 메서드)
   * 자신의 가중치를 다른 뇌와 혼합
   */
  crossoverWith(other: Brain): void {
    // 구조가 다르면 교배 스킵 (안전하게)
    if (this.inputSize !== other.inputSize ||
        this.outputSize !== other.outputSize ||
        this.hiddenLayers !== other.hiddenLayers ||
        this.neuronsPerLayer !== other.neuronsPerLayer) {
      return; // 구조가 다르면 그냥 리턴
    }

    // 각 가중치를 50% 확률로 선택
    for (let i = 0; i < this.weights.length; i++) {
      const thisLayer = this.weights[i];
      const otherLayer = other.weights[i];
      if (!thisLayer || !otherLayer) continue;

      for (let j = 0; j < thisLayer.length; j++) {
        const thisNeuron = thisLayer[j];
        const otherNeuron = otherLayer[j];
        if (!thisNeuron || !otherNeuron) continue;

        for (let k = 0; k < thisNeuron.length; k++) {
          if (Math.random() < 0.5) {
            thisNeuron[k] = otherNeuron[k] ?? 0;
          }
        }
      }
    }

    // 바이어스도 교배
    for (let i = 0; i < this.biases.length; i++) {
      const thisBiases = this.biases[i];
      const otherBiases = other.biases[i];
      if (!thisBiases || !otherBiases) continue;

      for (let j = 0; j < thisBiases.length; j++) {
        if (Math.random() < 0.5) {
          thisBiases[j] = otherBiases[j] ?? 0;
        }
      }
    }
  }

  /**
   * 디버깅용: 뇌 구조 출력
   */
  getInfo(): string {
    const layerSizes = this.getLayerSizes();
    return `Brain [${layerSizes.join(' → ')}]`;
  }

  /**
   * 가중치 반환 (직렬화용)
   */
  getWeights(): number[][][] {
    return this.weights.map(layer =>
      layer.map(neuron => [...neuron])
    );
  }

  /**
   * 바이어스 반환 (직렬화용)
   */
  getBiases(): number[][] {
    return this.biases.map(layer => [...layer]);
  }

  /**
   * 가중치 설정 (역직렬화용)
   */
  setWeights(weights: number[][][]): void {
    this.weights = weights.map(layer =>
      layer.map(neuron => [...neuron])
    );
  }

  /**
   * 바이어스 설정 (역직렬화용)
   */
  setBiases(biases: number[][]): void {
    this.biases = biases.map(layer => [...layer]);
  }
}
