/**
 * 다세포 생물 관리자
 *
 * 단세포에서 다세포로의 전환, 다세포 생물 생성 및 관리를 담당합니다.
 */

import type { Vector2D } from '../../types';
import type { Organism } from '../Organism';
import type {
  MulticellularOrganism,
  MulticellularTraits,
  CellCluster,
  DifferentiatedCell,
  MulticellularTransitionCriteria,
} from './types';
import { DEFAULT_TRANSITION_CRITERIA, CellType } from './types';
import { CellDifferentiation } from './CellDifferentiation';
import { BodyPlanManager } from './BodyPlan';

/**
 * 다세포 생물 관리자 클래스
 */
export class MulticellularManager {
  private transitionCriteria: MulticellularTransitionCriteria;

  constructor(criteria?: Partial<MulticellularTransitionCriteria>) {
    this.transitionCriteria = {
      ...DEFAULT_TRANSITION_CRITERIA,
      ...criteria,
    };
  }

  /**
   * 단세포 생물이 다세포로 전환 가능한지 체크
   */
  canTransitionToMulticellular(organism: Organism): boolean {
    // 이미 다세포면 불가
    if (organism.isMulticellular()) {
      return false;
    }

    // 최소 에너지 체크
    if (organism.energy < this.transitionCriteria.energyThreshold) {
      return false;
    }

    // 최소 나이 체크
    if (organism.age < this.transitionCriteria.minAge) {
      return false;
    }

    // 유전적 조건 체크 (기본값으로 통과)
    // 실제 협력도/결합강도는 genome에 없으므로 기본 조건만 체크
    const cooperation = 0.5; // 기본값
    const bondStrength = 0.5; // 기본값

    if (cooperation < this.transitionCriteria.minCooperation) {
      return false;
    }

    if (bondStrength < this.transitionCriteria.minBondStrength) {
      return false;
    }

    return true;
  }

  /**
   * 단세포 생물을 다세포로 전환
   * 주의: 이 메서드는 새 MulticellularOrganism 객체를 반환하지만,
   * 실제 게임에서는 OrganismManager.evolveToMulticellular()를 사용
   */
  transitionToMulticellular(organism: Organism): MulticellularTraits {
    if (!this.canTransitionToMulticellular(organism)) {
      throw new Error('Organism does not meet criteria for multicellular transition');
    }

    // 초기 세포 클러스터 생성 (4개 세포)
    const position = { x: organism.x, y: organism.y };
    const initialCells = this.createInitialCellCluster(
      position,
      this.transitionCriteria.minCellCount
    );

    const cluster: CellCluster = {
      cells: initialCells,
      centerOfMass: position,
      bondStrength: 0.7,
      cohesion: 0.8,
      totalEnergy: organism.energy,
    };

    const bodyPlan = BodyPlanManager.createBasicBodyPlan();

    const multicellularTraits: MulticellularTraits = {
      isMulticellular: true,
      cellCluster: cluster,
      bodyPlan,
      cellCount: initialCells.length,
      differentiation: 0.0, // 초기에는 모두 줄기 세포
      coordination: 0.5,
      metabolicEfficiency: 1.2, // 다세포는 단세포보다 효율적
      reproductiveCapacity: 0.3,
    };

    return multicellularTraits;
  }

  /**
   * 초기 세포 클러스터 생성
   */
  private createInitialCellCluster(
    center: Vector2D,
    cellCount: number
  ): DifferentiatedCell[] {
    const cells: DifferentiatedCell[] = [];
    const radius = 2; // 세포 간 기본 거리

    for (let i = 0; i < cellCount; i++) {
      // 원형 배치
      const angle = (i / cellCount) * Math.PI * 2;
      const position: Vector2D = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };

      cells.push(CellDifferentiation.createStemCell(position));
    }

