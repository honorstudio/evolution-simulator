/**
 * ProceduralBodyGenerator.ts
 * 유전자 기반 프로시저럴 외형 생성
 */

import * as PIXI from 'pixi.js';
import type { AppearanceGenome, AppendageGene } from './AppearanceGenome';
import { colorGeneToHex, clamp } from './utils';

/**
 * 생성된 외형 데이터
 */
export interface GeneratedBody {
  /** 메인 그래픽스 객체 */
  graphics: PIXI.Graphics;
  /** 바운딩 박스 크기 */
  bounds: { width: number; height: number };
  /** 시각적 복잡도 (0~1) */
  complexity: number;
}

/**
 * 프로시저럴 외형 생성기
 */
export class ProceduralBodyGenerator {
  /**
   * 외형 유전자로부터 PixiJS 그래픽스 생성
   * @param genome 외형 유전자
   * @param size 기본 크기
   * @returns 생성된 외형 데이터
   */
  generateBody(genome: AppearanceGenome, size: number = 10): GeneratedBody {
    const graphics = new PIXI.Graphics();

    // 1. 기본 몸체 생성
    this.renderBodyShape(graphics, genome, size);

    // 2. 패턴 적용
    this.applyPattern(graphics, genome, size);

    // 3. 부속물 추가
    for (const appendage of genome.appendages) {
      this.renderAppendage(graphics, appendage, genome, size);
    }

    // 4. 텍스처 효과 (선택적)
    this.applyTextureEffect(graphics, genome, size);

    // 5. 투명도 적용
    graphics.alpha = 1 - genome.transparency;

    // 복잡도 계산
    const complexity = this.calculateComplexity(genome);

    // 바운딩 박스
    const bounds = graphics.getBounds();

    return {
      graphics,
      bounds: { width: bounds.width, height: bounds.height },
      complexity,
    };
  }

  /**
   * 기본 몸체 형태 렌더링
   */
  private renderBodyShape(graphics: PIXI.Graphics, genome: AppearanceGenome, size: number): void {
    const color = colorGeneToHex(genome.primaryColor);
    const { bodyShape, segments, symmetry } = genome;

    switch (bodyShape.type) {
      case 'spherical':
        this.drawSpherical(graphics, color, size, segments);
        break;

      case 'elongated':
        this.drawElongated(graphics, color, size, bodyShape.aspectRatio, bodyShape.curvature);
        break;

      case 'flat':
        this.drawFlat(graphics, color, size, bodyShape.aspectRatio);
        break;

      case 'branching':
        this.drawBranching(graphics, color, size, segments);
        break;

      case 'blob':
      default:
        this.drawBlob(graphics, color, size, bodyShape.curvature, symmetry);
        break;
    }
  }

  /**
   * 구형 몸체
   */
  private drawSpherical(graphics: PIXI.Graphics, color: number, size: number, segments: number): void {
    if (segments === 1) {
      // 단순 원
      graphics.circle(0, 0, size);
      graphics.fill(color);
    } else {
      // 분절된 구
      for (let i = 0; i < segments; i++) {
        const segmentSize = size * (1 - i * 0.15);
        graphics.circle(0, 0, segmentSize);
        graphics.fill(color);
      }
    }
  }

  /**
   * 길쭉한 몸체
   */
  private drawElongated(
    graphics: PIXI.Graphics,
    color: number,
    size: number,
    aspectRatio: number,
    curvature: number
  ): void {
    const width = size;
    const height = size * aspectRatio;

    // Bezier 곡선으로 유기적 형태
    const curve = curvature * size * 0.3;

    graphics.moveTo(0, -height / 2);
    graphics.bezierCurveTo(
      width / 2 + curve, -height / 4,
      width / 2 + curve, height / 4,
      0, height / 2
    );
    graphics.bezierCurveTo(
      -width / 2 - curve, height / 4,
      -width / 2 - curve, -height / 4,
      0, -height / 2
    );
    graphics.fill(color);
  }

  /**
   * 납작한 몸체
   */
  private drawFlat(graphics: PIXI.Graphics, color: number, size: number, aspectRatio: number): void {
    const width = size * aspectRatio;
    const height = size * 0.5;

    graphics.ellipse(0, 0, width, height);
    graphics.fill(color);
  }

