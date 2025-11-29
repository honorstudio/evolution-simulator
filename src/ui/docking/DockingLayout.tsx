/**
 * DockingLayout - 전체 도킹 레이아웃
 * 좌/우 도킹 영역과 플로팅 윈도우 관리
 * 메인 영역에 드롭하면 플로팅 윈도우로 변환
 */

import React, { useCallback, useState } from 'react';
import { useDockingStore, PanelId } from './dockingStore';
import { DockZone } from './DockZone';
import { FloatingWindow } from './FloatingWindow';
import './DockingLayout.css';

interface DockingLayoutProps {
  children: React.ReactNode; // 메인 컨텐츠 (캔버스 등)
  panels: Record<PanelId, React.ReactNode>;
}

export const DockingLayout: React.FC<DockingLayoutProps> = ({
  children,
  panels,
}) => {
  const {
    leftDock,
    rightDock,
    floatingWindows,
    dragState,
    undockAt,
    endDrag,
  } = useDockingStore();

  const [isDropTarget, setIsDropTarget] = useState(false);

  // 메인 영역 드래그 오버
  const handleDragOver = useCallback((e: React.DragEvent) => {
    // 드래그 중인 패널이 있을 때만 드롭 허용
    if (dragState.panelId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDropTarget(true);
    }
  }, [dragState.panelId]);

  // 메인 영역 드래그 리브
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 자식 요소로 이동하는 경우는 무시
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    setIsDropTarget(false);
  }, []);

  // 메인 영역에 드롭 - 플로팅 윈도우로 변환
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);

    if (dragState.panelId) {
      // 드롭 위치에 플로팅 윈도우 생성
      undockAt(dragState.panelId, e.clientX, e.clientY);
    } else {
      endDrag();
    }
  }, [dragState.panelId, undockAt, endDrag]);

  return (
    <div className="docking-layout">
      {/* 좌측 도킹 영역 */}
      <DockZone
        side="left"
        dockArea={leftDock}
        children={panels}
      />

      {/* 메인 컨텐츠 - 여기에 드롭하면 플로팅 */}
      <div
        className={`docking-main ${isDropTarget ? 'drop-target' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {children}

        {/* 드롭 가능 표시 */}
        {isDropTarget && dragState.panelId && (
          <div className="docking-main-drop-indicator">
            <div className="drop-indicator-content">
              <span className="drop-indicator-icon">📌</span>
              <span className="drop-indicator-text">여기에 놓으면 플로팅 윈도우로 변환</span>
            </div>
          </div>
        )}
      </div>

      {/* 우측 도킹 영역 */}
      <DockZone
        side="right"
        dockArea={rightDock}
        children={panels}
      />

      {/* 플로팅 윈도우들 */}
      {floatingWindows.map(win => (
        <FloatingWindow key={win.id} window={win}>
          {panels[win.panelId]}
        </FloatingWindow>
      ))}
    </div>
  );
};

export default DockingLayout;
