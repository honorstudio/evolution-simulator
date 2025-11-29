/**
 * useTimeControl - 시간 컨트롤 훅
 *
 * 게임 시간 관련 기능을 제공합니다.
 */

import { useEffect, useState } from 'react';
import { useGame } from './useGame';

export function useTimeControl() {
  const { game, isReady } = useGame();
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!game || !isReady) return;

    // 초기 상태 가져오기
    const timeManager = game.getSimulation().getTimeManager();
    setIsPaused(timeManager.isPaused());
    setSpeed(timeManager.getSpeed());
  }, [game, isReady]);

  /**
   * 일시정지/재생 토글
   */
  const togglePause = () => {
    if (!game) return;
    game.togglePause();
    setIsPaused(!isPaused);
  };

  /**
   * 게임 속도 변경
   */
  const changeSpeed = (newSpeed: number) => {
    if (!game) return;
    game.setSpeed(newSpeed);
    setSpeed(newSpeed);
  };

  return {
    isPaused,
    speed,
    togglePause,
    changeSpeed,
  };
}
