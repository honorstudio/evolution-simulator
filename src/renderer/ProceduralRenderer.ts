/**
 * 프로시저럴 외형 렌더러
 * 유전자 기반으로 생명체의 외형을 동적으로 생성
 */
import { Graphics, Container, BlurFilter } from 'pixi.js';
import { Genome, AppearanceGene, BodyShape, PatternType } from '../organism/Genome';

/**
 * HSL to RGB 변환
 */
function hslToRgb(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return ((Math.round((r + m) * 255) << 16) +
          (Math.round((g + m) * 255) << 8) +
          Math.round((b + m) * 255));
}

/**
 * 프로시저럴 생명체 그래픽 생성
 */
export class ProceduralRenderer {
  /**
   * 생명체 그래픽 생성
   */
  static createOrganismGraphic(
    genome: Genome,
    baseRadius: number,
    energyRatio: number = 1.0
  ): Container {
    const container = new Container();
    const appearance = genome.appearance;

    // 크기 계산
    const radius = baseRadius * genome.size;

    // 기본 색상
    const primaryColor = hslToRgb(genome.hue, genome.saturation, genome.lightness);
    const secondaryColor = hslToRgb(
      appearance.secondaryHue,
      appearance.secondarySaturation,
      appearance.secondaryLightness
    );

    // 외곽선 그래픽 (있는 경우)
    if (appearance.outline > 0) {
      const outlineGraphics = new Graphics();
      this.drawBody(outlineGraphics, appearance.bodyShape, radius + appearance.outline, 0x000000, 1);
      container.addChild(outlineGraphics);
    }

    // 메인 바디 그래픽
    const bodyGraphics = new Graphics();

    // 패턴에 따른 렌더링
    this.drawBodyWithPattern(
      bodyGraphics,
      appearance,
      radius,
      primaryColor,
      secondaryColor,
      1 - appearance.transparency
    );
    container.addChild(bodyGraphics);

    // 부속물 추가
    if (appearance.spikes > 0) {
      const spikesGraphics = this.createSpikes(appearance, radius, primaryColor);
      container.addChild(spikesGraphics);
    }

    if (appearance.tailLength > 0) {
      const tailGraphics = this.createTail(appearance, radius, primaryColor);
      container.addChild(tailGraphics);
    }

    if (appearance.flagella > 0) {
      const flagellaGraphics = this.createFlagella(appearance, radius, primaryColor);
      container.addChild(flagellaGraphics);
    }

    // 발광 효과
    if (appearance.glow > 0) {
      const glowFilter = new BlurFilter();
      glowFilter.blur = 5 * appearance.glow;
      container.filters = [glowFilter];
    }

    // 에너지에 따른 투명도 조절
    container.alpha = 0.5 + energyRatio * 0.5;

    return container;
  }

  /**
   * 기본 몸체 그리기 (PixiJS v8: 도형 먼저, fill 나중)
   */
  private static drawBody(
    graphics: Graphics,
    shape: BodyShape,
    radius: number,
    color: number,
    alpha: number
  ): void {
    // 도형을 먼저 그리기
    switch (shape) {
      case 'circle':
        graphics.circle(0, 0, radius);
        break;

      case 'oval':
        graphics.ellipse(0, 0, radius * 1.3, radius * 0.8);
        break;

      case 'blob':
        this.drawBlob(graphics, radius);
        break;

      case 'star':
        this.drawStar(graphics, radius, 5);
        break;

      case 'triangle':
        this.drawPolygon(graphics, radius, 3);
        break;

      case 'diamond':
        this.drawPolygon(graphics, radius, 4, Math.PI / 4);
        break;

      case 'crescent':
        // 초승달은 별도 처리 (두 개의 원)
        graphics.circle(0, 0, radius);
        graphics.fill({ color, alpha });
        // 잘라낼 부분을 어두운 색으로 덮기
        graphics.circle(radius * 0.4, 0, radius * 0.7);
        graphics.fill({ color: 0x111111, alpha: 0.9 });
        return; // 여기서 종료

      default:
        graphics.circle(0, 0, radius);
    }

    // 도형을 그린 후 fill (한 번만)
    graphics.fill({ color, alpha });
  }