    return cells;
  }

  /**
   * 다세포 생물 업데이트
   */
  updateMulticellularOrganism(
    organism: MulticellularOrganism,
    deltaTime: number,
    environment: EnvironmentData
  ): void {
    const { multicellular } = organism;

    // 각 세포 업데이트
    for (const cell of multicellular.cellCluster.cells) {
      CellDifferentiation.updateCell(cell, deltaTime);

      // 줄기 세포 분화 시도
      if (cell.type === CellType.STEM) {
        this.attemptCellDifferentiation(cell, environment, organism);
      }
    }

    // 죽은 세포 제거
    multicellular.cellCluster.cells = multicellular.cellCluster.cells.filter(
      (cell) => !CellDifferentiation.isDead(cell)
    );

    // 클러스터 통계 업데이트
    this.updateClusterStats(multicellular);

    // 신체 계획 진화
    multicellular.bodyPlan = BodyPlanManager.evolveBodyPlan(
      multicellular.bodyPlan,
      multicellular.cellCluster,
      deltaTime
    );

    // 에너지 계산
    this.updateEnergy(organism, deltaTime);

    // 중심 위치 업데이트
    this.updateCenterOfMass(multicellular.cellCluster);
  }

  /**
   * 세포 분화 시도
   */
  private attemptCellDifferentiation(
    cell: DifferentiatedCell,
    environment: EnvironmentData,
    organism: MulticellularOrganism
  ): void {
    const neighborCount = this.countNeighbors(
      cell,
      organism.multicellular.cellCluster.cells
    );

    // 환경에 따른 최적 타입 제안
    const suggestedType = CellDifferentiation.suggestCellType(
      environment.temperature,
      environment.sunlight,
      environment.foodAvailability,
      neighborCount
    );

    // 분화 조건 생성 (specialization 기본값 0.5 사용)
    const condition = CellDifferentiation.createDifferentiationCondition(
      suggestedType,
      organism.energy,
      neighborCount,
      environment.sunlight,
      0.5 // 기본 특수화 값
    );

    // 분화 시도
    CellDifferentiation.differentiate(cell, suggestedType, condition);
  }

  /**
   * 인접 세포 수 계산
   */
  private countNeighbors(
    cell: DifferentiatedCell,
    allCells: DifferentiatedCell[]
  ): number {
    const neighborRadius = 5;
    let count = 0;

    for (const other of allCells) {
      if (other.id === cell.id) continue;

      const dx = cell.position.x - other.position.x;
      const dy = cell.position.y - other.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < neighborRadius) {
        count++;
      }
    }

    return count;
  }

  /**
   * 클러스터 통계 업데이트
   */
  private updateClusterStats(multicellular: MulticellularTraits): void {
    const { cellCluster } = multicellular;
    const cells = cellCluster.cells;

    // 세포 수
    multicellular.cellCount = cells.length;

    // 평균 분화도
    if (cells.length > 0) {
      multicellular.differentiation =
        cells.reduce((sum, c) => sum + c.specialization, 0) / cells.length;
    }

    // 협력도 (연결도 평균)
    if (cells.length > 0) {
      multicellular.coordination =
        cells.reduce((sum, c) => sum + c.connectivity, 0) / cells.length;
    }

    // 타입 다양성에 따른 대사 효율
    const typeCount = new Set(cells.map((c) => c.type)).size;
    multicellular.metabolicEfficiency = 1.0 + typeCount * 0.05; // 타입당 +5%

    // 생식 세포 비율에 따른 번식 능력
    const reproductiveCells = cells.filter(
      (c) => c.type === CellType.REPRODUCTIVE
    ).length;
    multicellular.reproductiveCapacity = Math.min(
      1.0,
      0.1 + reproductiveCells / cells.length
    );
  }

  /**
   * 에너지 업데이트
   */
  private updateEnergy(organism: MulticellularOrganism, deltaTime: number): void {
    let energyDelta = 0;

    // 각 세포의 에너지 기여도 합산
    for (const cell of organism.multicellular.cellCluster.cells) {
      energyDelta += CellDifferentiation.calculateEnergyContribution(cell);
    }

    // 대사 효율 적용
    energyDelta *= organism.multicellular.metabolicEfficiency;

    // 기본 유지 비용
    const maintenanceCost = organism.multicellular.cellCount * 0.01;

    organism.energy += (energyDelta - maintenanceCost) * deltaTime;
    organism.energy = Math.max(0, organism.energy);
  }

  /**
   * 질량 중심 업데이트
   */
  private updateCenterOfMass(cluster: CellCluster): void {
    const cells = cluster.cells;
    if (cells.length === 0) return;

    let sumX = 0;
    let sumY = 0;

    for (const cell of cells) {
      sumX += cell.position.x;
      sumY += cell.position.y;
    }

    cluster.centerOfMass = {
      x: sumX / cells.length,
      y: sumY / cells.length,
    };
  }

  /**
   * 세포 분열 (생물 성장)
   */
  addCell(
    organism: MulticellularOrganism,
    parentCellId: string,
    _environment: EnvironmentData
  ): boolean {
    // 에너지 부족
    if (organism.energy < 10) {
      return false;
    }

    const parentCell = organism.multicellular.cellCluster.cells.find(
      (c) => c.id === parentCellId
    );

    if (!parentCell) {
      return false;
    }

    // 새 세포 위치 (부모 근처 랜덤)
    const angle = Math.random() * Math.PI * 2;
    const distance = 2;
    const newPosition: Vector2D = {
      x: parentCell.position.x + Math.cos(angle) * distance,
      y: parentCell.position.y + Math.sin(angle) * distance,
    };

    // 세포 복제
    const newCell = CellDifferentiation.cloneCell(parentCell, newPosition);
    organism.multicellular.cellCluster.cells.push(newCell);

    // 에너지 소비
    organism.energy -= 10;

    return true;
  }

  /**
   * 이동 속도 계산 (근육 세포 기여도)
   */
  calculateMovementSpeed(organism: MulticellularOrganism): number {
    let totalMovement = 0;

    for (const cell of organism.multicellular.cellCluster.cells) {
      totalMovement += CellDifferentiation.calculateMovementContribution(cell);
    }

    // 세포 수에 따른 질량 효과
    const massEffect = 1 / Math.sqrt(organism.multicellular.cellCount);

    return totalMovement * massEffect;
  }

  /**
   * 감지 범위 계산 (감각 세포 기여도)
   */
  calculateSensingRange(organism: MulticellularOrganism): number {
    let maxRange = 0;

    for (const cell of organism.multicellular.cellCluster.cells) {
      const range = CellDifferentiation.calculateSensingRange(cell);
      maxRange = Math.max(maxRange, range);
    }

    return maxRange;
  }
}

/**
 * 환경 데이터 인터페이스
 */
export interface EnvironmentData {
  temperature: number;    // 0~1
  sunlight: number;       // 0~1
  foodAvailability: number; // 0~1
}
