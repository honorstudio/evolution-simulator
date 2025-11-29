import { Container, Graphics } from 'pixi.js';
import { Organism } from '../organism/Organism';
import { ProceduralRenderer } from './ProceduralRenderer';
import { hslToHex } from './colors';
import { LODLevel, getLODLevel, type LODLevelType } from './LODSystem';
import { ClusterRenderer } from './ClusterRenderer';

/**
 * 생명체 렌더러
 * 프로시저럴 외형 생성 및 4단계 LOD 시스템을 지원합니다.
 *
 * LOD 레벨:
 * - DOT (0): 점 (zoom < 0.01) - 대륙 뷰
 * - SIMPLE (1): 단순 원 (zoom 0.01 ~ 0.1) - 지역 뷰
 * - MEDIUM (2): 기본 형태 + 색상 (zoom 0.1 ~ 0.5) - 마을 뷰
 * - DETAILED (3): 전체 디테일 (zoom >= 0.5) - 개체 뷰
 */
export class OrganismRenderer {
  private container: Container;
  private dotGraphics: Graphics;       // LOD_DOT용 그래픽 (클러스터 렌더링)
  private simpleGraphics: Graphics;    // LOD_SIMPLE용 그래픽
  private mediumGraphics: Graphics;    // LOD_MEDIUM용 그래픽
  private detailedContainer: Container; // LOD_DETAILED용 컨테이너

  private currentLOD: LODLevelType = LODLevel.DETAILED;
  private organismSprites: Map<string, Container> = new Map();

  // 클러스터 렌더러 (LOD_DOT 레벨에서 사용)
  private clusterRenderer: ClusterRenderer;

  // 기본 반경 (유전자 size = 1.0 기준)
  private readonly BASE_RADIUS = 10;

  // 하이라이트된 개체 ID
  private highlightedOrganismId: string | null = null;
  private highlightGraphics: Graphics;

  // 현재 줌 레벨 (하이라이트 크기 조절용)
  private currentZoom: number = 1;

  constructor() {
    this.container = new Container();

    // 각 LOD 레벨용 컨테이너/그래픽
    this.dotGraphics = new Graphics();
    this.simpleGraphics = new Graphics();
    this.mediumGraphics = new Graphics();
    this.detailedContainer = new Container();
    this.highlightGraphics = new Graphics();

    // 클러스터 렌더러 초기화
    this.clusterRenderer = new ClusterRenderer({
      cellSize: 100,    // 100픽셀 단위로 클러스터링
      minRadius: 5,
      maxRadius: 30,
      maxCount: 50,
    });

    this.container.addChild(this.dotGraphics);
    this.container.addChild(this.simpleGraphics);
    this.container.addChild(this.mediumGraphics);
    this.container.addChild(this.detailedContainer);
    this.container.addChild(this.highlightGraphics);
  }

  /**
   * 컨테이너 반환
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * 줌 레벨에 따른 LOD 업데이트
   * LODSystem.ts의 표준화된 임계값을 사용
   */
  updateLOD(zoom: number): void {
    this.currentLOD = getLODLevel(zoom);
    this.currentZoom = zoom;

    // 클러스터 렌더러에 줌 레벨 전달
    this.clusterRenderer.setZoom(zoom);

    // LOD에 따라 컨테이너 표시/숨김
    this.dotGraphics.visible = this.currentLOD === LODLevel.DOT;
    this.simpleGraphics.visible = this.currentLOD === LODLevel.SIMPLE;
    this.mediumGraphics.visible = this.currentLOD === LODLevel.MEDIUM;
    this.detailedContainer.visible = this.currentLOD === LODLevel.DETAILED;
  }