  /**
   * 패턴이 적용된 몸체 그리기
   */
  private static drawBodyWithPattern(
    graphics: Graphics,
    appearance: AppearanceGene,
    radius: number,
    primaryColor: number,
    secondaryColor: number,
    alpha: number
  ): void {
    // 기본 몸체
    this.drawBody(graphics, appearance.bodyShape, radius, primaryColor, alpha);

    // 패턴 오버레이
    if (appearance.pattern !== 'solid' && appearance.patternIntensity > 0) {
      this.drawPattern(
        graphics,
        appearance.pattern,
        appearance.bodyShape,
        radius,
        secondaryColor,
        alpha * appearance.patternIntensity,
        appearance.patternScale
      );
    }
  }

  /**
   * 패턴 그리기
   */
  private static drawPattern(
    graphics: Graphics,
    pattern: PatternType,
    _shape: BodyShape,
    radius: number,
    color: number,
    alpha: number,
    scale: number
  ): void {
    switch (pattern) {
      case 'stripes':
        this.drawStripes(graphics, radius, color, alpha, scale);
        break;

      case 'spots':
        this.drawSpots(graphics, radius, color, alpha, scale);
        break;

      case 'gradient':
        // 그라데이션은 단순 색상 오버레이로 대체
        graphics.circle(0, -radius * 0.3, radius * 0.7);
        graphics.fill({ color, alpha: alpha * 0.3 });
        break;

      case 'rings':
        this.drawRings(graphics, radius, color, alpha, scale);
        break;

      case 'patches':
        this.drawPatches(graphics, radius, color, alpha, scale);
        break;
    }
  }

