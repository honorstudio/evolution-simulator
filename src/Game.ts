/**
 * 메인 게임 클래스
 *
 * 시뮬레이션 엔진과 렌더러를 연결하고
 * 게임 루프를 관리합니다.
 */

import { SimulationEngine } from './simulation/SimulationEngine';
import { SimulationConfig } from './simulation/config';
import { Renderer } from './renderer';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer | null = null;
  private simulation: SimulationEngine;

  // 게임 루프
  private lastTime: number = 0;
  private animationFrameId: number = 0;

  // 성능 모니터링
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.simulation = new SimulationEngine();
  }

  /**
   * 초기화
   *
   * 게임에 필요한 모든 시스템을 초기화합니다.
   */
  async init(): Promise<void> {
    console.log('게임 초기화 중...');

    // 새 게임 시작
    this.newGame();

    // Renderer 초기화 (async)
    this.renderer = new Renderer();
    await this.renderer.init(this.canvas);

    console.log('게임 초기화 완료');
  }

  /**
   * 새 게임 시작
   *
   * @param config 시뮬레이션 설정 (선택사항)
   */
  newGame(config?: SimulationConfig): void {
    // 시뮬레이션 초기화
    this.simulation.newGame(config);

    // 통계 초기화
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;

    console.log('새 게임 시작됨');
  }

  /**
   * 게임 루프
   *
   * requestAnimationFrame을 사용한 메인 루프입니다.
   * 60fps를 목표로 하며, delta time을 사용해 프레임 독립적입니다.
   *
   * @param currentTime 현재 시간 (밀리초)
   */
  private gameLoop = (currentTime: number): void => {
    // Delta 시간 계산 (밀리초)
    const delta = this.lastTime === 0 ? 0 : currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 첫 프레임은 건너뛰기 (delta가 너무 큼)
    if (delta > 0 && delta < 1000) {
      // 1. 시뮬레이션 업데이트
      this.simulation.update(delta);

      // 2. 생명체/음식 렌더링
      this.renderEntities();

      // 3. FPS 계산
      this.updateFPS(delta);
    }

    // 다음 프레임 예약
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * 생명체와 음식 렌더링
   */
  private renderEntities(): void {
    if (!this.renderer) return;

    const organismManager = this.simulation.getOrganismManager();
    if (!organismManager) return;

    const organisms = organismManager.getOrganisms();
    const foods = organismManager.getFoods();

    this.renderer.renderEntities(organisms, foods);
  }

  /**
   * FPS 계산 및 업데이트
   */
  private updateFPS(delta: number): void {
    this.frameCount++;
    this.fpsTimer += delta;

    // 1초마다 FPS 계산
    if (this.fpsTimer >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  /**
   * 게임 시작
   */
  start(): void {
    if (this.animationFrameId !== 0) {
      console.warn('게임이 이미 실행 중입니다');
      return;
    }

    console.log('게임 시작');
    this.simulation.start();
    this.lastTime = 0; // 리셋
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  /**
   * 게임 정지
   */
  stop(): void {
    if (this.animationFrameId === 0) {
      return;
    }

    console.log('게임 정지');
    this.simulation.stop();
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = 0;
  }

  /**
   * 일시정지 토글
   */
  togglePause(): void {
    this.simulation.getTimeManager().togglePause();
  }

  /**
   * 일시정지
   */
  pause(): void {
    const timeManager = this.simulation.getTimeManager();
    if (!timeManager.isPaused()) {
      timeManager.togglePause();
    }
  }

  /**
   * 재개
   */
  resume(): void {
    const timeManager = this.simulation.getTimeManager();
    if (timeManager.isPaused()) {
      timeManager.togglePause();
    }
  }

  /**
   * 게임 속도 변경
   */
  setSpeed(speed: number): void {
    this.simulation.getTimeManager().setSpeed(speed);
  }

  /**
   * 현재 FPS 반환
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * 시뮬레이션 엔진 접근
   */
  getSimulation(): SimulationEngine {
    return this.simulation;
  }

  /**
   * 렌더러 접근
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }

  /**
   * 정리 (게임 종료 시)
   */
  destroy(): void {
    this.stop();
    console.log('게임 종료');
  }
}
