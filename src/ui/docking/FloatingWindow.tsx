/**
 * FloatingWindow - 플로팅 윈도우 컴포넌트
 * 드래그, 리사이즈, 최소화 지원
 * HTML5 Drag and Drop으로 도킹 영역에 다시 붙이기 지원
 */

import React, { useCallback, useRef, useState } from 'react';
import { useDockingStore, PANEL_INFO, FloatingWindow as FloatingWindowType, DropZone } from './dockingStore';
import './FloatingWindow.css';

interface FloatingWindowProps {
  window: FloatingWindowType;
  children: React.ReactNode;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
  window: win,
  children,
}) => {
  const {
    moveFloatingWindow,
    resizeFloatingWindow,
    minimizeFloatingWindow,
    closePanel,
    startDrag,
    endDrag,
    dockToSide,
    dragState,
    mergeFloatingWindows,
    splitFloatingWindow,
  } = useDockingStore();

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localDropZone, setLocalDropZone] = useState<DropZone | null>(null);

  const info = PANEL_INFO[win.panelId];

  // 윈도우 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.floating-control')) return;

    e.preventDefault();
    setIsDragging(true);

    // 드래그 상태 시작 - DockZone이 감지할 수 있도록
    startDrag(win.panelId, 'floating', null);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = win.x;
    const startPosY = win.y;

    // 도킹 영역 감지 함수 - 빈 도킹 영역에만 도킹 가이드 표시
    const getDockZoneAtPosition = (clientX: number): 'left' | 'right' | null => {
      // 좌측 도킹 영역 찾기
      const leftDock = document.querySelector('.dock-zone-left');
      const rightDock = document.querySelector('.dock-zone-right');

      // 빈 도킹 영역에만 도킹 가이드 표시
      if (leftDock && leftDock.classList.contains('dock-zone-empty')) {
        const threshold = 100;
        if (clientX < threshold) return 'left';
      }

      if (rightDock && rightDock.classList.contains('dock-zone-empty')) {
        const threshold = 100;
        if (clientX > window.innerWidth - threshold) return 'right';
      }

      return null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const newX = startPosX + (e.clientX - startX);
      const newY = startPosY + (e.clientY - startY);

      // 화면 밖으로 나가지 않도록 제한
      const clampedX = Math.max(0, Math.min(window.innerWidth - 100, newX));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 50, newY));

      moveFloatingWindow(win.id, clampedX, clampedY);

      // 도킹 영역 호버 시 시각적 피드백을 위한 커스텀 이벤트 발생
      const dockZone = getDockZoneAtPosition(e.clientX);
      document.dispatchEvent(new CustomEvent('floatingDragMove', {
        detail: { panelId: win.panelId, dockZone, clientX: e.clientX, clientY: e.clientY }
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 도킹 영역 위에서 놓으면 도킹
      const dockZone = getDockZoneAtPosition(e.clientX);
      if (dockZone) {
        dockToSide(win.panelId, dockZone);
      }

      // 드래그 상태 종료
      endDrag();

      // 드래그 종료 이벤트
      document.dispatchEvent(new CustomEvent('floatingDragEnd'));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [win.id, win.x, win.y, win.panelId, moveFloatingWindow, dockToSide, startDrag, endDrag]);

  // 리사이즈 시작
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = win.width;
    const startHeight = win.height;
    const startPosX = win.x;
    const startPosY = win.y;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      if (direction.includes('e')) {
        newWidth = Math.max(info.minWidth, startWidth + (e.clientX - startX));
      }
      if (direction.includes('w')) {
        const delta = startX - e.clientX;
        newWidth = Math.max(info.minWidth, startWidth + delta);
        newX = startPosX - delta;
      }
      if (direction.includes('s')) {
        newHeight = Math.max(info.minHeight, startHeight + (e.clientY - startY));
      }
      if (direction.includes('n')) {
        const delta = startY - e.clientY;
        newHeight = Math.max(info.minHeight, startHeight + delta);
        newY = startPosY - delta;
      }

      resizeFloatingWindow(win.id, newWidth, newHeight);
      if (direction.includes('w') || direction.includes('n')) {
        moveFloatingWindow(win.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [win.id, win.width, win.height, win.x, win.y, info.minWidth, info.minHeight, resizeFloatingWindow, moveFloatingWindow]);

  // 닫기
  const handleClose = useCallback(() => {
    closePanel(win.panelId);
  }, [closePanel, win.panelId]);

  // 최소화
  const handleMinimize = useCallback(() => {
    minimizeFloatingWindow(win.id);
  }, [minimizeFloatingWindow, win.id]);

  // ========== HTML5 드래그 앤 드롭 (도킹 영역으로 돌아가기 위함) ==========

  // 드래그 시작 (HTML5)
  const handleHTML5DragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', win.panelId);

    // 드래그 이미지 설정
    const dragImage = document.createElement('div');
    dragImage.textContent = `${info.icon} ${info.title}`;
    dragImage.style.cssText = 'position: absolute; top: -1000px; background: #333; color: white; padding: 8px 12px; border-radius: 4px; font-size: 13px;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    startDrag(win.panelId, 'floating', null);
  }, [win.panelId, info, startDrag]);

  // 드래그 종료 (HTML5)
  const handleHTML5DragEnd = useCallback(() => {
    endDrag();
    setLocalDropZone(null);
  }, [endDrag]);

  // 드롭 영역 계산 (탭, 상단, 하단만 - 좌우는 지원 안함)
  const calculateDropZone = useCallback((e: React.DragEvent): DropZone => {
    if (!windowRef.current || !headerRef.current) return 'tab';

    const headerRect = headerRef.current.getBoundingClientRect();
    const contentRect = windowRef.current.getBoundingClientRect();
    const y = e.clientY;

    // 헤더 영역 = 탭 합치기
    if (y >= headerRect.top && y <= headerRect.bottom) {
      return 'tab';
    }

    // 컨텐츠 영역 상단 30% = top
    const contentTop = headerRect.bottom;
    const contentHeight = contentRect.bottom - contentTop;
    const relY = y - contentTop;

    if (relY < contentHeight * 0.3) {
      return 'top';
    }
    // 컨텐츠 영역 하단 30% = bottom
    if (relY > contentHeight * 0.7) {
      return 'bottom';
    }

    // 그 외 = 탭
    return 'tab';
  }, []);

  // 드래그 오버 (다른 패널이 이 윈도우 위로 올 때)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    // 자기 자신은 드롭 불가
    if (dragState.panelId === win.panelId) return;
    if (!dragState.panelId) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const zone = calculateDropZone(e);
    setLocalDropZone(zone);
  }, [dragState.panelId, win.panelId, calculateDropZone]);

  // 드래그 리브
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 자식 요소로 이동하는 경우 무시
    if (windowRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setLocalDropZone(null);
  }, []);

  // 드롭 (다른 패널이 이 윈도우에 드롭됨)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sourcePanelId = dragState.panelId;
    if (!sourcePanelId || sourcePanelId === win.panelId) {
      setLocalDropZone(null);
      return;
    }

    const zone = localDropZone || calculateDropZone(e);

    if (zone === 'tab') {
      // 탭으로 합치기
      mergeFloatingWindows(sourcePanelId, win.panelId);
    } else if (zone === 'top' || zone === 'bottom') {
      // 상하 분할
      splitFloatingWindow(sourcePanelId, win.panelId, zone);
    }

    setLocalDropZone(null);
    endDrag();
  }, [dragState.panelId, win.panelId, localDropZone, calculateDropZone, mergeFloatingWindows, splitFloatingWindow, endDrag]);

  // 드롭 프리뷰 렌더링
  const renderDropPreview = () => {
    if (!localDropZone || dragState.panelId === win.panelId || !dragState.panelId) return null;

    let style: React.CSSProperties = {};
    let label = '';

    switch (localDropZone) {
      case 'tab':
        style = { top: 0, left: 0, right: 0, height: '32px' };
        label = '탭으로 합치기';
        break;
      case 'top':
        style = { top: '32px', left: 0, right: 0, height: 'calc(50% - 16px)' };
        label = '위에 배치';
        break;
      case 'bottom':
        style = { bottom: 0, left: 0, right: 0, height: 'calc(50% - 16px)' };
        label = '아래에 배치';
        break;
    }

    return (
      <div className="floating-drop-preview" style={style}>
        <span className="floating-drop-label">{label}</span>
      </div>
    );
  };

  return (
    <div
      ref={windowRef}
      className={`floating-window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${win.isMinimized ? 'minimized' : ''} ${localDropZone ? 'drop-target' : ''}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.isMinimized ? 200 : win.width,
        height: win.isMinimized ? 32 : win.height,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 드롭 프리뷰 */}
      {renderDropPreview()}

      {/* 타이틀 바 - 드래그 가능 */}
      <div
        ref={headerRef}
        className="floating-header"
        draggable
        onDragStart={handleHTML5DragStart}
        onDragEnd={handleHTML5DragEnd}
        onMouseDown={handleDragStart}
      >
        <div className="floating-title">
          <span className="floating-icon">{info.icon}</span>
          <span className="floating-name">{info.title}</span>
        </div>
        <div className="floating-controls">
          <button
            className="floating-control minimize"
            onClick={handleMinimize}
            title={win.isMinimized ? '확장' : '최소화'}
          >
            {win.isMinimized ? '□' : '−'}
          </button>
          <button
            className="floating-control close"
            onClick={handleClose}
            title="닫기"
          >
            ×
          </button>
        </div>
      </div>

      {/* 내용 */}
      {!win.isMinimized && (
        <div className="floating-content">
          {children}
        </div>
      )}

      {/* 리사이즈 핸들 */}
      {!win.isMinimized && (
        <>
          <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
        </>
      )}
    </div>
  );
};

export default FloatingWindow;
