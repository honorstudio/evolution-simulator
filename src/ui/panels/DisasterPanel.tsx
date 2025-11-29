/**
 * 재앙 패널 컴포넌트
 * Phase 3: 재앙 시스템 UI
 *
 * 사용자가 재앙을 발생시키고 활성 재앙을 모니터링할 수 있습니다.
 */
import { useState, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import {
  DisasterType,
  DISASTER_CONFIGS,
  getAllDisasterTypes,
  Disaster,
} from '../../disaster';
import './DisasterPanel.css';

interface DisasterButtonProps {
  type: DisasterType;
  onClick: (type: DisasterType, intensity: number) => void;
  disabled: boolean;
  cooldownRemaining: number;
}

/**
 * 개별 재앙 버튼
 */
function DisasterButton({
  type,
  onClick,
  disabled,
  cooldownRemaining,
}: DisasterButtonProps) {
  const config = DISASTER_CONFIGS.get(type);
  if (!config) return null;

  const isOnCooldown = cooldownRemaining > 0;
  const cooldownSec = Math.ceil(cooldownRemaining / 1000);

  return (
    <button
      className={`disaster-button ${disabled || isOnCooldown ? 'disabled' : ''}`}
      onClick={() => onClick(type, 0.7 + Math.random() * 0.3)}
      disabled={disabled || isOnCooldown}
      title={config.description}
    >
      <span className="disaster-icon">{config.icon}</span>
      <span className="disaster-name">{config.name}</span>
      {isOnCooldown && (
        <span className="disaster-cooldown">{cooldownSec}s</span>
      )}
    </button>
  );
}

/**
 * 재앙 패널 메인 컴포넌트
 */
export function DisasterPanel() {
  const { game } = useGame();
  const [isExpanded, setIsExpanded] = useState(true);  // 기본값: 펼침
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [, setForceUpdate] = useState(0);

  // 강제 리렌더링 (쿨다운 업데이트용)
  const forceRerender = useCallback(() => {
    setForceUpdate((prev) => prev + 1);
  }, []);

  // 재앙 발생 핸들러
  const handleTriggerDisaster = useCallback(
    (type: DisasterType, intensity: number) => {
      if (!game) return;

      const engine = game.getSimulation();
      const config = DISASTER_CONFIGS.get(type);

      // 위치 결정 (전역 재앙이 아니면 화면 중앙)
      let position: { x: number; y: number } | undefined;
      if (config && !config.isGlobal) {
        const worldConfig = engine.getConfig();
        position = {
          x: worldConfig.worldWidth / 2 + (Math.random() - 0.5) * 500,
          y: worldConfig.worldHeight / 2 + (Math.random() - 0.5) * 500,
        };
      }

      engine.triggerDisaster(type, intensity, position);

      // 쿨다운 UI 업데이트를 위해 1초마다 리렌더
      const intervalId = setInterval(forceRerender, 1000);
      setTimeout(() => clearInterval(intervalId), 60000);
    },
    [game, forceRerender]
  );

  // 쿨다운 확인
  const getCooldownRemaining = useCallback(
    (type: DisasterType): number => {
      if (!game) return 0;
      const dm = game.getSimulation().getDisasterManager();
      return dm.getRemainingCooldown(type);
    },
    [game]
  );

  // 활성 재앙 목록
  const getActiveDisasters = useCallback(() => {
    if (!game) return [];
    return game.getSimulation().getActiveDisasters();
  }, [game]);

  if (!game) return null;

  const allTypes = getAllDisasterTypes();
  const activeDisasters = getActiveDisasters();

  // 카테고리 분류
  const categories = {
    all: '전체',
    geological: '지질',
    climate: '기후',
    biological: '생물',
    cosmic: '우주',
  };

  const filterByCategory = (type: DisasterType): boolean => {
    if (selectedCategory === 'all') return true;

    const config = DISASTER_CONFIGS.get(type);
    if (!config) return false;

    switch (selectedCategory) {
      case 'geological':
        return [
          DisasterType.METEOR_IMPACT,
          DisasterType.VOLCANIC_ERUPTION,
          DisasterType.EARTHQUAKE,
          DisasterType.TSUNAMI,
        ].includes(type);
      case 'climate':
        return [
          DisasterType.ICE_AGE,
          DisasterType.GLOBAL_WARMING,
          DisasterType.DROUGHT,
          DisasterType.MEGA_FLOOD,
        ].includes(type);
      case 'biological':
        return [DisasterType.PANDEMIC].includes(type);
      case 'cosmic':
        return [
          DisasterType.OXYGEN_SPIKE,
          DisasterType.OXYGEN_DEPLETION,
          DisasterType.SOLAR_FLARE,
        ].includes(type);
      default:
        return true;
    }
  };

  const filteredTypes = allTypes.filter(filterByCategory);

  return (
    <div className={`disaster-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* 헤더 */}
      <div
        className="disaster-panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="header-icon">🌋</span>
        <span className="header-title">재앙</span>
        {activeDisasters.length > 0 && (
          <span className="active-count">{activeDisasters.length}</span>
        )}
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* 확장된 내용 */}
      {isExpanded && (
        <div className="disaster-panel-content">
          {/* 카테고리 탭 */}
          <div className="category-tabs">
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                className={`category-tab ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 재앙 버튼 그리드 */}
          <div className="disaster-grid">
            {filteredTypes.map((type) => (
              <DisasterButton
                key={type}
                type={type}
                onClick={handleTriggerDisaster}
                disabled={false}
                cooldownRemaining={getCooldownRemaining(type)}
              />
            ))}
          </div>

          {/* 활성 재앙 목록 */}
          {activeDisasters.length > 0 && (
            <div className="active-disasters">
              <h4>진행 중인 재앙</h4>
              <ul>
                {activeDisasters.map((disaster: Disaster) => (
                  <li key={disaster.id} className="active-disaster-item">
                    <span className="disaster-icon">{disaster.config.icon}</span>
                    <span className="disaster-name">{disaster.config.name}</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(1 - disaster.getProgress()) * 100}%` }}
                      />
                    </div>
                    <span className="time-remaining">
                      {Math.ceil(disaster.getRemainingTime() / 1000)}s
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 경고 메시지 */}
          <div className="disaster-warning">
            ⚠️ 재앙은 생명체에 직접적인 영향을 미칩니다
          </div>
        </div>
      )}
    </div>
  );
}
