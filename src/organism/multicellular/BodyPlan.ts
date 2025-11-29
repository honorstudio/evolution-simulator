/**
 * 신체 계획 (Body Plan) 시스템
 *
 * 다세포 생물의 전체 구조, 대칭성, 조직화를 관리합니다.
 */

import type { Vector2D } from '../../types';
import type {
  BodyPlan,
  BodySymmetryValue,
  GermLayerCountValue,
  DifferentiatedCell,
  CellCluster,
} from './types';
import { BodySymmetry, GermLayerCount, CellType } from './types';

/**
 * 신체 계획 관리자 클래스
 */
export class BodyPlanManager {
  /**
   * 기본 신체 계획 생성 (초기 다세포)
   */
  static createBasicBodyPlan(): BodyPlan {
    return {
      symmetry: BodySymmetry.ASYMMETRIC,
      germLayers: GermLayerCount.NONE,
      segmentCount: 0,
      hasNervousSystem: false,
      hasDigestiveSystem: false,
      hasMusculature: false,
      complexity: 0.1,
      organization: 0.2,
    };
  }

  /**
   * 세포 클러스터로부터 신체 계획 분석
   */
  static analyzeBodyPlan(cluster: CellCluster): BodyPlan {
    const symmetry = this.detectSymmetry(cluster);
    const germLayers = this.detectGermLayers(cluster);
    const systems = this.detectSystems(cluster);

    return {
      symmetry,
      germLayers,
      segmentCount: this.countSegments(cluster),
      hasNervousSystem: systems.nervous,
      hasDigestiveSystem: systems.digestive,
      hasMusculature: systems.muscle,
      complexity: this.calculateComplexity(cluster),
      organization: this.calculateOrganization(cluster),
    };
  }

  /**
   * 대칭성 감지
   */
  private static detectSymmetry(cluster: CellCluster): BodySymmetryValue {
    const { cells, centerOfMass } = cluster;

    if (cells.length < 4) {
      return BodySymmetry.ASYMMETRIC;
    }

    // 방사 대칭 체크 (중심으로부터 균등 분포)
    const radialScore = this.calculateRadialSymmetryScore(cells, centerOfMass);
    if (radialScore > 0.7) {
      return BodySymmetry.RADIAL;
    }

    // 좌우 대칭 체크
    const bilateralScore = this.calculateBilateralSymmetryScore(cells, centerOfMass);
    if (bilateralScore > 0.7) {
      return BodySymmetry.BILATERAL;
    }

    return BodySymmetry.ASYMMETRIC;
  }

  /**
   * 방사 대칭 점수 계산
   */
  private static calculateRadialSymmetryScore(
    cells: DifferentiatedCell[],
    center: Vector2D
  ): number {
    if (cells.length < 4) return 0;

    // 각 사분면의 세포 수 계산
    const quadrants = [0, 0, 0, 0];
    for (const cell of cells) {
      const dx = cell.position.x - center.x;
      const dy = cell.position.y - center.y;
      const angle = Math.atan2(dy, dx);
      const quadrant = Math.floor(((angle + Math.PI) / (Math.PI / 2)) % 4);
      const qIdx = quadrant as 0 | 1 | 2 | 3;
      const current = quadrants[qIdx];
      if (current !== undefined) {
        quadrants[qIdx] = current + 1;
      }
    }

    // 균등 분포일수록 높은 점수
    const average = cells.length / 4;
    const variance =
      quadrants.reduce((sum, count) => sum + (count - average) ** 2, 0) / 4;
    return Math.max(0, 1 - variance / average);
  }

  /**
   * 좌우 대칭 점수 계산
   */
  private static calculateBilateralSymmetryScore(
    cells: DifferentiatedCell[],
    center: Vector2D
  ): number {
    if (cells.length < 4) return 0;

    // 좌우 세포 수 비교
    let leftCount = 0;
    let rightCount = 0;

    for (const cell of cells) {
      if (cell.position.x < center.x) {
        leftCount++;
      } else {
        rightCount++;
      }
    }

    const total = cells.length;
    const balance = 1 - Math.abs(leftCount - rightCount) / total;

    // 각 타입별 좌우 분포도 체크
    const typeBalance = this.calculateTypeSymmetry(cells, center);

    return (balance + typeBalance) / 2;
  }

