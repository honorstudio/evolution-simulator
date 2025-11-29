/**
 * 게임 진입점 (Canvas 전용)
 *
 * React 없이 순수 Canvas로 게임을 실행할 때 사용합니다.
 * index.html에서 이 파일을 import하면 됩니다.
 */

import { Game } from './Game';
import { DEFAULT_CONFIG } from './simulation/config';
import './styles/global.css';

/**
 * 메인 초기화 함수
 */
async function main() {
  console.log('Evolution Simulator 시작...');

  // 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  document.body.appendChild(canvas);

  // UI 패널 생성 (선택사항)
  createUI();

  // 게임 인스턴스 생성
  const game = new Game(canvas);

  // 전역으로 노출 (디버깅용)
  (window as any).game = game;

  // 초기화 및 시작
  try {
    await game.init();
    game.start();
    console.log('게임 시작됨!');

    // UI 연결
    connectUI(game);
  } catch (error) {
    console.error('게임 초기화 실패:', error);
  }
}

/**
 * UI 생성
 */
function createUI() {
  const uiContainer = document.createElement('div');
  uiContainer.id = 'ui-container';
  uiContainer.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    z-index: 1000;
  `;

  uiContainer.innerHTML = `
    <h3 style="margin: 0 0 10px 0;">Evolution Simulator</h3>

    <div id="stats" style="margin-bottom: 10px;">
      <div id="fps-display">FPS: 0</div>
      <div id="time-display">시간: 0일</div>
      <div id="population-display">개체: 0</div>
      <div id="energy-display">평균 에너지: 0</div>
    </div>

    <div id="controls">
      <button id="pause-btn" style="margin-right: 5px; padding: 5px 10px;">
        일시정지
      </button>
      <button id="new-game-btn" style="padding: 5px 10px;">
        새 게임
      </button>

      <div style="margin-top: 10px;">
        <label>
          속도: <span id="speed-display">1.0x</span>
          <br>
          <input
            type="range"
            id="speed-slider"
            min="0.1"
            max="10"
            step="0.1"
            value="1"
            style="width: 150px;"
          />
        </label>
      </div>
    </div>
  `;

  document.body.appendChild(uiContainer);
}

/**
 * UI와 게임 연결
 */
function connectUI(game: Game) {
  // 일시정지 버튼
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      game.togglePause();
      const isPaused = game
        .getSimulation()
        .getTimeManager()
        .isPaused();
      pauseBtn.textContent = isPaused ? '재개' : '일시정지';
    });
  }

  // 새 게임 버튼
  const newGameBtn = document.getElementById('new-game-btn');
  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      if (confirm('새 게임을 시작하시겠습니까?')) {
        game.newGame(DEFAULT_CONFIG);
      }
    });
  }

  // 속도 슬라이더
  const speedSlider = document.getElementById(
    'speed-slider'
  ) as HTMLInputElement;
  const speedDisplay = document.getElementById('speed-display');
  if (speedSlider && speedDisplay) {
    speedSlider.addEventListener('input', () => {
      const speed = parseFloat(speedSlider.value);
      game.setSpeed(speed);
      speedDisplay.textContent = `${speed.toFixed(1)}x`;
    });
  }

  // 통계 업데이트 (매 초)
  setInterval(() => {
    updateStats(game);
  }, 1000);

  // 키보드 단축키
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case ' ': // 스페이스바
        e.preventDefault();
        game.togglePause();
        break;
      case '1':
        game.setSpeed(1);
        if (speedSlider) speedSlider.value = '1';
        if (speedDisplay) speedDisplay.textContent = '1.0x';
        break;
      case '2':
        game.setSpeed(2);
        if (speedSlider) speedSlider.value = '2';
        if (speedDisplay) speedDisplay.textContent = '2.0x';
        break;
      case '5':
        game.setSpeed(5);
        if (speedSlider) speedSlider.value = '5';
        if (speedDisplay) speedDisplay.textContent = '5.0x';
        break;
    }
  });
}

/**
 * 통계 UI 업데이트
 */
function updateStats(game: Game) {
  const simulation = game.getSimulation();
  const stats = simulation.getStatistics();
  const timeManager = simulation.getTimeManager();

  // FPS
  const fpsDisplay = document.getElementById('fps-display');
  if (fpsDisplay) {
    fpsDisplay.textContent = `FPS: ${game.getFPS()}`;
  }

  // 시간
  const timeDisplay = document.getElementById('time-display');
  if (timeDisplay) {
    timeDisplay.textContent = `시간: ${timeManager.formatTimeShort()}`;
  }

  // 개체 수
  const populationDisplay = document.getElementById('population-display');
  if (populationDisplay) {
    populationDisplay.textContent = `개체: ${stats.organismCount}`;
  }

  // 에너지
  const energyDisplay = document.getElementById('energy-display');
  if (energyDisplay) {
    energyDisplay.textContent = `평균 에너지: ${stats.averageEnergy.toFixed(1)}`;
  }
}

// 페이지 로드 시 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
