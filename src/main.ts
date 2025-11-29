/**
 * Evolution Simulator - Main Entry Point
 * 진화 시뮬레이터의 메인 진입점
 */

import { Renderer } from './renderer';

/**
 * 애플리케이션 메인 클래스
 */
class EvolutionSimulator {
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.renderer = new Renderer();
    this.canvas = this.createCanvas();
  }

  /**
   * 캔버스 엘리먼트 생성
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // 기존 캔버스가 있으면 제거
    const existingCanvas = document.getElementById('game-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    document.body.appendChild(canvas);
    return canvas;
  }

  /**
   * 애플리케이션 시작
   */
  async start(): Promise<void> {
    console.log('🧬 Evolution Simulator Starting...');

    try {
      // 렌더러 초기화
      await this.renderer.init(this.canvas);

      console.log('✅ Evolution Simulator Ready!');
      console.log('📊 Use mouse drag to move, scroll to zoom');

      // TODO: 게임 로직 시작
      // - World 생성
      // - Organisms 생성
      // - 시뮬레이션 루프 시작

    } catch (error) {
      console.error('❌ Failed to start simulator:', error);
    }
  }

  /**
   * 애플리케이션 종료
   */
  shutdown(): void {
    console.log('Shutting down Evolution Simulator...');
    this.renderer.destroy();
    this.canvas.remove();
  }
}

// 애플리케이션 인스턴스 생성 및 시작
let app: EvolutionSimulator | null = null;

// DOM 로드 완료 후 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  app = new EvolutionSimulator();
  await app.start();

  // Hot Module Replacement (개발 모드)
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('🔄 Hot reloading...');
      if (app) {
        app.shutdown();
      }
      init();
    });

    import.meta.hot.dispose(() => {
      if (app) {
        app.shutdown();
      }
    });
  }
}

// 에러 핸들링
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
