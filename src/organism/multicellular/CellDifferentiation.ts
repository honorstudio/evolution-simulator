/**
 * 세포 분화 시스템
 *
 * 줄기 세포가 특정 기능을 가진 세포로 분화하는 과정을 관리합니다.
 */

import type { Vector2D } from '../../types';
import type {
  DifferentiatedCell,
  CellTypeValue,
  DifferentiationCondition,
  CellFunction,
} from './types';
import { CellType } from './types';

/**
 * 세포 타입별 기능 정의
 *
 * 각 세포 타입이 생물에 기여하는 기능과 비용
 */
export const CELL_FUNCTIONS: Record<CellTypeValue, CellFunction> = {
  [CellType.STEM]: {
    type: CellType.STEM,
    energyProduction: 0.5,
    energyConsumption: 0.3,
    movementContribution: 0.2,
    sensingRange: 1.0,
    reproductiveCost: 0.5,
    structuralStrength: 0.5,
  },
  [CellType.PHOTOSYNTHETIC]: {
    type: CellType.PHOTOSYNTHETIC,
    energyProduction: 2.0,        // 광합성으로 에너지 생산
    energyConsumption: 0.2,
    movementContribution: 0.0,    // 이동 기여 없음
    sensingRange: 0.5,
    reproductiveCost: 0.3,
    structuralStrength: 0.4,
  },
  [CellType.ROOT]: {
    type: CellType.ROOT,
    energyProduction: 1.0,         // 영양분 흡수
    energyConsumption: 0.3,
    movementContribution: 0.0,
    sensingRange: 0.3,
    reproductiveCost: 0.4,
    structuralStrength: 0.6,
  },
  [CellType.STRUCTURAL]: {
    type: CellType.STRUCTURAL,
    energyProduction: 0.0,
    energyConsumption: 0.1,
    movementContribution: 0.0,
    sensingRange: 0.0,
    reproductiveCost: 0.2,
    structuralStrength: 2.0,       // 구조 지지
  },
  [CellType.SENSORY]: {
    type: CellType.SENSORY,
    energyProduction: 0.0,
    energyConsumption: 0.4,
    movementContribution: 0.1,
    sensingRange: 3.0,             // 넓은 감지 범위
    reproductiveCost: 0.6,
    structuralStrength: 0.3,
  },
  [CellType.NEURAL]: {
    type: CellType.NEURAL,
    energyProduction: 0.0,
    energyConsumption: 0.6,        // 높은 에너지 소비
    movementContribution: 0.3,
    sensingRange: 2.0,
    reproductiveCost: 0.8,
    structuralStrength: 0.2,
  },
  [CellType.MUSCLE]: {
    type: CellType.MUSCLE,
    energyProduction: 0.0,
    energyConsumption: 0.8,        // 매우 높은 에너지 소비
    movementContribution: 2.0,     // 이동에 크게 기여
    sensingRange: 0.2,
    reproductiveCost: 0.7,
    structuralStrength: 1.0,
  },
  [CellType.DIGESTIVE]: {
    type: CellType.DIGESTIVE,
    energyProduction: 1.5,         // 소화를 통한 에너지 생산
    energyConsumption: 0.5,
    movementContribution: 0.0,
    sensingRange: 0.8,
    reproductiveCost: 0.4,
    structuralStrength: 0.5,
  },
  [CellType.REPRODUCTIVE]: {
    type: CellType.REPRODUCTIVE,
    energyProduction: 0.0,
    energyConsumption: 1.0,        // 매우 높은 에너지 소비
    movementContribution: 0.0,
    sensingRange: 0.5,
    reproductiveCost: 0.1,         // 번식 비용 감소
    structuralStrength: 0.4,
  },
};

/**
 * 세포 분화 시스템 클래스
 */
export class CellDifferentiation {
  private static idCounter = 0;

  /**
   * 새로운 줄기 세포 생성
   */
  static createStemCell(position: Vector2D): DifferentiatedCell {
    return {
      id: `cell_${++this.idCounter}`,
      type: CellType.STEM,
      position,
      specialization: 0.0,
      health: 1.0,
      age: 0,
      efficiency: 0.5,
      connectivity: 0.5,
    };
  }

  /**
   * 세포 분화 시도
   *
   * @param cell 분화할 줄기 세포
   * @param targetType 목표 세포 타입
   * @param condition 분화 조건
   * @returns 분화 성공 여부
   */
  static differentiate(
    cell: DifferentiatedCell,
    targetType: CellTypeValue,
    condition: DifferentiationCondition
  ): boolean {
    // 이미 분화된 세포는 재분화 불가
    if (cell.type !== CellType.STEM) {
      return false;
    }

    // 분화 조건 체크
    if (!this.canDifferentiate(cell, condition)) {
      return false;
    }

    // 분화 실행
    cell.type = targetType;
    cell.specialization = Math.random() * 0.3 + 0.5; // 0.5~0.8 시작
    cell.efficiency = condition.geneticPredisposition;
    cell.age = 0; // 분화 후 나이 초기화

    return true;
  }