  /**
   * 세포 타입별 좌우 대칭 계산
   */
  private static calculateTypeSymmetry(
    cells: DifferentiatedCell[],
    center: Vector2D
  ): number {
    const typeMap = new Map<string, { left: number; right: number }>();

    for (const cell of cells) {
      if (!typeMap.has(cell.type)) {
        typeMap.set(cell.type, { left: 0, right: 0 });
      }

      const data = typeMap.get(cell.type)!;
      if (cell.position.x < center.x) {
        data.left++;
      } else {
        data.right++;
      }
    }

    let totalBalance = 0;
    let typeCount = 0;

    for (const data of typeMap.values()) {
      const total = data.left + data.right;
      if (total > 0) {
        const balance = 1 - Math.abs(data.left - data.right) / total;
        totalBalance += balance;
        typeCount++;
      }
    }

    return typeCount > 0 ? totalBalance / typeCount : 0;
  }

  /**
   * 배엽 수 감지
   */
  private static detectGermLayers(cluster: CellCluster): GermLayerCountValue {
    const typeSet = new Set(cluster.cells.map((c) => c.type));

    // 2배엽: 외배엽(감각, 신경) + 내배엽(소화)
    const hasEctoderm = typeSet.has(CellType.SENSORY) || typeSet.has(CellType.NEURAL);
    const hasEndoderm = typeSet.has(CellType.DIGESTIVE);

    // 3배엽: + 중배엽(근육, 구조)
    const hasMesoderm =
      typeSet.has(CellType.MUSCLE) || typeSet.has(CellType.STRUCTURAL);

    if (hasEctoderm && hasEndoderm && hasMesoderm) {
      return GermLayerCount.TRIPLOBLASTIC;
    }

    if (hasEctoderm && hasEndoderm) {
      return GermLayerCount.DIPLOBLASTIC;
    }

    return GermLayerCount.NONE;
  }

  /**
   * 체절 수 계산
   */
  private static countSegments(cluster: CellCluster): number {
    // 간단한 구현: Y축 기준으로 세포 그룹 나누기
    const { cells } = cluster;

    if (cells.length < 8) return 0;

    // Y좌표 정렬
    const sortedCells = [...cells].sort((a, b) => a.position.y - b.position.y);

    const firstCell = sortedCells[0];
    const lastCell = sortedCells[sortedCells.length - 1];
    if (!firstCell || !lastCell) return 0;

    // 큰 간격을 체절 경계로 간주
    let segmentCount = 1;
    const avgSpacing = (lastCell.position.y - firstCell.position.y) / cells.length;

    for (let i = 1; i < sortedCells.length; i++) {
      const currentCell = sortedCells[i];
      const prevCell = sortedCells[i - 1];
      if (!currentCell || !prevCell) continue;

      const spacing = currentCell.position.y - prevCell.position.y;
      if (spacing > avgSpacing * 2) {
        segmentCount++;
      }
    }

    return segmentCount > 1 ? segmentCount : 0;
  }

  /**
   * 시스템 감지 (신경계, 소화계, 근육계)
   */
  private static detectSystems(cluster: CellCluster): {
    nervous: boolean;
    digestive: boolean;
    muscle: boolean;
  } {
    const typeCounts = new Map<string, number>();

    for (const cell of cluster.cells) {
      typeCounts.set(cell.type, (typeCounts.get(cell.type) ?? 0) + 1);
    }

    const totalCells = cluster.cells.length;

    return {
      nervous: (typeCounts.get(CellType.NEURAL) ?? 0) >= Math.max(2, totalCells * 0.1),
      digestive:
        (typeCounts.get(CellType.DIGESTIVE) ?? 0) >= Math.max(2, totalCells * 0.15),
      muscle: (typeCounts.get(CellType.MUSCLE) ?? 0) >= Math.max(2, totalCells * 0.15),
    };
  }

