/**
 * DockZone - 좌/우 도킹 영역
 * 여러 컬럼과 탭 그룹을 포함
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useDockingStore, PanelId, DockArea } from './dockingStore';
import { PanelContainer } from './PanelContainer';
import './DockZone.css';

interface DockZoneProps {
  side: 'left' | 'right';
  dockArea: DockArea;
  children: Record<PanelId, React.ReactNode>;
}

export const DockZone: React.FC<DockZoneProps> = ({
  side,
  dockArea,
  children,
}) => {
  const {
    resizeColumn,
    endDrag,
    dockToSide,
    dragState,
  } = useDockingStore();

  const zoneRef = useRef<HTMLDivElement>(null);
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isMouseDragTarget, setIsMouseDragTarget] = useState(false);

  // 마우스 드래그 이벤트 리스너 (플로팅 윈도우에서 발생)
  useEffect(() => {
    const handleFloatingDragMove = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.dockZone === side) {
        setIsMouseDragTarget(true);
      } else {
        setIsMouseDragTarget(false);
      }
    };

    const handleFloatingDragEnd = () => {
      setIsMouseDragTarget(false);
    };

    document.addEventListener('floatingDragMove', handleFloatingDragMove);
    document.addEventListener('floatingDragEnd', handleFloatingDragEnd);

    return () => {
      document.removeEventListener('floatingDragMove', handleFloatingDragMove);
      document.removeEventListener('floatingDragEnd', handleFloatingDragEnd);
    };
  }, [side]);

  // 컬럼 리사이즈 시작
  const handleResizeStart = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    setResizingColumnId(columnId);

    const startX = e.clientX;
    const column = dockArea.columns.find(c => c.id === columnId);
    const startWidth = column?.width || 200;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = side === 'left'
        ? e.clientX - startX
        : startX - e.clientX;
      const newWidth = Math.max(150, startWidth + deltaX);
      resizeColumn(side, columnId, newWidth);
    };

    const handleMouseUp = () => {
      setResizingColumnId(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [side, dockArea.columns, resizeColumn]);

  // 드래그 오버 (빈 영역에 드롭 가능)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    // 드래그 중인 패널이 있을 때만 허용
    if (dragState.panelId || e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setIsDropTarget(true);
    }
  }, [dragState.panelId]);

  // 드래그 리브
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (zoneRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDropTarget(false);
  }, []);

  // 드롭 (빈 영역에)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);

    // dragState에서 panelId 확인, 없으면 dataTransfer에서 읽기
    const panelId = dragState.panelId || e.dataTransfer.getData('text/plain') as PanelId;
    if (!panelId) return;

    // 이 사이드에 도킹
    dockToSide(panelId, side);
    endDrag();
  }, [dragState.panelId, dockToSide, side, endDrag]);

  // 컬럼이 없으면 빈 영역 표시
  if (dockArea.columns.length === 0) {
    const showDropIndicator = isDropTarget || isMouseDragTarget;
    return (
      <div
        ref={zoneRef}
        className={`dock-zone dock-zone-${side} dock-zone-empty ${showDropIndicator ? 'drop-target' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dock-zone-placeholder">
          {showDropIndicator ? '여기에 놓으면 도킹' : '패널을 여기로 드래그'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={zoneRef}
      className={`dock-zone dock-zone-${side}`}
    >
      {/* 패널이 있을 때는 가장자리 드롭 영역 표시하지 않음 - PanelContainer의 탭/분할 가이드 사용 */}

      {dockArea.columns.map((column, colIndex) => (
        <React.Fragment key={column.id}>
          <div
            className="dock-column"
            style={{ width: column.width }}
          >
            {column.tabGroups.map((tabGroup) => (
              <PanelContainer
                key={tabGroup.id}
                tabGroup={tabGroup}
                children={children}
              />
            ))}
          </div>

          {/* 컬럼 사이 리사이즈 핸들 */}
          {colIndex < dockArea.columns.length - 1 && (
            <div
              className={`column-resize-handle ${resizingColumnId === column.id ? 'active' : ''}`}
              onMouseDown={(e) => handleResizeStart(e, column.id)}
            />
          )}
        </React.Fragment>
      ))}

      {/* 외부 리사이즈 핸들 (도킹 영역 전체 크기 조절) */}
      <div
        className={`zone-resize-handle ${side === 'left' ? 'handle-right' : 'handle-left'}`}
        onMouseDown={(e) => {
          if (dockArea.columns.length > 0) {
            const lastColIndex = side === 'left' ? dockArea.columns.length - 1 : 0;
            const col = dockArea.columns[lastColIndex];
            if (col) {
              handleResizeStart(e, col.id);
            }
          }
        }}
      />
    </div>
  );
};

export default DockZone;
