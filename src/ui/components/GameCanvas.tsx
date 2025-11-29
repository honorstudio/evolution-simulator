/**
 * GameCanvas - PixiJS 렌더링 캔버스
 *
 * Game 인스턴스와 연결되어 시뮬레이션을 화면에 표시합니다.
 */

import { useEffect, useRef } from 'react';
import { useGame } from '../hooks';

interface GameCanvasProps {
  onOrganismSelect?: (organismId: string | null) => void;
  highlightedOrganismId?: string | null;
}

export function GameCanvas({ onOrganismSelect, highlightedOrganismId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { game, isReady, initGame } = useGame();

  // 캔버스가 마운트되면 게임 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    // 게임 초기화 (캔버스 전달)
    initGame(canvasRef.current);
  }, [initGame]);

  // 게임이 준비되면 시작
  useEffect(() => {
    if (!game || !isReady) return;

    // 게임 시작
    game.start();

    return () => {
      // 게임 정지
      game.stop();
    };
  }, [game, isReady]);

  // 생명체 클릭 콜백 등록
  useEffect(() => {
    if (!game || !isReady || !onOrganismSelect) return;

    const renderer = game.getRenderer();
    if (renderer) {
      renderer.setOnOrganismClick(onOrganismSelect);
    }
  }, [game, isReady, onOrganismSelect]);

  // 하이라이트 개체 설정
  useEffect(() => {
    if (!game || !isReady) return;

    const renderer = game.getRenderer();
    if (renderer && renderer.setHighlightedOrganism) {
      renderer.setHighlightedOrganism(highlightedOrganismId || null);
    }
  }, [game, isReady, highlightedOrganismId]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