  /**
   * 복잡도 계산
   */
  private static calculateComplexity(cluster: CellCluster): number {
    const typeCount = new Set(cluster.cells.map((c) => c.type)).size;
    const cellCount = cluster.cells.length;

    // 타입 다양성
    const diversity = Math.min(1, typeCount / 9); // 9가지 타입

    // 세포 수
    const scale = Math.min(1, cellCount / 100); // 100개 이상이면 최대

    // 평균 특화도
    const avgSpecialization =
      cluster.cells.reduce((sum, c) => sum + c.specialization, 0) / cellCount;

    return (diversity * 0.4 + scale * 0.3 + avgSpecialization * 0.3);
  }

  /**
   * 조직화 정도 계산
   */
  private static calculateOrganization(cluster: CellCluster): number {
    const { cells } = cluster;
    if (cells.length < 2) return 0;

    // 세포 간 연결도 평균
    const avgConnectivity =
      cells.reduce((sum, c) => sum + c.connectivity, 0) / cells.length;

    // 같은 타입 세포의 군집화 정도
    const clustering = this.calculateClustering(cells);

    // 결합력
    const bonding = cluster.bondStrength;

    return (avgConnectivity * 0.3 + clustering * 0.4 + bonding * 0.3);
  }

  /**
   * 군집화 계산 (같은 타입이 모여있는 정도)
   */
  private static calculateClustering(cells: DifferentiatedCell[]): number {
    if (cells.length < 2) return 0;

    let clusterScore = 0;
    let comparisons = 0;

    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const cellI = cells[i];
        const cellJ = cells[j];
        if (!cellI || !cellJ) continue;

        const distance = this.distance(cellI.position, cellJ.position);
        const sameType = cellI.type === cellJ.type ? 1 : 0;

        // 가까운 거리에 같은 타입이 있으면 높은 점수
        if (distance < 5) {
          clusterScore += sameType;
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? clusterScore / comparisons : 0;
  }

  /**
   * 두 점 사이 거리
   */
  private static distance(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 신체 계획 업데이트 (진화)
   */
  static evolveBodyPlan(
    current: BodyPlan,
    cluster: CellCluster,
    _deltaTime: number
  ): BodyPlan {
    const analyzed = this.analyzeBodyPlan(cluster);

    // 점진적 변화 (급격한 변화 방지)
    return {
      symmetry: this.evolveSymmetry(current.symmetry, analyzed.symmetry),
      germLayers: this.evolveGermLayers(current.germLayers, analyzed.germLayers),
      segmentCount: analyzed.segmentCount,
      hasNervousSystem: current.hasNervousSystem || analyzed.hasNervousSystem,
      hasDigestiveSystem: current.hasDigestiveSystem || analyzed.hasDigestiveSystem,
      hasMusculature: current.hasMusculature || analyzed.hasMusculature,
      complexity: this.lerp(current.complexity, analyzed.complexity, 0.1),
      organization: this.lerp(current.organization, analyzed.organization, 0.1),
    };
  }

  /**
   * 대칭성 진화 (비가역적)
   */
  private static evolveSymmetry(
    current: BodySymmetryValue,
    target: BodySymmetryValue
  ): BodySymmetryValue {
    // 비대칭 -> 방사 -> 좌우 순으로만 진화 가능
    if (current === BodySymmetry.ASYMMETRIC && target === BodySymmetry.RADIAL) {
      return BodySymmetry.RADIAL;
    }
    if (current === BodySymmetry.RADIAL && target === BodySymmetry.BILATERAL) {
      return BodySymmetry.BILATERAL;
    }
    return current;
  }

  /**
   * 배엽 진화 (비가역적)
   */
  private static evolveGermLayers(
    current: GermLayerCountValue,
    target: GermLayerCountValue
  ): GermLayerCountValue {
    // 0 -> 2 -> 3 순으로만 진화 가능
    if (current < target) {
      return target;
    }
    return current;
  }

  /**
   * 선형 보간
   */
  private static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