  /**
   * 모든 생명체 렌더링
   *
   * 성능 최적화: 개체 수가 많을 때 클러스터 렌더링 사용
   * - DETAILED(확대) 모드: 항상 기존 렌더링 (개별 생명체 표시)
   * - DOT/SIMPLE/MEDIUM(축소) 모드: 100개 이상이면 클러스터 렌더링
   */
  render(organisms: Organism[]): void {
    // DETAILED 모드(확대)에서는 항상 기존 렌더링 사용
    const isDetailedMode = this.currentLOD === LODLevel.DETAILED;

    // 축소 상태(DOT/SIMPLE/MEDIUM)에서 개체 수가 많으면 클러스터 렌더링
    const useCluster = !isDetailedMode && organisms.length > 100;

    if (useCluster) {
      // 클러스터 모드: 모든 그래픽을 지움
      this.dotGraphics.clear();
      this.simpleGraphics.clear();
      this.mediumGraphics.clear();

      // DETAILED 모드 스프라이트 숨김
      this.detailedContainer.visible = false;
      this.dotGraphics.visible = true;

      // 클러스터 렌더링
      this.clusterRenderer.computeClusters(organisms);
      this.clusterRenderer.render(this.dotGraphics);
      return;
    }

    // LOD 컨테이너 가시성 복원
    this.dotGraphics.visible = this.currentLOD === LODLevel.DOT;
    this.simpleGraphics.visible = this.currentLOD === LODLevel.SIMPLE;
    this.mediumGraphics.visible = this.currentLOD === LODLevel.MEDIUM;
    this.detailedContainer.visible = this.currentLOD === LODLevel.DETAILED;

    switch (this.currentLOD) {
      case LODLevel.DOT:
        this.renderDot(organisms);
        break;
      case LODLevel.SIMPLE:
        this.renderSimple(organisms);
        break;
      case LODLevel.MEDIUM:
        this.renderMedium(organisms);
        break;
      case LODLevel.DETAILED:
        this.renderDetailed(organisms);
        break;
    }

    // 하이라이트 렌더링 (항상 실행)
    this.renderHighlight(organisms);
  }

  /**
   * DOT 레벨 렌더링 (매우 낮은 줌) - 클러스터 렌더링 사용
   *
   * 개별 점 대신 인접한 개체들을 묶어서 "덩어리"로 표시합니다.
   * 1,000개 개체 → 약 50~100개 클러스터로 축소하여 성능 향상
   */
  private renderDot(organisms: Organism[]): void {
    // 클러스터 계산
    this.clusterRenderer.computeClusters(organisms);

    // 클러스터 렌더링
    this.clusterRenderer.render(this.dotGraphics);
  }

  /**
   * SIMPLE 레벨 렌더링 (낮은 줌)
   */
  private renderSimple(organisms: Organism[]): void {
    this.simpleGraphics.clear();

    for (const organism of organisms) {
      if (!organism.isAlive) continue;
      this.drawSimpleOrganism(organism);
    }
  }

  /**
   * 간단한 원형으로 렌더링
   */
  private drawSimpleOrganism(organism: Organism): void {
    const radius = this.BASE_RADIUS * organism.genome.size;
    const x = organism.x;
    const y = organism.y;

    const color = hslToHex(
      organism.genome.hue,
      organism.genome.saturation,
      organism.genome.lightness
    );

    const energyRatio = organism.energy / organism.maxEnergy;
    const alpha = 0.5 + energyRatio * 0.5;

    // 메인 바디
    this.simpleGraphics
      .circle(x, y, radius)
      .fill({ color, alpha });
  }

  /**
   * MEDIUM 레벨 렌더링 (중간 줌)
   * 기본 형태와 색상, 방향 표시
   */
  private renderMedium(organisms: Organism[]): void {
    this.mediumGraphics.clear();

    for (const organism of organisms) {
      if (!organism.isAlive) continue;
      this.drawMediumOrganism(organism);
    }
  }

