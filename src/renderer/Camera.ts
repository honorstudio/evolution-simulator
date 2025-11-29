import { Container } from 'pixi.js';

/**
 * 카메라 시스템
 * 월드 뷰포트 관리, 줌, 팬 기능 제공
 */
export class Camera {
  // 카메라 위치 (월드 좌표)
  public x: number = 0;
  public y: number = 0;

  // 줌 레벨
  public zoom: number = 1;
  public targetZoom: number = 1;

  // 줌 범위 (최소 줌은 동적으로 계산됨)
  private minZoom: number = 0.1;
  private readonly MAX_ZOOM = 10;

  // 월드 크기 (최소 줌 계산용)
  private worldWidth: number = 8000;
  private worldHeight: number = 6000;

  // 줌 속도
  private readonly ZOOM_SPEED = 0.1;
  private readonly ZOOM_SMOOTH = 0.15;

  // 드래그 상태
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraStartX: number = 0;
  private cameraStartY: number = 0;

  // 렌더링 컨테이너 참조
  private worldContainer: Container | null = null;

  // 화면 크기
  private screenWidth: number = window.innerWidth;
  private screenHeight: number = window.innerHeight;

  constructor() {
    this.calculateMinZoom();
  }

  /**
   * 월드 크기 설정 (최소 줌 재계산)
   */
  setWorldSize(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
    this.calculateMinZoom();
  }

  /**
   * 최소 줌 레벨 계산
   * 화면에 월드가 꽉 차도록 (검정 배경이 안 보이도록) 줌 레벨 제한
   */
  private calculateMinZoom(): void {
    // 화면에 월드가 완전히 들어오려면 큰 줌 값 필요
    const zoomX = this.screenWidth / this.worldWidth;
    const zoomY = this.screenHeight / this.worldHeight;
    // 화면을 월드가 꽉 채우도록 큰 값 선택 (검정 배경 안 보임)
    this.minZoom = Math.max(zoomX, zoomY);

    console.log(`📷 카메라 최소줌 계산: screen(${this.screenWidth}x${this.screenHeight}), world(${this.worldWidth}x${this.worldHeight}), minZoom=${this.minZoom.toFixed(4)}`);

    // 현재 줌이 최소 줌보다 작으면 조정
    if (this.zoom < this.minZoom) {
      this.zoom = this.minZoom;
      this.targetZoom = this.minZoom;
    }
  }

  /**
   * 월드 컨테이너 설정
   */
  setContainer(container: Container): void {
    this.worldContainer = container;
  }

