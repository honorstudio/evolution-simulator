/**
 * BottomPanel - 하단 정보 패널
 *
 * 진화 마일스톤, 환경 미니 정보를 컴팩트하게 표시합니다.
 */

import { useStats } from '../hooks';
import './BottomPanel.css';

export function BottomPanel() {
  const stats = useStats();

  // 진화 마일스톤 체크
  const milestones = [
    {
      id: 'life',
      icon: '🦠',
      label: '최초의 생명',
      achieved: stats.organisms > 0,
    },
    {
      id: 'photosynthesis',
      icon: '☀️',
      label: '광합성 시작',
      achieved: stats.plantCount > 0 || stats.phytoplanktonCount > 0,
    },
    {
      id: 'oxygen',
      icon: '💨',
      label: '산소 축적 (1%)',
      achieved: stats.oxygen >= 1,
    },
    {
      id: 'multicellular',
      icon: '🧬',
      label: '다세포 진화',
      achieved: stats.multicellularCount > 0,
    },
    {
      id: 'animals',
      icon: '🐾',
      label: '동물 등장',
      achieved: stats.animalCount > 0,
    },
    {
      id: 'predator',
      icon: '🦷',
      label: '포식자 등장',
      achieved: stats.carnivoreCount > 0,
    },
    {
      id: 'highOxygen',
      icon: '🌬️',
      label: '산소 풍부 (10%)',
      achieved: stats.oxygen >= 10,
    },
    {
      id: 'diversity',
      icon: '🌈',
      label: '생태계 다양화',
      achieved: stats.herbivoreCount > 0 && stats.carnivoreCount > 0 && stats.omnivoreCount > 0,
    },
  ];

  const achievedCount = milestones.filter(m => m.achieved).length;
  const progress = (achievedCount / milestones.length) * 100;

  return (
    <div className="bottom-panel">
      {/* 진화 진행률 */}
      <div className="bottom-section progress-section">
        <div className="progress-header">
          <span className="progress-title">진화 진행</span>
          <span className="progress-count">{achievedCount}/{milestones.length}</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 마일스톤 */}
      <div className="bottom-section milestones-section">
        <div className="milestones-grid">
          {milestones.map(milestone => (
            <div
              key={milestone.id}
              className={`milestone-item ${milestone.achieved ? 'achieved' : 'pending'}`}
              title={milestone.label}
            >
              <span className="milestone-icon">{milestone.icon}</span>
              <span className="milestone-label">{milestone.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 미니 환경 정보 */}
      <div className="bottom-section env-mini-section">
        <div className="env-mini-item">
          <span className="env-mini-icon">🌍</span>
          <span className="env-mini-label">{stats.era}</span>
        </div>
        <div className="env-mini-divider" />
        <div className="env-mini-item">
          <span className="env-mini-icon">O₂</span>
          <span className="env-mini-value" style={{ color: getOxygenColor(stats.oxygen) }}>
            {stats.oxygen.toFixed(2)}%
          </span>
        </div>
        <div className="env-mini-divider" />
        <div className="env-mini-item">
          <span className="env-mini-icon">🌡️</span>
          <span className="env-mini-value">{stats.temperature.toFixed(0)}°C</span>
        </div>
        <div className="env-mini-divider" />
        <div className="env-mini-item">
          <span className="env-mini-icon">👥</span>
          <span className="env-mini-value">{stats.organisms}</span>
        </div>
        <div className="env-mini-divider" />
        <div className="env-mini-item">
          <span className="env-mini-icon">⚡</span>
          <span className="env-mini-value">{stats.fps} FPS</span>
        </div>
      </div>
    </div>
  );
}

function getOxygenColor(oxygen: number): string {
  if (oxygen < 1) return '#ef4444';
  if (oxygen < 5) return '#fbbf24';
  if (oxygen < 15) return '#22d3ee';
  return '#4ade80';
}