  /**
   * 가지 형태
   */
  private drawBranching(graphics: PIXI.Graphics, color: number, size: number, branches: number): void {
    // 중심 몸체
    graphics.circle(0, 0, size * 0.6);
    graphics.fill(color);

    // 가지들
    const angleStep = (Math.PI * 2) / branches;
    for (let i = 0; i < branches; i++) {
      const angle = angleStep * i;
      const endX = Math.cos(angle) * size;
      const endY = Math.sin(angle) * size;

      graphics.moveTo(0, 0);
      graphics.lineTo(endX, endY);
      graphics.stroke({ width: size * 0.3, color });
    }
  }

  /**
   * 불규칙한 덩어리 형태
   */
  private drawBlob(
    graphics: PIXI.Graphics,
    color: number,
    size: number,
    curvature: number,
    symmetry: AppearanceGenome['symmetry']
  ): void {
    const points = symmetry === 'radial' ? 8 : symmetry === 'bilateral' ? 6 : 5;
    const angleStep = (Math.PI * 2) / points;

    const radii: number[] = [];
    for (let i = 0; i < points; i++) {
      if (symmetry === 'bilateral' && i >= points / 2) {
        // 좌우 대칭
        radii.push(radii[points - 1 - i] ?? size);
      } else {
        // 랜덤 반지름 (시드 기반으로 일관성 유지)
        const variation = 1 - curvature * 0.5;
        radii.push(size * (variation + Math.sin(i * 1.7) * curvature * 0.5));
      }
    }

    // 부드러운 곡선으로 연결
    graphics.moveTo(radii[0] ?? size, 0);

    for (let i = 0; i < points; i++) {
      const nextI = (i + 1) % points;
      const angle1 = angleStep * i;
      const angle2 = angleStep * nextI;
      const radiusI = radii[i] ?? size;
      const radiusNextI = radii[nextI] ?? size;

      const x2 = Math.cos(angle2) * radiusNextI;
      const y2 = Math.sin(angle2) * radiusNextI;

      // 제어점 계산
      const midAngle = (angle1 + angle2) / 2;
      const cpDist = (radiusI + radiusNextI) / 2;
      const cpX = Math.cos(midAngle) * cpDist;
      const cpY = Math.sin(midAngle) * cpDist;

      graphics.quadraticCurveTo(cpX, cpY, x2, y2);
    }

    graphics.fill(color);
  }

  /**
   * 패턴 적용
   */
  private applyPattern(graphics: PIXI.Graphics, genome: AppearanceGenome, size: number): void {
    const { pattern, secondaryColor } = genome;
    const color2 = colorGeneToHex(secondaryColor);

    switch (pattern.type) {
      case 'stripes':
        this.drawStripes(graphics, color2, size, pattern.scale, pattern.direction, pattern.contrast);
        break;

      case 'spots':
        this.drawSpots(graphics, color2, size, pattern.scale, pattern.contrast);
        break;

      case 'gradient':
        // 그래디언트는 fill로 처리하기 어려우므로 생략 (또는 별도 구현 필요)
        break;

      case 'patches':
        this.drawPatches(graphics, color2, size, pattern.scale);
        break;

      case 'solid':
      default:
        // 패턴 없음
        break;
    }
  }

  /**
   * 줄무늬 패턴
   */
  private drawStripes(
    graphics: PIXI.Graphics,
    color: number,
    size: number,
    scale: number,
    direction: number,
    contrast: number
  ): void {
    const stripeWidth = size * scale * 0.3;
    const count = Math.floor(size / stripeWidth) + 2;

    graphics.alpha = contrast * 0.7;

    for (let i = -count; i < count; i++) {
      const offset = i * stripeWidth * 2;
      const rad = (direction * Math.PI) / 180;

      const dx = Math.cos(rad);
      const dy = Math.sin(rad);

      graphics.rect(
        offset * dx - size * dy,
        offset * dy + size * dx,
        stripeWidth,
        size * 4
      );
    }
    graphics.fill(color);
    graphics.alpha = 1;
  }

  /**
   * 점무늬 패턴
   */
  private drawSpots(graphics: PIXI.Graphics, color: number, size: number, scale: number, contrast: number): void {
    const spotSize = size * scale * 0.3;
    const count = Math.floor(size / spotSize);

    graphics.alpha = contrast * 0.8;

    for (let x = -count; x <= count; x++) {
      for (let y = -count; y <= count; y++) {
        const spotX = x * spotSize * 1.5 + (y % 2) * spotSize * 0.75;
        const spotY = y * spotSize * 1.5;

        if (Math.sqrt(spotX * spotX + spotY * spotY) < size) {
          graphics.circle(spotX, spotY, spotSize);
          graphics.fill(color);
        }
      }
    }

    graphics.alpha = 1;
  }