  /**
   * 불규칙한 덩어리 형태
   */
  private static drawBlob(graphics: Graphics, radius: number): void {
    const points: number[] = [];
    const numPoints = 8;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.8 + Math.sin(angle * 3) * 0.2 + Math.cos(angle * 2) * 0.1);
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    graphics.poly(points);
  }

  /**
   * 별 모양
   */
  private static drawStar(graphics: Graphics, radius: number, points: number): void {
    const coords: number[] = [];
    const innerRadius = radius * 0.5;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? radius : innerRadius;
      coords.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    graphics.poly(coords);
  }

  /**
   * 정다각형
   */
  private static drawPolygon(graphics: Graphics, radius: number, sides: number, rotation: number = 0): void {
    const coords: number[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2 + rotation;
      coords.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }

    graphics.poly(coords);
  }


  /**
   * 줄무늬 패턴 (PixiJS v8: 모든 도형 그린 후 fill 한 번)
   */
  private static drawStripes(
    graphics: Graphics,
    radius: number,
    color: number,
    alpha: number,
    scale: number
  ): void {
    const stripeWidth = radius * 0.15 * scale;
    const stripeCount = Math.floor(radius * 2 / (stripeWidth * 2));

    // 모든 줄무늬를 먼저 그리기
    for (let i = -stripeCount; i <= stripeCount; i += 2) {
      const x = i * stripeWidth;
      graphics.rect(x - stripeWidth / 2, -radius, stripeWidth, radius * 2);
    }
    // 마지막에 fill 한 번만
    graphics.fill({ color, alpha });
  }

  /**
   * 점박이 패턴
   */
  private static drawSpots(
    graphics: Graphics,
    radius: number,
    color: number,
    alpha: number,
    scale: number
  ): void {
    const spotRadius = radius * 0.12 * scale;
    const spots = [
      { x: 0, y: -radius * 0.4 },
      { x: radius * 0.4, y: 0 },
      { x: -radius * 0.4, y: 0 },
      { x: radius * 0.25, y: radius * 0.35 },
      { x: -radius * 0.25, y: radius * 0.35 },
      { x: radius * 0.25, y: -radius * 0.35 },
      { x: -radius * 0.25, y: -radius * 0.35 },
    ];

    graphics.fill({ color, alpha });
    for (const spot of spots) {
      graphics.circle(spot.x, spot.y, spotRadius);
    }
    graphics.fill();
  }

  /**
   * 동심원 패턴
   */
  private static drawRings(
    graphics: Graphics,
    radius: number,
    color: number,
    alpha: number,
    scale: number
  ): void {
    const ringCount = Math.floor(3 * scale);

    for (let i = 1; i <= ringCount; i++) {
      const r = radius * (i / (ringCount + 1));
      graphics.stroke({ color, alpha, width: 2 });
      graphics.circle(0, 0, r);
      graphics.stroke();
    }
  }

  /**
   * 얼룩 패턴
   */
  private static drawPatches(
    graphics: Graphics,
    radius: number,
    color: number,
    alpha: number,
    scale: number
  ): void {
    const patchRadius = radius * 0.25 * scale;
    const patches = [
      { x: radius * 0.3, y: -radius * 0.2 },
      { x: -radius * 0.35, y: radius * 0.15 },
      { x: radius * 0.1, y: radius * 0.4 },
    ];

    graphics.fill({ color, alpha });
    for (const patch of patches) {
      graphics.ellipse(patch.x, patch.y, patchRadius * 1.2, patchRadius * 0.8);
    }
    graphics.fill();
  }

  /**
   * 돌기/가시 생성
   */
  private static createSpikes(
    appearance: AppearanceGene,
    radius: number,
    color: number
  ): Graphics {
    const graphics = new Graphics();
    const spikeCount = appearance.spikes;
    const spikeLength = radius * appearance.spikeLength;

    graphics.fill({ color, alpha: 0.9 });

    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2;
      const baseX = Math.cos(angle) * radius;
      const baseY = Math.sin(angle) * radius;
      const tipX = Math.cos(angle) * (radius + spikeLength);
      const tipY = Math.sin(angle) * (radius + spikeLength);

      // 삼각형 돌기
      const perpAngle = angle + Math.PI / 2;
      const baseWidth = radius * 0.15;

      graphics.poly([
        baseX + Math.cos(perpAngle) * baseWidth,
        baseY + Math.sin(perpAngle) * baseWidth,
        tipX, tipY,
        baseX - Math.cos(perpAngle) * baseWidth,
        baseY - Math.sin(perpAngle) * baseWidth,
      ]);
    }

    graphics.fill();
    return graphics;
  }

  /**
   * 꼬리 생성
   */
  private static createTail(
    appearance: AppearanceGene,
    radius: number,
    color: number
  ): Graphics {
    const graphics = new Graphics();
    const tailLength = radius * appearance.tailLength * 2;

    graphics.stroke({ color, alpha: 0.8, width: radius * 0.2 });

    // 물결 모양 꼬리
    graphics.moveTo(0, radius * 0.8);
    graphics.bezierCurveTo(
      radius * 0.5, radius + tailLength * 0.3,
      -radius * 0.5, radius + tailLength * 0.7,
      0, radius + tailLength
    );

    graphics.stroke();
    return graphics;
  }

  /**
   * 편모 생성
   */
  private static createFlagella(
    appearance: AppearanceGene,
    radius: number,
    color: number
  ): Graphics {
    const graphics = new Graphics();
    const flagellaCount = appearance.flagella;
    const flagellaLength = radius * 1.5;

    graphics.stroke({ color, alpha: 0.6, width: 2 });

    for (let i = 0; i < flagellaCount; i++) {
      const angle = Math.PI + (i - (flagellaCount - 1) / 2) * 0.3;
      const startX = Math.cos(angle) * radius * 0.8;
      const startY = Math.sin(angle) * radius * 0.8;

      // 물결 모양 편모
      graphics.moveTo(startX, startY);

      const endX = startX + Math.cos(angle) * flagellaLength;
      const endY = startY + Math.sin(angle) * flagellaLength;
      const midX = (startX + endX) / 2 + Math.cos(angle + Math.PI / 2) * radius * 0.3;
      const midY = (startY + endY) / 2 + Math.sin(angle + Math.PI / 2) * radius * 0.3;

      graphics.quadraticCurveTo(midX, midY, endX, endY);
    }

    graphics.stroke();
    return graphics;
  }

  /**
   * 간단한 원형 (LOD용)
   */
  static createSimpleCircle(
    genome: Genome,
    baseRadius: number,
    energyRatio: number = 1.0
  ): Graphics {
    const graphics = new Graphics();
    const radius = baseRadius * genome.size;
    const color = hslToRgb(genome.hue, genome.saturation, genome.lightness);
    const alpha = 0.5 + energyRatio * 0.5;

    graphics.fill({ color, alpha });
    graphics.circle(0, 0, radius);
    graphics.fill();

    // 외곽선
    if (genome.appearance.outline > 0) {
      graphics.stroke({ color: 0x000000, alpha: 0.5, width: 1 });
      graphics.circle(0, 0, radius);
      graphics.stroke();
    }

    return graphics;
  }

  /**
   * 점 (대륙 뷰 LOD용)
   */
  static createDot(genome: Genome): Graphics {
    const graphics = new Graphics();
    const color = hslToRgb(genome.hue, genome.saturation, genome.lightness);

    graphics.fill({ color, alpha: 0.8 });
    graphics.circle(0, 0, 2);
    graphics.fill();

    return graphics;
  }
}