  /**
   * 화면 크기 업데이트
   */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.calculateMinZoom();
  }

  /**
   * 특정 위치로 카메라 이동
   */
  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * 줌 인 (확대)
   */
  zoomIn(): void {
    this.targetZoom = Math.min(this.targetZoom * (1 + this.ZOOM_SPEED), this.MAX_ZOOM);
  }

  /**
   * 줌 아웃 (축소)
   */
  zoomOut(): void {
    this.targetZoom = Math.max(this.targetZoom * (1 - this.ZOOM_SPEED), this.minZoom);
  }

  /**
   * 특정 줌 레벨 설정
   */
  setZoom(level: number): void {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.MAX_ZOOM, level));
    this.zoom = this.targetZoom; // 즉시 적용
  }

  /**
   * 최소 줌 레벨 반환
   */
  getMinZoom(): number {
    return this.minZoom;
  }

  /**
   * 마우스 휠로 줌 (특정 지점을 중심으로)
   */
  zoomAt(screenX: number, screenY: number, delta: number): void {
    // 줌 전 월드 좌표
    const worldPosBefore = this.screenToWorld(screenX, screenY);

    // 줌 변경
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    this.targetZoom = Math.max(
      this.minZoom,
      Math.min(this.MAX_ZOOM, this.targetZoom * zoomFactor)
    );

    // 즉시 적용 (부드러운 줌 대신)
    this.zoom = this.targetZoom;

    // 줌 후 월드 좌표
    const worldPosAfter = this.screenToWorld(screenX, screenY);

    // 마우스 위치가 고정되도록 카메라 조정
    this.x += worldPosBefore.x - worldPosAfter.x;
    this.y += worldPosBefore.y - worldPosAfter.y;

    // 카메라가 월드 밖으로 나가지 않도록 제한
    this.clampCameraPosition();
  }

  /**
   * 카메라 위치를 월드 내부로 제한
   * 화면에 보이는 영역이 월드를 벗어나지 않도록 함
   */
  private clampCameraPosition(): void {
    // 현재 줌에서 화면에 보이는 월드 영역의 절반 크기
    const viewHalfWidth = this.screenWidth / 2 / this.zoom;
    const viewHalfHeight = this.screenHeight / 2 / this.zoom;

    // 월드의 절반 크기
    const worldHalfWidth = this.worldWidth / 2;
    const worldHalfHeight = this.worldHeight / 2;

    // X축: 화면이 월드보다 넓으면 중앙 고정, 아니면 경계 제한
    if (viewHalfWidth >= worldHalfWidth) {
      // 화면이 월드보다 넓음 -> 중앙 고정
      this.x = worldHalfWidth;
    } else {
      // 카메라가 월드 경계를 벗어나지 않도록 제한
      this.x = Math.max(viewHalfWidth, Math.min(this.worldWidth - viewHalfWidth, this.x));
    }

    // Y축: 화면이 월드보다 높으면 중앙 고정, 아니면 경계 제한
    if (viewHalfHeight >= worldHalfHeight) {
      // 화면이 월드보다 높음 -> 중앙 고정
      this.y = worldHalfHeight;
    } else {
      // 카메라가 월드 경계를 벗어나지 않도록 제한
      this.y = Math.max(viewHalfHeight, Math.min(this.worldHeight - viewHalfHeight, this.y));
    }
  }

  /**
   * 드래그 시작
   */
  startDrag(screenX: number, screenY: number): void {
    this.isDragging = true;
    this.dragStartX = screenX;
    this.dragStartY = screenY;
    this.cameraStartX = this.x;
    this.cameraStartY = this.y;
  }

  /**
   * 드래그 중
   */
  drag(screenX: number, screenY: number): void {
    if (!this.isDragging) return;

    const dx = screenX - this.dragStartX;
    const dy = screenY - this.dragStartY;

    // 스크린 이동을 월드 이동으로 변환
    this.x = this.cameraStartX - dx / this.zoom;
    this.y = this.cameraStartY - dy / this.zoom;

    // 카메라가 월드 밖으로 나가지 않도록 제한
    this.clampCameraPosition();
  }

  /**
   * 드래그 종료
   */
  endDrag(): void {
    this.isDragging = false;
  }

  /**
   * 월드 좌표를 스크린 좌표로 변환
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom + this.screenWidth / 2,
      y: (worldY - this.y) * this.zoom + this.screenHeight / 2,
    };
  }

  /**
   * 스크린 좌표를 월드 좌표로 변환
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.screenWidth / 2) / this.zoom + this.x,
      y: (screenY - this.screenHeight / 2) / this.zoom + this.y,
    };
  }

  /**
   * 화면에 보이는 월드 영역 계산
   */
  getVisibleBounds(): { x: number; y: number; width: number; height: number } {
    const halfWidth = this.screenWidth / 2 / this.zoom;
    const halfHeight = this.screenHeight / 2 / this.zoom;

    return {
      x: this.x - halfWidth,
      y: this.y - halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2,
    };
  }

  /**
   * 매 프레임 업데이트 (부드러운 줌)
   */
  update(_deltaTime: number): void {
    // 줌 보간 (부드러운 전환)
    if (Math.abs(this.zoom - this.targetZoom) > 0.001) {
      this.zoom += (this.targetZoom - this.zoom) * this.ZOOM_SMOOTH;
    } else {
      this.zoom = this.targetZoom;
    }

    // 카메라 위치를 월드 내부로 제한
    this.clampCameraPosition();

    // 컨테이너에 변환 적용
    this.applyTransform();
  }

  /**
   * 컨테이너에 카메라 변환 적용
   */
  private applyTransform(): void {
    if (!this.worldContainer) return;

    // 월드 컨테이너를 카메라 위치에 맞춰 이동 및 스케일
    this.worldContainer.x = -this.x * this.zoom + this.screenWidth / 2;
    this.worldContainer.y = -this.y * this.zoom + this.screenHeight / 2;
    this.worldContainer.scale.set(this.zoom);
  }

  /**
   * 현재 줌 레벨 반환
   */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * 현재 LOD 레벨 가져오기
   */
  getLODLevel(): number {
    if (this.zoom < 0.1) return 0; // DOT
    if (this.zoom < 0.3) return 1; // SIMPLE
    if (this.zoom < 0.7) return 2; // MEDIUM
    return 3; // DETAILED
  }
}