  /**
   * 분화 가능 여부 체크
   */
  private static canDifferentiate(
    cell: DifferentiatedCell,
    condition: DifferentiationCondition
  ): boolean {
    // 세포가 충분히 건강해야 함
    if (cell.health < 0.5) return false;

    // 최소 연결도 필요
    if (cell.connectivity < 0.3) return false;

    // 조건 확률 계산
    const probability =
      condition.geneticPredisposition * 0.5 +
      condition.environmentalFactor * 0.3 +
      cell.health * 0.2;

    return Math.random() < probability;
  }

  /**
   * 환경에 따른 최적 세포 타입 결정
   *
   * @param temperature 온도 (0~1)
   * @param sunlight 햇빛 (0~1)
   * @param foodAvailability 먹이 가용성 (0~1)
   * @param neighborCount 인접 세포 수
   * @returns 권장 세포 타입
   */
  static suggestCellType(
    _temperature: number,
    sunlight: number,
    foodAvailability: number,
    neighborCount: number
  ): CellTypeValue {
    // 햇빛이 많으면 광합성 세포
    if (sunlight > 0.6) {
      return CellType.PHOTOSYNTHETIC;
    }

    // 먹이가 많으면 소화 세포
    if (foodAvailability > 0.7) {
      return CellType.DIGESTIVE;
    }

    // 세포가 많으면 특화 시작
    if (neighborCount >= 6) {
      // 내부 세포는 신경/구조 세포로
      if (Math.random() > 0.5) {
        return CellType.NEURAL;
      } else {
        return CellType.STRUCTURAL;
      }
    }

    // 외부 세포는 감각 세포로
    if (neighborCount <= 3) {
      return CellType.SENSORY;
    }

    // 기본적으로 줄기 세포 유지
    return CellType.STEM;
  }

  /**
   * 분화 조건 생성
   */
  static createDifferentiationCondition(
    cellType: CellTypeValue,
    _energy: number,
    neighborCount: number,
    environmentalFactor: number,
    geneticFactor: number
  ): DifferentiationCondition {
    const requiredEnergy = this.getRequiredEnergy(cellType);

    return {
      cellType,
      requiredEnergy,
      requiredNeighbors: neighborCount,
      environmentalFactor,
      geneticPredisposition: geneticFactor,
    };
  }

  /**
   * 세포 타입별 필요 에너지 계산
   */
  private static getRequiredEnergy(cellType: CellTypeValue): number {
    const func = CELL_FUNCTIONS[cellType];
    // 복잡한 세포일수록 높은 에너지 필요
    return func.energyConsumption * 20 + func.reproductiveCost * 10;
  }

  /**
   * 세포 업데이트 (나이 증가, 효율성 변화)
   */
  static updateCell(cell: DifferentiatedCell, deltaTime: number): void {
    cell.age += deltaTime;

    // 나이에 따른 효율성 변화
    // 초기에는 증가, 이후 감소 (피크: 100초)
    const ageFactor = Math.exp(-((cell.age - 100) ** 2) / 10000);
    cell.efficiency = Math.min(1.0, cell.specialization * ageFactor);

    // 건강도는 천천히 감소 (수명 제한)
    cell.health = Math.max(0, cell.health - deltaTime * 0.0001);
  }

  /**
   * 세포 타입별 에너지 기여도 계산
   */
  static calculateEnergyContribution(cell: DifferentiatedCell): number {
    const func = CELL_FUNCTIONS[cell.type];
    const production = func.energyProduction * cell.efficiency * cell.health;
    const consumption = func.energyConsumption;
    return production - consumption;
  }

  /**
   * 세포 타입별 이동 기여도 계산
   */
  static calculateMovementContribution(cell: DifferentiatedCell): number {
    const func = CELL_FUNCTIONS[cell.type];
    return func.movementContribution * cell.efficiency * cell.health;
  }

  /**
   * 세포 타입별 감지 범위 계산
   */
  static calculateSensingRange(cell: DifferentiatedCell): number {
    const func = CELL_FUNCTIONS[cell.type];
    return func.sensingRange * cell.efficiency * cell.health;
  }

  /**
   * 세포가 죽었는지 체크
   */
  static isDead(cell: DifferentiatedCell): boolean {
    return cell.health <= 0 || cell.age > 500; // 최대 수명 500초
  }

  /**
   * 세포 복제 (유사분열)
   */
  static cloneCell(cell: DifferentiatedCell, newPosition: Vector2D): DifferentiatedCell {
    return {
      id: `cell_${++this.idCounter}`,
      type: cell.type,
      position: newPosition,
      specialization: cell.specialization * (0.9 + Math.random() * 0.2), // 약간의 변이
      health: 1.0,
      age: 0,
      efficiency: cell.efficiency * (0.9 + Math.random() * 0.2),
      connectivity: cell.connectivity,
    };
  }
}
