/**
 * TimeControlPanel - 시간 컨트롤 패널
 *
 * 게임 속도를 조절하고 시간 정보를 표시합니다.
 */

import { useTimeControl, useStats } from '../hooks';
import './TimeControlPanel.css';

export function TimeControlPanel() {
  const { isPaused, speed, togglePause, changeSpeed } = useTimeControl();
  const stats = useStats();

  // 속도 옵션
  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
  ];

  return (
    <div className="time-control-panel">
      <div className="time-controls">
        {/* 일시정지/재생 버튼 */}
        <button
          className={`control-btn ${isPaused ? 'paused' : 'playing'}`}
          onClick={togglePause}
          title={isPaused ? '재생' : '일시정지'}
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>

        {/* 속도 버튼들 */}
        {speedOptions.map((option) => (
          <button
            key={option.value}
            className={`control-btn speed-btn ${speed === option.value ? 'active' : ''}`}
            onClick={() => changeSpeed(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="time-info">
        <div className="time-info-item">
          <span className="time-label">속도:</span>
          <span className="time-value">{speed}x</span>
        </div>
        <div className="time-info-item">
          <span className="time-label">경과:</span>
          <span className="time-value">
            {stats.currentYear}년 {stats.currentDay}일
          </span>
        </div>
        <div className="time-info-item">
          <span className="time-label">틱:</span>
          <span className="time-value">{stats.currentTick.toLocaleString()}</span>
        </div>
        <div className="time-info-item">
          <span className="time-label">FPS:</span>
          <span className="time-value">{stats.fps}</span>
        </div>
      </div>
    </div>
  );
}
