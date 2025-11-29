/**
 * PanelContainer - 도킹 가능한 패널 컨테이너
 * 드래그 핸들, 탭, 최소화/닫기 버튼 제공
 */

import React, { useCallback, useRef, useState } from 'react';
import { useDockingStore, PANEL_INFO, PanelId, TabGroup, DropZone } from './dockingStore';
import './PanelContainer.css';

interface PanelContainerProps {
  tabGroup: TabGroup;
  children: Record<PanelId, React.ReactNode>;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  tabGroup,
  children,
}) => {
  const {
    setActiveTab,
    closePanel,
    startDrag,
    endDrag,
    updateDropPreview,
    dropPanel,
    dragState,
    dropPreview,
  } = useDockingStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 드롭 영역 계산 - 간단하고 명확하게
  const calculateDropZone = useCallback((e: React.DragEvent): DropZone => {
    if (!containerRef.current || !headerRef.current) return 'tab';

    const containerRect = containerRef.current.getBoundingClientRect();
    const headerRect = headerRef.current.getBoundingClientRect();

    const x = e.clientX;
    const y = e.clientY;

    // 1. 헤더(탭바) 영역 - 탭으로 합치기
    if (y >= headerRect.top && y <= headerRect.bottom) {
      return 'tab';
    }

    // 컨텐츠 영역 내에서의 상대 위치 계산
    const contentTop = headerRect.bottom;
    const contentHeight = containerRect.bottom - contentTop;
    const contentLeft = containerRect.left;
    const contentWidth = containerRect.width;

    const relX = x - contentLeft;
    const relY = y - contentTop;

    // 가장자리 비율 (25%)
    const edgeRatio = 0.25;
    const leftEdge = contentWidth * edgeRatio;
    const rightEdge = contentWidth * (1 - edgeRatio);
    const topEdge = contentHeight * edgeRatio;
    const bottomEdge = contentHeight * (1 - edgeRatio);

    // 2. 좌측 25% - 왼쪽에 새 컬럼
    if (relX < leftEdge) return 'left';

    // 3. 우측 25% - 오른쪽에 새 컬럼
    if (relX > rightEdge) return 'right';

    // 4. 상단 25% - 위에 새 그룹
    if (relY < topEdge) return 'top';

    // 5. 하단 25% - 아래에 새 그룹
    if (relY > bottomEdge) return 'bottom';

    // 6. 중앙 - 탭으로 합치기
    return 'tab';
  }, []);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, panelId: PanelId) => {
    // 드래그 이미지 설정
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-ghost';
    dragImage.textContent = PANEL_INFO[panelId].title;
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      padding: 8px 16px;
      background: #0078d4;
      color: white;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 15);

    // 드래그 후 제거
    setTimeout(() => document.body.removeChild(dragImage), 0);

    e.dataTransfer.setData('text/plain', panelId);
    e.dataTransfer.effectAllowed = 'move';
    startDrag(panelId, 'docked', tabGroup.id);
  }, [startDrag, tabGroup.id]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // 드래그 오버
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // 자기 자신의 유일한 패널을 자기에게 드롭하는 것은 무시
    if (dragState.sourceGroupId === tabGroup.id && tabGroup.panels.length === 1) {
      updateDropPreview(null, null);
      return;
    }

    const zone = calculateDropZone(e);
    updateDropPreview(tabGroup.id, zone);
  }, [dragState.sourceGroupId, tabGroup.id, tabGroup.panels.length, calculateDropZone, updateDropPreview]);

  // 드래그 리브
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 자식 요소로 이동하는 경우 무시
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return;
    }
    updateDropPreview(null, null);
  }, [updateDropPreview]);

  // 드롭
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState.panelId) {
      endDrag();
      return;
    }

    // 자기 자신의 유일한 패널을 자기에게 드롭하는 것은 무시
    if (dragState.sourceGroupId === tabGroup.id && tabGroup.panels.length === 1) {
      endDrag();
      return;
    }

    const zone = calculateDropZone(e);
    dropPanel(tabGroup.id, zone);
  }, [dragState.panelId, dragState.sourceGroupId, tabGroup.id, tabGroup.panels.length, calculateDropZone, dropPanel, endDrag]);

  // 탭 클릭
  const handleTabClick = useCallback((panelId: PanelId) => {
    setActiveTab(tabGroup.id, panelId);
  }, [setActiveTab, tabGroup.id]);

  // 패널 닫기
  const handleClose = useCallback((e: React.MouseEvent, panelId: PanelId) => {
    e.stopPropagation();
    closePanel(panelId);
  }, [closePanel]);

  // 헤더 더블클릭 - 축소/확장
  const handleHeaderDoubleClick = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // 드롭 프리뷰 렌더링
  const renderDropPreview = () => {
    if (!dropPreview || dropPreview.targetGroupId !== tabGroup.id || !dropPreview.zone) {
      return null;
    }

    const zone = dropPreview.zone;

    return (
      <div className={`drop-preview drop-preview-${zone}`}>
        <div className="drop-preview-label">
          {zone === 'tab' && '탭으로 합치기'}
          {zone === 'top' && '위로 분할'}
          {zone === 'bottom' && '아래로 분할'}
          {zone === 'left' && '왼쪽으로 분할'}
          {zone === 'right' && '오른쪽으로 분할'}
        </div>
      </div>
    );
  };

  // 활성 패널 내용
  const activeContent = children[tabGroup.activePanel];

  return (
    <div
      ref={containerRef}
      className={`panel-container ${isCollapsed ? 'collapsed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 탭 헤더 */}
      <div
        ref={headerRef}
        className="panel-header"
        onDoubleClick={handleHeaderDoubleClick}
      >
        <div className="panel-tabs">
          {tabGroup.panels.map(panelId => {
            const info = PANEL_INFO[panelId];
            const isActive = panelId === tabGroup.activePanel;

            return (
              <div
                key={panelId}
                className={`panel-tab ${isActive ? 'active' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, panelId)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTabClick(panelId)}
              >
                <span className="tab-icon">{info.icon}</span>
                <span className="tab-title">{info.title}</span>
                <button
                  className="tab-close"
                  onClick={(e) => handleClose(e, panelId)}
                  title="닫기"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="panel-controls">
          <button
            className="panel-control-btn"
            onClick={() => setIsCollapsed(prev => !prev)}
            title={isCollapsed ? '확장' : '축소'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* 패널 내용 */}
      {!isCollapsed && (
        <div className="panel-content">
          {activeContent}
        </div>
      )}

      {/* 드롭 프리뷰 */}
      {renderDropPreview()}
    </div>
  );
};

export default PanelContainer;
