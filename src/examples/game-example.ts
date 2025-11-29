/**
 * 게임 사용 예제
 *
 * Game 클래스를 사용해 시뮬레이션을 시작하는 방법을 보여줍니다.
 */

import { Game } from '../Game';
import { DEFAULT_CONFIG, FAST_EVOLUTION_CONFIG } from '../simulation/config';

/**
 * 기본 게임 시작
 */
export function startBasicGame(): void {
  // 1. 캔버스 얻기
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('캔버스를 찾을 수 없습니다');
    return;
  }

  // 2. 게임 인스턴스 생성
  const game = new Game(canvas);

  // 3. 초기화 및 시작
  game.init().then(() => {
    game.start();
    console.log('게임 시작됨!');
  });

  // 4. UI 컨트롤 연결 (예시)
  setupGameControls(game);
}

/**
 * 커스텀 설정으로 게임 시작
 */
export function startCustomGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const game = new Game(canvas);

  // 빠른 진화 모드로 시작
  game.init().then(() => {
    game.newGame(FAST_EVOLUTION_CONFIG);
    game.start();
  });

  setupGameControls(game);
}

/**
 * 게임 컨트롤 UI 설정
 */
function setupGameControls(game: Game): void {
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

  // 속도 조절 슬라이더
  const speedSlider = document.getElementById(
    'speed-slider'
  ) as HTMLInputElement;
  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      const speed = parseFloat(speedSlider.value);
      game.setSpeed(speed);
      updateSpeedDisplay(speed);
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

  // 통계 업데이트 (매 초마다)
  setInterval(() => {
    updateStatisticsUI(game);
  }, 1000);
}

/**
 * 속도 표시 업데이트
 */
function updateSpeedDisplay(speed: number): void {
  const display = document.getElementById('speed-display');
  if (display) {
    display.textContent = `${speed.toFixed(1)}x`;
  }
}

/**
 * 통계 UI 업데이트
 */
function updateStatisticsUI(game: Game): void {
  const simulation = game.getSimulation();
  const stats = simulation.getStatistics();
  const timeManager = simulation.getTimeManager();

  // FPS
  const fpsElement = document.getElementById('fps-display');
  if (fpsElement) {
    fpsElement.textContent = `FPS: ${game.getFPS()}`;
  }

  // 게임 시간
  const timeElement = document.getElementById('time-display');
  if (timeElement) {
    timeElement.textContent = timeManager.formatTimeShort();
  }

  // 개체 수
  const populationElement = document.getElementById('population-display');
  if (populationElement) {
    populationElement.textContent = `개체: ${stats.organismCount}`;
  }

  // 평균 에너지
  const energyElement = document.getElementById('energy-display');
  if (energyElement) {
    energyElement.textContent = `에너지: ${stats.averageEnergy.toFixed(1)}`;
  }

  // 출생/사망
  const birthsElement = document.getElementById('births-display');
  if (birthsElement) {
    birthsElement.textContent = `출생: ${stats.totalBirths}`;
  }

  const deathsElement = document.getElementById('deaths-display');
  if (deathsElement) {
    deathsElement.textContent = `사망: ${stats.totalDeaths}`;
  }
}

/**
 * HTML 템플릿 (참고용)
 */
export const HTML_TEMPLATE = `
<div id="game-container">
  <canvas id="game-canvas"></canvas>

  <div id="ui-panel">
    <div id="controls">
      <button id="pause-btn">일시정지</button>
      <button id="new-game-btn">새 게임</button>

      <div id="speed-control">
        <label>속도: <span id="speed-display">1.0x</span></label>
        <input
          type="range"
          id="speed-slider"
          min="0.1"
          max="10"
          step="0.1"
          value="1"
        />
      </div>
    </div>

    <div id="statistics">
      <div id="fps-display">FPS: 0</div>
      <div id="time-display">0일</div>
      <div id="population-display">개체: 0</div>
      <div id="energy-display">에너지: 0</div>
      <div id="births-display">출생: 0</div>
      <div id="deaths-display">사망: 0</div>
    </div>
  </div>
</div>
`;
