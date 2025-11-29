/**
 * DebugInfoPanel - 기본 정보 패널
 *
 * FPS, 줌 레벨, 카메라 위치, 컨트롤 가이드 등을 표시합니다.
 * 기존 캔버스 위 디버그 오버레이를 대체합니다.
 */

import { useEffect, useState } from 'react';
import { useGameContext } from '../GameContext';
import './DebugInfoPanel.css';

export function DebugInfoPanel() {
  const { game } = useGameContext();
  const [fps, setFps] = useState(0);
  const [cameraInfo, setCameraInfo] = useState({ x: 0, y: 0, zoom: 1 });

  // 매 프레임 업데이트
  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      const renderer = game.getRenderer();
      if (renderer) {
        setFps(renderer.getFPS());
        setCameraInfo(renderer.getCameraInfo());
      }
    }, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [game]);

  return (
    <div className="debug-info-panel panel">
      <h3>Info</h3>

      {/* 성능 정보 */}
      <div className="debug-section">
        <div className="debug-row">
          <span className="debug-label">FPS</span>
          <span className={`debug-value ${fps < 30 ? 'low' : fps < 50 ? 'mid' : 'good'}`}>
            {fps}
          </span>
        </div>
      </div>

      {/* 카메라 정보 */}
      <div className="debug-section">
        <div className="debug-row">
          <span className="debug-label">Zoom</span>
          <span className="debug-value">{cameraInfo.zoom.toFixed(2)}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Position</span>
          <span className="debug-value">
            ({cameraInfo.x}, {cameraInfo.y})
          </span>
        </div>
      </div>

      {/* 컨트롤 가이드 */}
      <div className="debug-section controls">
        <div className="debug-title">Controls</div>
        <div className="control-item">
          <span className="key">Drag</span>
          <span className="desc">Move camera</span>
        </div>
        <div className="control-item">
          <span className="key">Wheel</span>
          <span className="desc">Zoom</span>
        </div>
        <div className="control-item">
          <span className="key">Z / X</span>
          <span className="desc">Zoom in/out</span>
        </div>
        <div className="control-item">
          <span className="key">Space</span>
          <span className="desc">Pause</span>
        </div>
        <div className="control-item">
          <span className="key">1-4</span>
          <span className="desc">Speed</span>
        </div>
      </div>
    </div>
  );
}

export default DebugInfoPanel;
