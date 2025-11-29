/**
 * useGame - Game 인스턴스 접근 훅
 */

import { useGameContext } from '../GameContext';

export function useGame() {
  const { game, isReady, initGame } = useGameContext();
  return { game, isReady, initGame };
}
