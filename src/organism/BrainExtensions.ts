/**
 * Brain 클래스 확장 메서드
 *
 * 저장/불러오기를 위한 메서드들을 Brain 프로토타입에 추가합니다.
 */

import { Brain } from './Brain';

// Brain 프로토타입에 메서드 추가
declare module './Brain' {
  interface Brain {
    getWeights(): number[][][];
    getBiases(): number[][];
    setWeights(weights: number[][][]): void;
    setBiases(biases: number[][]): void;
  }
}

/**
 * 가중치 추출 (저장용)
 */
Brain.prototype.getWeights = function(): number[][][] {
  // @ts-ignore - private 필드 접근
  return this.weights.map((layer: number[][]) =>
    layer.map((neuron: number[]) => [...neuron])
  );
};

/**
 * 바이어스 추출 (저장용)
 */
Brain.prototype.getBiases = function(): number[][] {
  // @ts-ignore - private 필드 접근
  return this.biases.map((layer: number[]) => [...layer]);
};

/**
 * 가중치 설정 (불러오기용)
 */
Brain.prototype.setWeights = function(weights: number[][][]): void {
  // @ts-ignore - private 필드 접근
  this.weights = weights.map((layer: number[][]) =>
    layer.map((neuron: number[]) => [...neuron])
  );
};

/**
 * 바이어스 설정 (불러오기용)
 */
Brain.prototype.setBiases = function(biases: number[][]): void {
  // @ts-ignore - private 필드 접근
  this.biases = biases.map((layer: number[]) => [...layer]);
};
