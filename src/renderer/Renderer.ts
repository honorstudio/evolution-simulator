import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './Camera';
import { InputHandler } from './InputHandler';
import { TerrainRenderer } from './TerrainRenderer';
import { OrganismRenderer } from './OrganismRenderer';
import { FoodRenderer } from './FoodRenderer';
import { UI_COLORS } from './colors';
import { Organism } from '../organism/Organism';
import { Food } from '../organism/Food';

/**
 * 메인 렌더러
 * PixiJS 애플리케이션 관리 및 전체 렌더링 조율
 */
export class Renderer {
  private app: Application;
  private camera: Camera;
  private inputHandler: InputHandler | null = null;

  // 렌더링 레이어
  private worldContainer: Container; // 월드 요소 (카메라 영향 받음)
  private uiContainer: Container; // UI 요소 (고정)

  // 서브 렌더러
  private terrainRenderer: TerrainRenderer;
  private organismRenderer: OrganismRenderer;
  private foodRenderer: FoodRenderer;

  // 성능 모니터링
  private lastTime: number = performance.now();
  private frameCount: number = 0;
  private fps: number = 0;

  // 초기화 상태
  private isInitialized: boolean = false;

  // 캔버스 참조
  private canvas: HTMLCanvasElement | null = null;

  // 클릭 이벤트 콜백
  private onOrganismClickCallback: ((organismId: string | null) => void) | null = null;

  // 현재 렌더링 중인 생명체 목록 (클릭 판정용)
  private currentOrganisms: Organism[] = [];

  constructor() {
    this.app = new Application();
    this.camera = new Camera();
    this.worldContainer = new Container();
    this.uiContainer = new Container();
    this.terrainRenderer = new TerrainRenderer(this.camera);
    this.organismRenderer = new OrganismRenderer();
    this.foodRenderer = new FoodRenderer();
  }