  /**
   * 패치 패턴
   */
  private drawPatches(graphics: PIXI.Graphics, color: number, size: number, scale: number): void {
    const patchCount = Math.floor(3 + scale * 3);

    for (let i = 0; i < patchCount; i++) {
      const angle = (i / patchCount) * Math.PI * 2;
      const dist = size * (0.3 + Math.sin(i * 2.3) * 0.4);
      const patchSize = size * scale * (0.2 + Math.cos(i * 1.7) * 0.1);

      graphics.circle(Math.cos(angle) * dist, Math.sin(angle) * dist, patchSize);
      graphics.fill(color);
    }
  }

  /**
   * 부속물 렌더링
   */
  private renderAppendage(
    graphics: PIXI.Graphics,
    appendage: AppendageGene,
    genome: AppearanceGenome,
    bodySize: number
  ): void {
    const color = colorGeneToHex(genome.primaryColor);
    const angleStep = (Math.PI * 2) / appendage.count;

    for (let i = 0; i < appendage.count; i++) {
      const angle = angleStep * i;
      const startDist = bodySize * (0.5 + appendage.position * 0.5);
      const startX = Math.cos(angle) * startDist;
      const startY = Math.sin(angle) * startDist;

      this.drawSingleAppendage(
        graphics,
        appendage,
        startX,
        startY,
        angle,
        bodySize,
        color
      );
    }
  }

  /**
   * 단일 부속물 그리기
   */
  private drawSingleAppendage(
    graphics: PIXI.Graphics,
    appendage: AppendageGene,
    startX: number,
    startY: number,
    angle: number,
    bodySize: number,
    color: number
  ): void {
    const length = bodySize * appendage.length;
    const thickness = bodySize * appendage.thickness * 0.5;

    if (appendage.joints === 0) {
      // 관절 없음 - 단순 선
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;

      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);
      graphics.stroke({ width: thickness, color });
    } else {
      // 관절 있음 - 분절된 형태
      let currentX = startX;
      let currentY = startY;
      let currentAngle = angle;
      const segmentLength = length / (appendage.joints + 1);

      for (let j = 0; j <= appendage.joints; j++) {
        currentAngle += appendage.curvature * 0.3;
        const nextX = currentX + Math.cos(currentAngle) * segmentLength;
        const nextY = currentY + Math.sin(currentAngle) * segmentLength;

        graphics.moveTo(currentX, currentY);
        graphics.lineTo(nextX, nextY);
        graphics.stroke({ width: thickness * (1 - j * 0.15), color });

        currentX = nextX;
        currentY = nextY;
      }
    }
  }

  /**
   * 텍스처 효과 (간단한 외곽선/디테일 추가)
   */
  private applyTextureEffect(graphics: PIXI.Graphics, genome: AppearanceGenome, size: number): void {
    // 간단한 외곽선 효과만 구현 (실제 텍스처는 셰이더 필요)
    if (genome.texture.type === 'rough' || genome.texture.type === 'scaly') {
      const color = colorGeneToHex(genome.primaryColor);
      graphics.circle(0, 0, size);
      graphics.stroke({ width: 1, color: color, alpha: 0.3 });
    }
  }

  /**
   * 복잡도 계산
   */
  private calculateComplexity(genome: AppearanceGenome): number {
    let complexity = 0;

    // 몸체 형태 복잡도
    const shapeComplexity: Record<string, number> = {
      spherical: 0.1,
      blob: 0.3,
      flat: 0.2,
      elongated: 0.4,
      branching: 0.6,
    };
    complexity += shapeComplexity[genome.bodyShape.type] ?? 0.3;

    // 분절 복잡도
    complexity += genome.segments * 0.05;

    // 패턴 복잡도
    const patternComplexity: Record<string, number> = {
      solid: 0,
      gradient: 0.1,
      stripes: 0.2,
      spots: 0.3,
      patches: 0.25,
    };
    complexity += patternComplexity[genome.pattern.type] ?? 0;

    // 부속물 복잡도
    complexity += genome.appendages.length * 0.15;
    genome.appendages.forEach(a => {
      complexity += a.joints * 0.05;
    });

    return clamp(complexity, 0, 1);
  }
}
