/**
 * StatsPanel - 통계 패널
 *
 * 실시간 시뮬레이션 통계를 표시합니다.
 */

import { useStats } from '../hooks';
import './StatsPanel.css';

export function StatsPanel() {
  const stats = useStats();

  // 산소 농도에 따른 색상 (0~30% 범위)
  const getOxygenColor = (oxygen: number): string => {
    if (oxygen < 1) return '#ff6b6b'; // 위험 - 빨강
    if (oxygen < 5) return '#ffa726'; // 낮음 - 주황
    if (oxygen < 15) return '#ffeb3b'; // 중간 - 노랑
    return '#4caf50'; // 정상 - 초록
  };

  return (
    <div className="stats-panel panel">
      <h3>📊 통계</h3>

      {/* 원시 지구 환경 섹션 */}
      <div className="stats-section environment-section">
        <div className="stats-section-title">🌍 {stats.era}</div>
        <div className="era-description">{stats.eraDescription}</div>

        <div className="stats-grid">
          <div className="stat-item full-width">
            <span className="stat-label">산소 농도</span>
            <div className="oxygen-bar-container">
              <div
                className="oxygen-bar"
                style={{
                  width: `${Math.min(stats.oxygen * 3.33, 100)}%`,
                  backgroundColor: getOxygenColor(stats.oxygen),
                }}
              />
              <span className="oxygen-value">{stats.oxygen.toFixed(3)}%</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-label">🌡️ 온도</span>
            <span className="stat-value">{stats.temperature.toFixed(1)}°C</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">CO₂</span>
            <span className="stat-value">{stats.carbonDioxide.toFixed(0)} ppm</span>
          </div>
        </div>

        {/* 진화 가능 상태 */}
        <div className="evolution-status">
          <span className={`status-badge ${stats.canMulticellularEvolve ? 'active' : 'inactive'}`}>
            {stats.canMulticellularEvolve ? '✓' : '✗'} 다세포 가능
          </span>
          <span className={`status-badge ${stats.canAnimalsSurvive ? 'active' : 'inactive'}`}>
            {stats.canAnimalsSurvive ? '✓' : '✗'} 동물 가능
          </span>
        </div>
      </div>

      {/* 개체수 섹션 */}
      <div className="stats-section">
        <div className="stats-section-title">개체 현황</div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">전체 생명체</span>
            <span className="stat-value">{stats.organisms}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">음식</span>
            <span className="stat-value">{stats.food}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label plant">🌱 식물</span>
            <span className="stat-value">{stats.plantCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label animal">🐾 동물</span>
            <span className="stat-value">{stats.animalCount}</span>
          </div>
        </div>
      </div>

      {/* 식단별 분포 */}
      <div className="stats-section">
        <div className="stats-section-title">식단별 분포</div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label herbivore">🌿 초식</span>
            <span className="stat-value">{stats.herbivoreCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label carnivore">🍖 육식</span>
            <span className="stat-value">{stats.carnivoreCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label omnivore">🍽️ 잡식</span>
            <span className="stat-value">{stats.omnivoreCount}</span>
          </div>
        </div>
      </div>

      {/* 출생/사망 */}
      <div className="stats-section">
        <div className="stats-section-title">생존 통계</div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">출생</span>
            <span className="stat-value success">{stats.births.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">사망</span>
            <span className="stat-value danger">{stats.deaths.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">세대</span>
            <span className="stat-value">{stats.generation.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">최대 개체수</span>
            <span className="stat-value">{stats.maxPopulation}</span>
          </div>
        </div>
      </div>

      {/* 평균 통계 */}
      <div className="stats-section">
        <div className="stats-section-title">평균 능력치</div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">에너지</span>
            <span className="stat-value">{stats.avgEnergy.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">수명</span>
            <span className="stat-value">
              {stats.avgLifespan > 0 ? Math.floor(stats.avgLifespan).toLocaleString() : '-'} 틱
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">속도</span>
            <span className="stat-value">{stats.avgSpeed.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">크기</span>
            <span className="stat-value">{stats.avgSize.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 최고 기록 */}
      <div className="stats-section">
        <div className="stats-section-title">최고 기록</div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">최고령</span>
            <span className="stat-value">{Math.floor(stats.oldestAge).toLocaleString()} 틱</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">최고 에너지</span>
            <span className="stat-value">{stats.highestEnergy.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Phase 2: 진화 단계 */}
      <div className="stats-section">
        <div className="stats-section-title">진화 단계</div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label single-cell">🔬 단세포</span>
            <span className="stat-value">{stats.singleCellCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label multicellular">🧬 다세포</span>
            <span className="stat-value">{stats.multicellularCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