  /**
   * 렌더러 초기화 (PixiJS v8은 async)
   */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.isInitialized) {
      console.warn('Renderer already initialized');
      return;
    }

    console.log('Initializing PixiJS Renderer...');

    // 캔버스 참조 저장
    this.canvas = canvas;

    // 캔버스 부모 요소의 크기를 사용
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;

    // PixiJS 애플리케이션 초기화
    await this.app.init({
      canvas,
      width,
      height,
      antialias: true,
      backgroundColor: UI_COLORS.BACKGROUND,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgl', // WebGL 우선 (WebGPU는 아직 실험적)
      resizeTo: parent || undefined, // 부모 요소에 맞춰 자동 리사이즈
    });

    console.log('PixiJS initialized successfully');

    // 렌더링 레이어 구성
    this.setupLayers();

    // 카메라 설정
    this.camera.setContainer(this.worldContainer);
    // 월드 크기 먼저 설정 (WORLD_CONFIG: 32000x24000)
    this.camera.setWorldSize(32000, 24000);
    // 그 다음 화면 크기로 resize (minZoom 재계산)
    this.camera.resize(width, height);
    // 카메라를 월드 중앙으로 이동
    this.camera.moveTo(16000, 12000);
    // 초기 줌: 전체 월드가 보이도록 최소 줌으로 설정
    const minZoom = this.camera.getMinZoom();
    this.camera.setZoom(minZoom); // 전체 월드 뷰

    // 입력 핸들러 (클릭 콜백 전달)
    this.inputHandler = new InputHandler(
      this.camera,
      canvas,
      this.handleClick.bind(this)
    );
    this.inputHandler.setupKeyboardControls();

    // 성능 모니터 (개발용)
    this.setupPerformanceMonitor();

    // 창 크기 변경 이벤트
    window.addEventListener('resize', this.onResize.bind(this));

    // 렌더링 루프 시작
    this.app.ticker.add(this.update.bind(this));

    this.isInitialized = true;

    // 지형 생성
    this.terrainRenderer.generateTestTerrain(4);

    console.log('Renderer ready');
  }

  /**
   * 렌더링 레이어 구성
   */
  private setupLayers(): void {
    // 월드 컨테이너 (카메라 영향)
    this.app.stage.addChild(this.worldContainer);

    // 지형 레이어 추가
    this.worldContainer.addChild(this.terrainRenderer.getContainer());

    // 음식 레이어 (지형 위)
    this.worldContainer.addChild(this.foodRenderer.getContainer());

    // 생명체 레이어 (음식 위)
    this.worldContainer.addChild(this.organismRenderer.getContainer());

    // UI 컨테이너 (고정)
    this.app.stage.addChild(this.uiContainer);

    // 그리드 표시 (디버그용)
    this.drawGrid();
  }

  /**
   * 그리드 그리기 (디버그용) - PixiJS v8 API
   * 월드 전체에 그리드를 그립니다 (0,0 ~ 32000,24000)
   */
  private drawGrid(): void {
    const gridGraphics = new Graphics();
    const gridSize = 800; // 800픽셀 간격 (4배 확대된 월드)

    // 월드 크기 (WORLD_CONFIG와 동기화)
    const worldWidth = 32000;
    const worldHeight = 24000;

    // 그리드 선 (PixiJS v8)
    gridGraphics.setStrokeStyle({ width: 1, color: 0x333333, alpha: 0.15 });

    // 수직선 (0부터 월드 너비까지)
    for (let x = 0; x <= worldWidth; x += gridSize) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, worldHeight);
    }

    // 수평선 (0부터 월드 높이까지)
    for (let y = 0; y <= worldHeight; y += gridSize) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(worldWidth, y);
    }

    gridGraphics.stroke();

    // 월드 경계 표시 (붉은색)
    gridGraphics.setStrokeStyle({ width: 4, color: 0xff4444, alpha: 0.5 });
    gridGraphics.rect(0, 0, worldWidth, worldHeight);
    gridGraphics.stroke();

    // 월드 중심 표시 (파란색 십자가)
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;
    gridGraphics.setStrokeStyle({ width: 3, color: 0x4a9eff, alpha: 0.6 });
    gridGraphics.moveTo(centerX - 200, centerY);
    gridGraphics.lineTo(centerX + 200, centerY);
    gridGraphics.moveTo(centerX, centerY - 200);
    gridGraphics.lineTo(centerX, centerY + 200);
    gridGraphics.stroke();

    this.worldContainer.addChild(gridGraphics);
  }

  /**
   * 성능 모니터 설정 (디버그 오버레이 제거됨 - UI 패널로 이동)
   */
  private setupPerformanceMonitor(): void {
    // 디버그 오버레이가 UI 패널(DebugInfoPanel)로 이동되어 캔버스에는 표시하지 않음
    // FPS, Zoom, Position 정보는 getCameraInfo()와 getFPS()로 접근 가능
  }

  /**
   * 매 프레임 업데이트
   */
  private update(ticker: any): void {
    const deltaTime = ticker.deltaTime; // PixiJS의 deltaTime (1 = 60fps 기준)

    // 카메라 업데이트
    this.camera.update(deltaTime);

    // 지형 렌더러 업데이트 (컬링)
    this.terrainRenderer.update();

    // FPS 계산
    this.updateFPS();

    // 실제 렌더링은 PixiJS가 자동으로 처리
  }

  /**
   * 생명체와 음식 렌더링
   * Game.ts에서 매 프레임 호출됩니다.
   */
  renderEntities(organisms: Organism[], foods: Food[]): void {
    if (!this.isInitialized) return;

    // 클릭 판정을 위해 현재 생명체 목록 저장
    this.currentOrganisms = organisms;

    // 현재 줌 레벨에 따른 LOD 업데이트
    const currentZoom = this.camera.getZoom();
    this.organismRenderer.updateLOD(currentZoom);

    this.organismRenderer.render(organisms);
    this.foodRenderer.render(foods);
  }

  /**
   * 클릭 처리 (InputHandler에서 호출)
   */
  private handleClick(worldX: number, worldY: number): void {
    // 클릭 위치에서 가장 가까운 생명체 찾기
    const clickedOrganism = this.findOrganismAtPosition(worldX, worldY);

    if (clickedOrganism) {
      console.log(`Clicked organism: ${clickedOrganism.id}`);
    } else {
      console.log('Clicked empty space');
    }

    // 콜백 호출
    if (this.onOrganismClickCallback) {
      this.onOrganismClickCallback(clickedOrganism ? clickedOrganism.id : null);
    }
  }

  /**
   * 특정 위치에 있는 생명체 찾기
   */
  private findOrganismAtPosition(worldX: number, worldY: number): Organism | null {
    let closestOrganism: Organism | null = null;
    let minDistance = Infinity;

    for (const organism of this.currentOrganisms) {
      if (!organism.isAlive) continue;

      const dx = worldX - organism.x;
      const dy = worldY - organism.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 생명체 크기 기반 클릭 반경 (최소 100, genome.size * 50)
      // 줌 레벨 0.5에서도 쉽게 클릭할 수 있도록 크게 설정
      const clickRadius = Math.max(100, organism.genome.size * 50);

      if (distance < clickRadius && distance < minDistance) {
        minDistance = distance;
        closestOrganism = organism;
      }
    }

    return closestOrganism;
  }

  /**
   * 생명체 클릭 콜백 등록
   */
  setOnOrganismClick(callback: (organismId: string | null) => void): void {
    this.onOrganismClickCallback = callback;
  }

  /**
   * 하이라이트할 생명체 설정
   */
  setHighlightedOrganism(organismId: string | null): void {
    this.organismRenderer.setHighlightedOrganism(organismId);
  }

  /**
   * FPS 계산 (디버그 오버레이 제거됨)
   */
  private updateFPS(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * 현재 FPS 반환
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * 카메라 정보 반환
   */
  getCameraInfo(): { x: number; y: number; zoom: number } {
    return {
      x: Math.round(this.camera.x),
      y: Math.round(this.camera.y),
      zoom: this.camera.zoom,
    };
  }

  /**
   * 창 크기 변경 처리
   */
  private onResize(): void {
    if (!this.canvas) return;

    const parent = this.canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;

    // PixiJS는 resizeTo 옵션으로 자동 리사이즈하므로 카메라만 업데이트
    this.camera.resize(width, height);
  }

  /**
   * 카메라 접근자 (외부에서 제어할 수 있도록)
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * 월드 컨테이너 접근자
   */
  getWorldContainer(): Container {
    return this.worldContainer;
  }

  /**
   * UI 컨테이너 접근자
   */
  getUIContainer(): Container {
    return this.uiContainer;
  }

  /**
   * 정리
   */
  destroy(): void {
    console.log('Destroying renderer...');

    // 이벤트 리스너 제거
    window.removeEventListener('resize', this.onResize);

    // 서브 렌더러 정리
    this.terrainRenderer.destroy();
    this.organismRenderer.destroy();
    this.foodRenderer.destroy();

    // 입력 핸들러 정리
    if (this.inputHandler) {
      this.inputHandler.destroy();
    }

    // PixiJS 정리
    this.app.destroy(true, { children: true, texture: true });

    this.isInitialized = false;
  }
}
