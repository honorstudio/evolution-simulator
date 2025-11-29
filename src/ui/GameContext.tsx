/**
 * GameContext - React Context로 Game 인스턴스 공유
 *
 * 모든 컴포넌트에서 Game 인스턴스에 접근할 수 있도록 합니다.
 */

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Game } from '../Game';

interface GameContextValue {
  game: Game | null;
  isReady: boolean;
  initGame: (canvas: HTMLCanvasElement) => Promise<void>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

interface GameProviderProps {
  children: React.ReactNode;
}

/**
 * GameProvider - Game 인스턴스를 생성하고 제공
 */
export function GameProvider({ children }: GameProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const gameRef = useRef<Game | null>(null);
  const initializingRef = useRef(false);

  const initGame = useCallback(async (canvas: HTMLCanvasElement) => {
    // 이미 초기화 중이거나 완료된 경우 스킵
    if (initializingRef.current || isReady) return;
    initializingRef.current = true;

    try {
      // 기존 게임이 있으면 정리
      if (gameRef.current) {
        gameRef.current.destroy();
      }

      // 새 게임 생성 및 초기화
      gameRef.current = new Game(canvas);
      await gameRef.current.init();
      setIsReady(true);
    } catch (error) {
      console.error('게임 초기화 실패:', error);
      initializingRef.current = false;
    }
  }, [isReady]);

  return (
    <GameContext.Provider value={{ game: gameRef.current, isReady, initGame }}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * useGameContext - GameContext 사용 훅
 */
export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext는 GameProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}
