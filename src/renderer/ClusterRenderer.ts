/**
 * 클러스터 렌더러
 *
 * 많은 수의 개체를 효율적으로 렌더링하기 위해
 * 공간 해시 기반 클러스터링을 사용합니다.
 *
 * 1,000개 개체를 개별 점으로 그리는 대신,
 * 인접한 개체들을 묶어서 "덩어리"로 표시합니다.
 */

import { Graphics } from 'pixi.js';
import { Organism } from '../organism/Organism';

/**
 * 클러스터 정보
 */
interface Cluster {
  x: number;           // 클러스터 중심 X
  y: number;           // 클러스터 중심 Y
  count: number;       // 개체 수
  totalHue: number;    // 색상 평균 계산용
  totalEnergy: number; // 에너지 평균 계산용
  plantCount: number;  // 식물 수
  animalCount: number; // 동물 수
}

/**
 * 클러스터 렌더러 설정
 */
export interface ClusterRendererConfig {
  cellSize: number;      // 그리드 셀 크기 (픽셀)
  minRadius: number;     // 최소 클러스터 반경
  maxRadius: number;     // 최대 클러스터 반경
  maxCount: number;      // 최대 개체 수 (이 이상이면 maxRadius)
}

const DEFAULT_CONFIG: ClusterRendererConfig = {
  cellSize: 100,         // 100x100 픽셀 단위로 클러스터링
  minRadius: 5,          // 최소 반경 5px
  maxRadius: 30,         // 최대 반경 30px
  maxCount: 50,          // 50개 이상이면 최대 크기
};

/**
 * 클러스터 렌더러
 *
 * 축소 시 개체들을 그리드로 묶어서 효율적으로 렌더링합니다.
 * 줌 레벨에 따라 클러스터 크기가 자동 조절됩니다.
 */
export class ClusterRenderer {
  private config: ClusterRendererConfig;
  private clusters: Map<string, Cluster> = new Map();
  private currentZoom: number = 1;

  constructor(config: Partial<ClusterRendererConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 줌 레벨 설정
   * 줌에 따라 클러스터 크기가 조절됩니다.
   */
  setZoom(zoom: number): void {
    this.currentZoom = zoom;
  }

  /**
   * 클러스터 계산
   * 모든 개체를 그리드 셀에 할당하고 클러스터 정보를 계산합니다.
   * 줌이 낮을수록 더 넓은 영역을 하나의 클러스터로 묶습니다.
   */
  computeClusters(organisms: Organism[]): void {
    this.clusters.clear();

    // 줌에 따라 셀 크기 조절 (축소할수록 더 넓은 영역을 묶음)
    // 줌 1.0 = 100px, 줌 0.1 = 1000px, 줌 0.01 = 10000px
    const effectiveCellSize = this.config.cellSize / Math.max(this.currentZoom, 0.01);

    for (const organism of organisms) {
      if (!organism.isAlive) continue;

      // 그리드 셀 좌표 계산 (줌 보정된 셀 크기 사용)
      const cellX = Math.floor(organism.x / effectiveCellSize);
      const cellY = Math.floor(organism.y / effectiveCellSize);
      const key = `${cellX},${cellY}`;

      // 클러스터 업데이트
      if (!this.clusters.has(key)) {
        this.clusters.set(key, {
          x: 0,
          y: 0,
          count: 0,
          totalHue: 0,
          totalEnergy: 0,
          plantCount: 0,
          animalCount: 0,
        });
      }

      const cluster = this.clusters.get(key)!;
      cluster.count++;
      cluster.x += organism.x;
      cluster.y += organism.y;
      cluster.totalHue += organism.genome.hue;
      cluster.totalEnergy += organism.energy / organism.maxEnergy;

      if (organism.genome.kingdom === 'plant') {
        cluster.plantCount++;
      } else {
        cluster.animalCount++;
      }
    }

    // 평균 계산
    for (const cluster of this.clusters.values()) {
      if (cluster.count > 0) {
        cluster.x /= cluster.count;
        cluster.y /= cluster.count;
        cluster.totalHue /= cluster.count;
        cluster.totalEnergy /= cluster.count;
      }
    }
  }

  /**
   * 클러스터 렌더링
   * 각 클러스터를 개체 수에 비례하는 크기로 그립니다.
   * 줌 레벨에 따라 반경이 자동 조절되어 항상 눈에 보입니다.
   */
  render(graphics: Graphics): void {
    graphics.clear();

    // 줌에 따라 반경 보정 (축소할수록 반경을 키워서 눈에 보이게)
    // 줌 1.0 = 기본 크기, 줌 0.1 = 10배 크기, 줌 0.01 = 100배 크기
    const zoomCompensation = 1 / Math.max(this.currentZoom, 0.01);
    // 하지만 너무 커지면 안되니까 제한
    const clampedCompensation = Math.min(zoomCompensation, 50);

    for (const cluster of this.clusters.values()) {
      if (cluster.count === 0) continue;

      // 크기 계산 (개체 수에 비례)
      const sizeRatio = Math.min(cluster.count / this.config.maxCount, 1);
      const baseRadius = this.config.minRadius +
        (this.config.maxRadius - this.config.minRadius) * Math.sqrt(sizeRatio);

      // 줌 보정 적용 (축소해도 눈에 보이게)
      const radius = baseRadius * clampedCompensation;

      // 색상 결정 (식물이 많으면 녹색, 동물이 많으면 주황색)
      let color: number;
      if (cluster.plantCount > cluster.animalCount) {
        // 식물 우세: 녹색 계열
        const greenIntensity = Math.min(cluster.plantCount / 20, 1);
        color = this.hslToHex(120, 0.7, 0.3 + greenIntensity * 0.3);
      } else if (cluster.animalCount > cluster.plantCount) {
        // 동물 우세: 주황/빨강 계열
        const redIntensity = Math.min(cluster.animalCount / 20, 1);
        color = this.hslToHex(20, 0.8, 0.3 + redIntensity * 0.3);
      } else {
        // 혼합: 평균 색상 사용
        color = this.hslToHex(cluster.totalHue, 0.6, 0.5);
      }

      // 투명도 (에너지 평균 기반)
      const alpha = 0.4 + cluster.totalEnergy * 0.5;

      // 클러스터 그리기 (그라데이션 효과)
      // 외곽 글로우
      graphics
        .circle(cluster.x, cluster.y, radius * 1.3)
        .fill({ color, alpha: alpha * 0.3 });

      // 메인 원
      graphics
        .circle(cluster.x, cluster.y, radius)
        .fill({ color, alpha });

      // 중심 하이라이트 (개체가 많을수록 밝게)
      if (cluster.count > 10) {
        graphics
          .circle(cluster.x, cluster.y, radius * 0.4)
          .fill({ color: 0xffffff, alpha: 0.2 + sizeRatio * 0.3 });
      }
    }
  }

  /**
   * HSL to Hex 변환
   */
  private hslToHex(h: number, s: number, l: number): number {
    const hue = h / 360;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, hue + 1 / 3);
      g = hue2rgb(p, q, hue);
      b = hue2rgb(p, q, hue - 1 / 3);
    }

    return (
      (Math.round(r * 255) << 16) |
      (Math.round(g * 255) << 8) |
      Math.round(b * 255)
    );
  }

  /**
   * 클러스터 수 반환 (디버깅용)
   */
  getClusterCount(): number {
    return this.clusters.size;
  }

  /**
   * 설정 변경
   */
  setConfig(config: Partial<ClusterRendererConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
