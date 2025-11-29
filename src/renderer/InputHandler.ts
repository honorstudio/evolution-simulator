import { Camera } from './Camera';

/**
 * 입력 처리 시스템
 * 마우스/터치 이벤트를 카메라 컨트롤로 변환
 */
export class InputHandler {
  private camera: Camera;
  private canvas: HTMLCanvasElement;

  // 클릭 콜백
  private onClickCallback: ((worldX: number, worldY: number) => void) | null = null;

  // 마우스 상태
  private isMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // 드래그 판정 임계값 (픽셀)
  private readonly DRAG_THRESHOLD = 5;
  private dragDistance: number = 0;

  constructor(
    camera: Camera,
    canvas: HTMLCanvasElement,
    onClickCallback?: (worldX: number, worldY: number) => void
  ) {
    this.camera = camera;
    this.canvas = canvas;
    this.onClickCallback = onClickCallback || null;
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 마우스 이벤트
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));

    // 마우스 휠 줌
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    // 터치 이벤트 (모바일 지원)
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });

    // 컨텍스트 메뉴 비활성화 (우클릭)
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * 마우스 다운
   */
  private onMouseDown(event: MouseEvent): void {
    // 왼쪽 버튼만 처리
    if (event.button !== 0) return;

    this.isMouseDown = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    this.dragDistance = 0;

    this.camera.startDrag(event.clientX, event.clientY);

    // 드래그 중 텍스트 선택 방지
    event.preventDefault();
  }

  /**
   * 마우스 이동
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isMouseDown) return;

    // 드래그 거리 계산
    const dx = event.clientX - this.lastMouseX;
    const dy = event.clientY - this.lastMouseY;
    this.dragDistance += Math.sqrt(dx * dx + dy * dy);

    this.camera.drag(event.clientX, event.clientY);

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  /**
   * 마우스 업
   */
  private onMouseUp(event: MouseEvent): void {
    if (!this.isMouseDown) return;

    this.isMouseDown = false;
    this.camera.endDrag();

    // 드래그가 아닌 클릭이면 개체 선택 (나중에 구현)
    if (this.dragDistance < this.DRAG_THRESHOLD) {
      this.onClick(event.clientX, event.clientY);
    }
  }

  /**
   * 마우스가 캔버스를 벗어남
   */
  private onMouseLeave(_event: MouseEvent): void {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      this.camera.endDrag();
    }
  }

  /**
   * 마우스 휠 (줌)
   */
  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 휠 방향에 따라 줌
    this.camera.zoomAt(mouseX, mouseY, -event.deltaY);
  }

  /**
   * 터치 시작
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1) {
      // 단일 터치 - 드래그
      const touch = event.touches[0];
      if (!touch) return;
      this.isMouseDown = true;
      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;
      this.dragDistance = 0;

      this.camera.startDrag(touch.clientX, touch.clientY);
    } else if (event.touches.length === 2) {
      // 핀치 줌은 나중에 구현
      this.isMouseDown = false;
      this.camera.endDrag();
    }
  }

  /**
   * 터치 이동
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1 && this.isMouseDown) {
      const touch = event.touches[0];
      if (!touch) return;

      const dx = touch.clientX - this.lastMouseX;
      const dy = touch.clientY - this.lastMouseY;
      this.dragDistance += Math.sqrt(dx * dx + dy * dy);

      this.camera.drag(touch.clientX, touch.clientY);

      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;
    }
    // 핀치 줌은 나중에 구현
  }

  /**
   * 터치 종료
   */
  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    if (this.isMouseDown) {
      this.isMouseDown = false;
      this.camera.endDrag();

      // 탭 판정
      if (this.dragDistance < this.DRAG_THRESHOLD && event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        if (touch) {
          this.onClick(touch.clientX, touch.clientY);
        }
      }
    }
  }

  /**
   * 클릭 처리
   */
  private onClick(screenX: number, screenY: number): void {
    // 캔버스 기준 좌표로 변환
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // 월드 좌표로 변환
    const worldPos = this.camera.screenToWorld(canvasX, canvasY);

    console.log(`Clicked at world position: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);

    // 콜백 호출
    if (this.onClickCallback) {
      this.onClickCallback(worldPos.x, worldPos.y);
    }
  }

  /**
   * 키보드 입력 (선택 사항)
   */
  setupKeyboardControls(): void {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case '+':
        case '=':
          this.camera.zoomIn();
          break;
        case '-':
        case '_':
          this.camera.zoomOut();
          break;
        case 'Home':
          // 원점으로 이동
          this.camera.moveTo(0, 0);
          this.camera.setZoom(1);
          break;
      }
    });
  }

  /**
   * 정리
   */
  destroy(): void {
    // 이벤트 리스너 제거
    // (간단히 하기 위해 생략, 필요시 구현)
  }
}