  /**
   * MEDIUM 레벨 생명체 그리기
   * 형태, 색상, 방향, 에너지 상태 표시
   */
  private drawMediumOrganism(organism: Organism): void {
    const radius = this.BASE_RADIUS * organism.genome.size;
    const x = organism.x;
    const y = organism.y;

    const color = hslToHex(
      organism.genome.hue,
      organism.genome.saturation,
      organism.genome.lightness
    );

    const energyRatio = organism.energy / organism.maxEnergy;
    const alpha = 0.5 + energyRatio * 0.5;

    // 외곽선 (외형 유전자에 따라)
    if (organism.genome.appearance?.outline > 0) {
      this.mediumGraphics
        .circle(x, y, radius + 1)
        .stroke({ width: 1, color: 0x000000, alpha: 0.5 });
    }

    // bodyShape에 따라 다른 형태 렌더링
    const bodyShape = organism.genome.appearance?.bodyShape || 'circle';

    switch (bodyShape) {
      case 'blob':
        this.drawBlobShape(this.mediumGraphics, x, y, radius, color, alpha);
        break;
      case 'oval':
        this.mediumGraphics
          .ellipse(x, y, radius * 1.3, radius * 0.8)
          .fill({ color, alpha });
        break;
      default:
        this.mediumGraphics
          .circle(x, y, radius)
          .fill({ color, alpha });
    }

    // 에너지 낮으면 경고 표시
    if (energyRatio < 0.3) {
      this.mediumGraphics
        .circle(x, y, radius + 2)
        .stroke({ width: 1, color: 0xff0000, alpha: 0.5 });
    }

    // 방향 표시
    const dirX = x + Math.cos(organism.angle) * radius * 1.2;
    const dirY = y + Math.sin(organism.angle) * radius * 1.2;
    this.mediumGraphics
      .moveTo(x, y)
      .lineTo(dirX, dirY)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
  }

  /**
   * Blob 형태 그리기 (유기적인 형태)
   */
  private drawBlobShape(
    graphics: Graphics,
    x: number,
    y: number,
    radius: number,
    color: number,
    alpha: number
  ): void {
    const points: number[] = [];
    const numPoints = 8;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.8 + Math.sin(angle * 3) * 0.2 + Math.cos(angle * 2) * 0.1);
      points.push(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }

