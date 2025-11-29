/**
 * EcosystemPanel - 생태계 정보 패널 (좌측 사이드바)
 *
 * 플랑크톤, 먹이사슬, 서식지 정보를 표시합니다.
 */

import { useStats } from '../hooks';
import './EcosystemPanel.css';

export function EcosystemPanel() {
  const stats = useStats();

  // 먹이사슬 균형 계산
  const totalPlankton = stats.phytoplanktonCount + stats.zooplanktonCount;
  const planktonRatio = totalPlankton > 0
    ? ((stats.phytoplanktonCount / totalPlankton) * 100).toFixed(1)
    : '0';

  // 생태계 건강도 계산 (간단한 지표)
  const ecosystemHealth = (() => {
    let score = 0;
    // 식물성 플랑크톤이 있으면 +30
    if (stats.phytoplanktonCount > 0) score += 30;
    // 동물성 플랑크톤이 있으면 +20
    if (stats.zooplanktonCount > 0) score += 20;
    // 식물이 있으면 +20
    if (stats.plantCount > 0) score += 20;
    // 동물이 있으면 +15
    if (stats.animalCount > 0) score += 15;
    // 다세포가 있으면 +15
    if (stats.multicellularCount > 0) score += 15;
    return score;
  })();

  const getHealthColor = (health: number): string => {
    if (health < 30) return '#ef4444';
    if (health < 60) return '#fbbf24';
    return '#4ade80';
  };

  return (
    <div className="ecosystem-panel panel">
      <h3>🌊 생태계</h3>

      {/* 생태계 건강도 */}
      <div className="eco-section">
        <div className="eco-section-title">생태계 건강도</div>
        <div className="health-bar-container">
          <div
            className="health-bar"
            style={{
              width: `${ecosystemHealth}%`,
              backgroundColor: getHealthColor(ecosystemHealth),
            }}
          />
          <span className="health-value">{ecosystemHealth}%</span>
        </div>
      </div>

      {/* 플랑크톤 섹션 */}
      <div className="eco-section">
        <div className="eco-section-title">🦠 플랑크톤</div>
        <div className="eco-grid">
          <div className="eco-item">
            <span className="eco-label phyto">🌿 식물성</span>
            <span className="eco-value">{stats.phytoplanktonCount}</span>
          </div>
          <div className="eco-item">
            <span className="eco-label zoo">🦐 동물성</span>
            <span className="eco-value">{stats.zooplanktonCount}</span>
          </div>
        </div>
        <div className="plankton-ratio">
          <span className="ratio-label">식물성 비율</span>
          <div className="ratio-bar-container">
            <div
              className="ratio-bar phyto-bar"
              style={{ width: `${planktonRatio}%` }}
            />
            <div
              className="ratio-bar zoo-bar"
              style={{ width: `${100 - parseFloat(planktonRatio)}%` }}
            />
          </div>
          <span className="ratio-value">{planktonRatio}%</span>
        </div>
      </div>

      {/* 먹이사슬 */}
      <div className="eco-section">
        <div className="eco-section-title">🔗 먹이사슬</div>
        <div className="food-chain">
          <div className="food-chain-level">
            <span className="chain-icon">☀️</span>
            <span className="chain-label">태양 에너지</span>
          </div>
          <div className="chain-arrow">↓</div>
          <div className="food-chain-level">
            <span className="chain-icon">🌿</span>
            <span className="chain-label">생산자 (광합성)</span>
            <span className="chain-count">{stats.plantCount + stats.phytoplanktonCount}</span>
          </div>
          <div className="chain-arrow">↓</div>
          <div className="food-chain-level">
            <span className="chain-icon">🐛</span>
            <span className="chain-label">1차 소비자</span>
            <span className="chain-count">{stats.herbivoreCount + stats.zooplanktonCount}</span>
          </div>
          <div className="chain-arrow">↓</div>
          <div className="food-chain-level">
            <span className="chain-icon">🦎</span>
            <span className="chain-label">2차 소비자</span>
            <span className="chain-count">{stats.carnivoreCount}</span>
          </div>
        </div>
      </div>

      {/* 서식지 현황 */}
      <div className="eco-section">
        <div className="eco-section-title">🗺️ 서식지</div>
        <div className="habitat-info">
          <div className="habitat-item">
            <span className="habitat-icon water">🌊</span>
            <span className="habitat-label">물</span>
            <span className="habitat-desc">플랑크톤, 물고기</span>
          </div>
          <div className="habitat-item">
            <span className="habitat-icon beach">🏖️</span>
            <span className="habitat-label">해변</span>
            <span className="habitat-desc">양서류 진화 가능</span>
          </div>
          <div className="habitat-item">
            <span className="habitat-icon land">🌿</span>
            <span className="habitat-label">육지</span>
            <span className="habitat-desc">
              {stats.canAnimalsSurvive ? '진출 가능' : '산소 부족'}
            </span>
          </div>
        </div>
      </div>

      {/* 시간 정보 */}
      <div className="eco-section">
        <div className="eco-section-title">⏱️ 시간</div>
        <div className="time-info">
          <div className="time-item">
            <span className="time-label">경과</span>
            <span className="time-value">
              {stats.currentYear}년 {stats.currentDay}일
            </span>
          </div>
          <div className="time-item">
            <span className="time-label">틱</span>
            <span className="time-value">{stats.currentTick.toLocaleString()}</span>
          </div>
          <div className="time-item">
            <span className="time-label">FPS</span>
            <span className="time-value">{stats.fps}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