    graphics.poly(points).fill({ color, alpha });
  }

  /**
   * DETAILED 레벨 렌더링 (높은 줌)
   */
  private renderDetailed(organisms: Organism[]): void {
    // 현재 화면에 있는 생명체 ID 추적
    const activeIds = new Set<string>();

    for (const organism of organisms) {
      if (!organism.isAlive) continue;
      activeIds.add(organism.id);

      // 스프라이트가 없으면 생성
      if (!this.organismSprites.has(organism.id)) {
        this.createOrganismSprite(organism);
      }

      // 스프라이트 위치 업데이트
      const sprite = this.organismSprites.get(organism.id)!;
      sprite.x = organism.x;
      sprite.y = organism.y;
      sprite.rotation = organism.angle;

      // 에너지에 따른 투명도
      const energyRatio = organism.energy / organism.maxEnergy;
      sprite.alpha = 0.5 + energyRatio * 0.5;
    }

    // 죽은 생명체의 스프라이트 제거
    for (const [id, sprite] of this.organismSprites) {
      if (!activeIds.has(id)) {
        this.detailedContainer.removeChild(sprite);
        sprite.destroy({ children: true });
        this.organismSprites.delete(id);
      }
    }
  }

  /**
   * 프로시저럴 외형 스프라이트 생성
   */
  private createOrganismSprite(organism: Organism): void {
    const energyRatio = organism.energy / organism.maxEnergy;

    // 외형 유전자가 있으면 프로시저럴, 없으면 간단한 원
    let sprite: Container | Graphics;

    if (organism.genome.appearance) {
      sprite = ProceduralRenderer.createOrganismGraphic(
        organism.genome,
        this.BASE_RADIUS,
        energyRatio
      );
    } else {
      sprite = ProceduralRenderer.createSimpleCircle(
        organism.genome,
        this.BASE_RADIUS,
        energyRatio
      );
    }

    // 방향 표시 추가
    const dirIndicator = new Graphics();
    const radius = this.BASE_RADIUS * organism.genome.size;
    dirIndicator
      .moveTo(0, 0)
      .lineTo(radius * 1.3, 0)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    sprite.addChild(dirIndicator);

    sprite.x = organism.x;
    sprite.y = organism.y;
    sprite.rotation = organism.angle;

    this.detailedContainer.addChild(sprite);
    this.organismSprites.set(organism.id, sprite);
  }

  /**
   * 하이라이트할 개체 설정
   */
  setHighlightedOrganism(organismId: string | null): void {
    this.highlightedOrganismId = organismId;
  }

  /**
   * 하이라이트 렌더링 (선택된 개체에 글로우 효과)
   * 줌 레벨에 관계없이 항상 화면에서 보이도록 크기를 조절합니다
   */
  renderHighlight(organisms: Organism[]): void {
    this.highlightGraphics.clear();

    if (!this.highlightedOrganismId) return;

    const organism = organisms.find(o => o.id === this.highlightedOrganismId);
    if (!organism || !organism.isAlive) return;

    const baseRadius = this.BASE_RADIUS * organism.genome.size;
    const x = organism.x;
    const y = organism.y;

    // 줌 레벨에 따라 하이라이트 크기를 반비례로 조절
    // 줌이 작아질수록 (멀리 볼수록) 하이라이트가 더 크게 보이도록
    // 최소 크기 보장: 화면에서 최소 30픽셀로 보이도록
    const minScreenRadius = 30 / this.currentZoom;
    const highlightRadius = Math.max(baseRadius, minScreenRadius);

    // 선 두께도 줌에 따라 조절 (최소 2, 최대 6 화면 픽셀)
    const baseLineWidth = 3 / this.currentZoom;
    const lineWidth = Math.max(2, Math.min(10, baseLineWidth));

    // 펄스 효과 (시간 기반 애니메이션)
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

    // 외부 펄스 링 (가장 큼)
    const outerRadius = highlightRadius * (1.5 + pulse * 0.3);
    this.highlightGraphics
      .circle(x, y, outerRadius)
      .stroke({ width: lineWidth, color: 0x00d9ff, alpha: 0.6 * pulse });

    // 중간 글로우 링
    this.highlightGraphics
      .circle(x, y, highlightRadius * 1.3)
      .stroke({ width: lineWidth * 0.8, color: 0x4a9eff, alpha: 0.7 });

    // 내부 글로우 링
    this.highlightGraphics
      .circle(x, y, highlightRadius * 1.1)
      .stroke({ width: lineWidth * 0.6, color: 0xffffff, alpha: 0.8 });

    // 중앙 채움 (개체 위치 표시)
    this.highlightGraphics
      .circle(x, y, highlightRadius * 0.3)
      .fill({ color: 0x00d9ff, alpha: 0.4 * pulse });

    // 십자선 (멀리서도 위치 파악 용이)
    const crossSize = highlightRadius * 2;
    const crossWidth = lineWidth * 0.5;

    // 가로선
    this.highlightGraphics
      .moveTo(x - crossSize, y)
      .lineTo(x - highlightRadius * 0.5, y)
      .stroke({ width: crossWidth, color: 0x00d9ff, alpha: 0.5 });
    this.highlightGraphics
      .moveTo(x + highlightRadius * 0.5, y)
      .lineTo(x + crossSize, y)
      .stroke({ width: crossWidth, color: 0x00d9ff, alpha: 0.5 });

    // 세로선
    this.highlightGraphics
      .moveTo(x, y - crossSize)
      .lineTo(x, y - highlightRadius * 0.5)
      .stroke({ width: crossWidth, color: 0x00d9ff, alpha: 0.5 });
    this.highlightGraphics
      .moveTo(x, y + highlightRadius * 0.5)
      .lineTo(x, y + crossSize)
      .stroke({ width: crossWidth, color: 0x00d9ff, alpha: 0.5 });
  }

  /**
   * 정리
   */
  destroy(): void {
    this.dotGraphics.destroy();
    this.simpleGraphics.destroy();
    this.mediumGraphics.destroy();
    this.highlightGraphics.destroy();

    for (const sprite of this.organismSprites.values()) {
      sprite.destroy({ children: true });
    }
    this.organismSprites.clear();

    this.detailedContainer.destroy({ children: true });
    this.container.destroy();
  }
}
