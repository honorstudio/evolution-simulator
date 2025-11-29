/**
 * 도킹 시스템 상태 관리
 * Adobe 스타일의 패널 도킹, 탭 그룹, 플로팅 윈도우 지원
 */

import { create } from 'zustand';

// 패널 ID 타입
export type PanelId =
  | 'ecosystem'
  | 'stats'
  | 'organism-info'
  | 'organism-list'
  | 'brain-viewer'
  | 'disaster'
  | 'debug-info';

// 패널 정보
export interface PanelInfo {
  id: PanelId;
  title: string;
  icon: string;
  minWidth: number;
  minHeight: number;
}

// 패널 메타데이터
export const PANEL_INFO: Record<PanelId, PanelInfo> = {
  'ecosystem': {
    id: 'ecosystem',
    title: '생태계',
    icon: '🌊',
    minWidth: 200,
    minHeight: 150,
  },
  'stats': {
    id: 'stats',
    title: '통계',
    icon: '📊',
    minWidth: 200,
    minHeight: 200,
  },
  'organism-info': {
    id: 'organism-info',
    title: '개체 정보',
    icon: '🔬',
    minWidth: 200,
    minHeight: 150,
  },
  'organism-list': {
    id: 'organism-list',
    title: '생명체 목록',
    icon: '📋',
    minWidth: 220,
    minHeight: 250,
  },
  'brain-viewer': {
    id: 'brain-viewer',
    title: '신경망 뷰어',
    icon: '🧠',
    minWidth: 250,
    minHeight: 200,
  },
  'disaster': {
    id: 'disaster',
    title: '재앙',
    icon: '⚠️',
    minWidth: 200,
    minHeight: 150,
  },
  'debug-info': {
    id: 'debug-info',
    title: '기본 정보',
    icon: 'ℹ️',
    minWidth: 180,
    minHeight: 200,
  },
};

// 도킹 위치
export type DockPosition = 'left' | 'right' | 'floating';

// 드롭 영역 타입
export type DropZone =
  | 'tab'      // 탭으로 합치기
  | 'top'      // 위에 분할
  | 'bottom'   // 아래에 분할
  | 'left'     // 왼쪽에 분할
  | 'right';   // 오른쪽에 분할

// 탭 그룹 (여러 패널이 탭으로 묶임)
export interface TabGroup {
  id: string;
  panels: PanelId[];
  activePanel: PanelId;
}

// 도킹 컬럼 (세로로 쌓인 탭 그룹들)
export interface DockColumn {
  id: string;
  tabGroups: TabGroup[];
  width: number; // 픽셀
}

// 도킹 영역 (좌/우에 여러 컬럼)
export interface DockArea {
  columns: DockColumn[];
}

// 플로팅 윈도우
export interface FloatingWindow {
  id: string;
  panelId: PanelId;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
}

// 드래그 상태
export interface DragState {
  panelId: PanelId | null;
  sourceType: 'docked' | 'floating' | null;
  sourceGroupId: string | null;
}

// 도킹 스토어 상태
interface DockingState {
  // 좌/우 도킹 영역
  leftDock: DockArea;
  rightDock: DockArea;

  // 플로팅 윈도우
  floatingWindows: FloatingWindow[];

  // 드래그 상태
  dragState: DragState;

  // 드롭 프리뷰 (어디에 놓을지 미리보기)
  dropPreview: {
    targetGroupId: string | null;
    zone: DropZone | null;
  } | null;

  // 액션들
  openPanel: (panelId: PanelId) => void;
  closePanel: (panelId: PanelId) => void;
  togglePanel: (panelId: PanelId) => void;

  // 탭 관련
  setActiveTab: (groupId: string, panelId: PanelId) => void;

  // 드래그 앤 드롭
  startDrag: (panelId: PanelId, sourceType: 'docked' | 'floating', sourceGroupId: string | null) => void;
  updateDropPreview: (targetGroupId: string | null, zone: DropZone | null) => void;
  endDrag: () => void;
  dropPanel: (targetGroupId: string, zone: DropZone) => void;

  // 플로팅 윈도우
  moveFloatingWindow: (id: string, x: number, y: number) => void;
  resizeFloatingWindow: (id: string, width: number, height: number) => void;
  minimizeFloatingWindow: (id: string) => void;

  // 도킹
  dockToSide: (panelId: PanelId, side: 'left' | 'right') => void;
  undock: (panelId: PanelId) => void;
  undockAt: (panelId: PanelId, x: number, y: number) => void;

  // 플로팅 윈도우 상호작용
  mergeFloatingWindows: (sourcePanelId: PanelId, targetPanelId: PanelId) => void;
  splitFloatingWindow: (sourcePanelId: PanelId, targetPanelId: PanelId, position: 'top' | 'bottom') => void;

  // 컬럼/그룹 리사이즈
  resizeColumn: (dockSide: 'left' | 'right', columnId: string, width: number) => void;
  resizeTabGroup: (groupId: string, height: number) => void;

  // 패널 상태 확인
  isPanelOpen: (panelId: PanelId) => boolean;
  getPanelLocation: (panelId: PanelId) => { type: 'docked' | 'floating'; side?: 'left' | 'right'; groupId?: string } | null;
}

// 유틸리티: 고유 ID 생성
const generateId = () => Math.random().toString(36).substring(2, 9);

// 초기 레이아웃 (기존 레이아웃과 유사하게)
const initialLeftDock: DockArea = {
  columns: [{
    id: 'left-col-1',
    width: 220,
    tabGroups: [{
      id: 'left-group-1',
      panels: ['ecosystem'],
      activePanel: 'ecosystem',
    }],
  }],
};

const initialRightDock: DockArea = {
  columns: [{
    id: 'right-col-1',
    width: 280,
    tabGroups: [
      {
        id: 'right-group-1',
        panels: ['stats'],
        activePanel: 'stats',
      },
      {
        id: 'right-group-2',
        panels: ['organism-info'],
        activePanel: 'organism-info',
      },
      {
        id: 'right-group-3',
        panels: ['brain-viewer'],
        activePanel: 'brain-viewer',
      },
    ],
  }],
};

// 도킹 영역에서 패널 제거하는 유틸리티
const removePanelFromDock = (dock: DockArea, panelId: PanelId): DockArea => {
  return {
    columns: dock.columns
      .map(col => ({
        ...col,
        tabGroups: col.tabGroups
          .map(group => {
            const remainingPanels = group.panels.filter(p => p !== panelId);
            // 패널이 남아있을 때만 activePanel 결정
            if (remainingPanels.length === 0) {
              return { ...group, panels: remainingPanels, activePanel: group.activePanel };
            }
            const firstRemaining = remainingPanels[0] as PanelId;
            const newActivePanel: PanelId = group.activePanel === panelId
              ? firstRemaining
              : group.activePanel;
            return {
              ...group,
              panels: remainingPanels,
              activePanel: newActivePanel,
            };
          })
          .filter(group => group.panels.length > 0),
      }))
      .filter(col => col.tabGroups.length > 0),
  };
};

// 타겟 그룹이 있는 도킹 영역과 컬럼 인덱스 찾기
const findTargetLocation = (
  leftDock: DockArea,
  rightDock: DockArea,
  targetGroupId: string
): { dock: DockArea; side: 'left' | 'right'; colIndex: number; groupIndex: number } | null => {
  for (let colIndex = 0; colIndex < leftDock.columns.length; colIndex++) {
    const col = leftDock.columns[colIndex];
    if (!col) continue;
    for (let groupIndex = 0; groupIndex < col.tabGroups.length; groupIndex++) {
      const group = col.tabGroups[groupIndex];
      if (group && group.id === targetGroupId) {
        return { dock: leftDock, side: 'left', colIndex, groupIndex };
      }
    }
  }
  for (let colIndex = 0; colIndex < rightDock.columns.length; colIndex++) {
    const col = rightDock.columns[colIndex];
    if (!col) continue;
    for (let groupIndex = 0; groupIndex < col.tabGroups.length; groupIndex++) {
      const group = col.tabGroups[groupIndex];
      if (group && group.id === targetGroupId) {
        return { dock: rightDock, side: 'right', colIndex, groupIndex };
      }
    }
  }
  return null;
};

export const useDockingStore = create<DockingState>((set, get) => ({
  leftDock: initialLeftDock,
  rightDock: initialRightDock,
  floatingWindows: [],
  dragState: { panelId: null, sourceType: null, sourceGroupId: null },
  dropPreview: null,

  // 패널 열기
  openPanel: (panelId) => {
    const state = get();
    if (state.isPanelOpen(panelId)) return;

    // 화면 중앙에 플로팅 윈도우로 열기
    const info = PANEL_INFO[panelId];
    const newWindow: FloatingWindow = {
      id: generateId(),
      panelId,
      x: window.innerWidth / 2 - info.minWidth / 2,
      y: window.innerHeight / 2 - info.minHeight / 2,
      width: info.minWidth + 50,
      height: info.minHeight + 100,
      isMinimized: false,
    };

    set(state => ({
      floatingWindows: [...state.floatingWindows, newWindow],
    }));
  },

  // 패널 닫기
  closePanel: (panelId) => {
    set(state => ({
      floatingWindows: state.floatingWindows.filter(w => w.panelId !== panelId),
      leftDock: removePanelFromDock(state.leftDock, panelId),
      rightDock: removePanelFromDock(state.rightDock, panelId),
    }));
  },

  // 패널 토글
  togglePanel: (panelId) => {
    const state = get();
    if (state.isPanelOpen(panelId)) {
      state.closePanel(panelId);
    } else {
      state.openPanel(panelId);
    }
  },

  // 활성 탭 변경
  setActiveTab: (groupId, panelId) => {
    set(state => {
      const updateDock = (dock: DockArea): DockArea => ({
        columns: dock.columns.map(col => ({
          ...col,
          tabGroups: col.tabGroups.map(group =>
            group.id === groupId
              ? { ...group, activePanel: panelId }
              : group
          ),
        })),
      });

      return {
        leftDock: updateDock(state.leftDock),
        rightDock: updateDock(state.rightDock),
      };
    });
  },

  // 드래그 시작
  startDrag: (panelId, sourceType, sourceGroupId) => {
    set({
      dragState: { panelId, sourceType, sourceGroupId },
    });
  },

  // 드롭 프리뷰 업데이트
  updateDropPreview: (targetGroupId, zone) => {
    set({
      dropPreview: targetGroupId ? { targetGroupId, zone } : null,
    });
  },

  // 드래그 종료
  endDrag: () => {
    set({
      dragState: { panelId: null, sourceType: null, sourceGroupId: null },
      dropPreview: null,
    });
  },

  // 패널 드롭 - 핵심 로직
  dropPanel: (targetGroupId, zone) => {
    const state = get();
    const { panelId } = state.dragState;
    if (!panelId) return;

    set(currentState => {
      // 1. 모든 곳에서 해당 패널 제거
      let newLeftDock = removePanelFromDock(currentState.leftDock, panelId);
      let newRightDock = removePanelFromDock(currentState.rightDock, panelId);
      const newFloating = currentState.floatingWindows.filter(w => w.panelId !== panelId);

      // 2. 타겟 그룹 위치 찾기
      const location = findTargetLocation(newLeftDock, newRightDock, targetGroupId);
      if (!location) {
        console.warn('Target group not found:', targetGroupId);
        return {
          leftDock: newLeftDock,
          rightDock: newRightDock,
          floatingWindows: newFloating,
          dragState: { panelId: null, sourceType: null, sourceGroupId: null },
          dropPreview: null,
        };
      }

      const { side, colIndex, groupIndex } = location;
      const targetDock = side === 'left' ? newLeftDock : newRightDock;
      const targetColumn = targetDock.columns[colIndex];
      if (!targetColumn) {
        return {
          leftDock: newLeftDock,
          rightDock: newRightDock,
          floatingWindows: newFloating,
          dragState: { panelId: null, sourceType: null, sourceGroupId: null },
          dropPreview: null,
        };
      }

      // 3. zone에 따라 패널 추가
      let updatedDock: DockArea;

      switch (zone) {
        case 'tab':
          // 탭으로 합치기 - 기존 그룹에 패널 추가
          updatedDock = {
            columns: targetDock.columns.map((col, cIdx) =>
              cIdx === colIndex
                ? {
                    ...col,
                    tabGroups: col.tabGroups.map((group, gIdx) =>
                      gIdx === groupIndex
                        ? {
                            ...group,
                            panels: [...group.panels, panelId],
                            activePanel: panelId,
                          }
                        : group
                    ),
                  }
                : col
            ),
          };
          break;

        case 'top':
          // 위에 새 그룹 추가 (같은 컬럼 내)
          updatedDock = {
            columns: targetDock.columns.map((col, cIdx) =>
              cIdx === colIndex
                ? {
                    ...col,
                    tabGroups: [
                      ...col.tabGroups.slice(0, groupIndex),
                      {
                        id: generateId(),
                        panels: [panelId],
                        activePanel: panelId,
                      },
                      ...col.tabGroups.slice(groupIndex),
                    ],
                  }
                : col
            ),
          };
          break;

        case 'bottom':
          // 아래에 새 그룹 추가 (같은 컬럼 내)
          updatedDock = {
            columns: targetDock.columns.map((col, cIdx) =>
              cIdx === colIndex
                ? {
                    ...col,
                    tabGroups: [
                      ...col.tabGroups.slice(0, groupIndex + 1),
                      {
                        id: generateId(),
                        panels: [panelId],
                        activePanel: panelId,
                      },
                      ...col.tabGroups.slice(groupIndex + 1),
                    ],
                  }
                : col
            ),
          };
          break;

        case 'left':
          // 왼쪽에 새 컬럼 추가
          updatedDock = {
            columns: [
              ...targetDock.columns.slice(0, colIndex),
              {
                id: generateId(),
                width: 200,
                tabGroups: [{
                  id: generateId(),
                  panels: [panelId],
                  activePanel: panelId,
                }],
              },
              ...targetDock.columns.slice(colIndex),
            ],
          };
          break;

        case 'right':
          // 오른쪽에 새 컬럼 추가
          updatedDock = {
            columns: [
              ...targetDock.columns.slice(0, colIndex + 1),
              {
                id: generateId(),
                width: 200,
                tabGroups: [{
                  id: generateId(),
                  panels: [panelId],
                  activePanel: panelId,
                }],
              },
              ...targetDock.columns.slice(colIndex + 1),
            ],
          };
          break;

        default:
          updatedDock = targetDock;
      }

      // 4. 결과 반환
      return {
        leftDock: side === 'left' ? updatedDock : newLeftDock,
        rightDock: side === 'right' ? updatedDock : newRightDock,
        floatingWindows: newFloating,
        dragState: { panelId: null, sourceType: null, sourceGroupId: null },
        dropPreview: null,
      };
    });
  },

  // 플로팅 윈도우 이동
  moveFloatingWindow: (id, x, y) => {
    set(state => ({
      floatingWindows: state.floatingWindows.map(w =>
        w.id === id ? { ...w, x, y } : w
      ),
    }));
  },

  // 플로팅 윈도우 리사이즈
  resizeFloatingWindow: (id, width, height) => {
    set(state => ({
      floatingWindows: state.floatingWindows.map(w =>
        w.id === id ? { ...w, width, height } : w
      ),
    }));
  },

  // 플로팅 윈도우 최소화
  minimizeFloatingWindow: (id) => {
    set(state => ({
      floatingWindows: state.floatingWindows.map(w =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    }));
  },

  // 사이드에 도킹
  dockToSide: (panelId, side) => {
    set(state => {
      // 먼저 다른 곳에서 제거
      let newLeftDock = removePanelFromDock(state.leftDock, panelId);
      let newRightDock = removePanelFromDock(state.rightDock, panelId);
      const newFloating = state.floatingWindows.filter(w => w.panelId !== panelId);

      // 사이드에 추가
      const dock = side === 'left' ? newLeftDock : newRightDock;

      let updatedDock: DockArea;
      if (dock.columns.length === 0) {
        // 컬럼이 없으면 새로 생성
        updatedDock = {
          columns: [{
            id: generateId(),
            width: 220,
            tabGroups: [{
              id: generateId(),
              panels: [panelId],
              activePanel: panelId,
            }],
          }],
        };
      } else {
        // 첫 번째 컬럼의 마지막 그룹에 새 그룹 추가
        updatedDock = {
          columns: dock.columns.map((col, idx) =>
            idx === 0
              ? {
                  ...col,
                  tabGroups: [
                    ...col.tabGroups,
                    {
                      id: generateId(),
                      panels: [panelId],
                      activePanel: panelId,
                    },
                  ],
                }
              : col
          ),
        };
      }

      return {
        floatingWindows: newFloating,
        leftDock: side === 'left' ? updatedDock : newLeftDock,
        rightDock: side === 'right' ? updatedDock : newRightDock,
      };
    });
  },

  // 도킹 해제 (플로팅으로 - 화면 중앙)
  undock: (panelId) => {
    const info = PANEL_INFO[panelId];

    set(state => {
      const newWindow: FloatingWindow = {
        id: generateId(),
        panelId,
        x: window.innerWidth / 2 - info.minWidth / 2,
        y: window.innerHeight / 2 - info.minHeight / 2,
        width: info.minWidth + 50,
        height: info.minHeight + 100,
        isMinimized: false,
      };

      return {
        leftDock: removePanelFromDock(state.leftDock, panelId),
        rightDock: removePanelFromDock(state.rightDock, panelId),
        floatingWindows: [...state.floatingWindows, newWindow],
      };
    });
  },

  // 도킹 해제 (플로팅으로 - 지정 위치)
  undockAt: (panelId, x, y) => {
    const info = PANEL_INFO[panelId];

    set(state => {
      const newWindow: FloatingWindow = {
        id: generateId(),
        panelId,
        x: Math.max(0, x - 100), // 드롭 위치에서 약간 왼쪽으로
        y: Math.max(0, y - 20),  // 드롭 위치에서 약간 위로
        width: info.minWidth + 100,
        height: info.minHeight + 150,
        isMinimized: false,
      };

      return {
        leftDock: removePanelFromDock(state.leftDock, panelId),
        rightDock: removePanelFromDock(state.rightDock, panelId),
        floatingWindows: [...state.floatingWindows, newWindow],
        dragState: { panelId: null, sourceType: null, sourceGroupId: null },
        dropPreview: null,
      };
    });
  },

  // 플로팅 윈도우 합치기 (탭으로)
  // 두 윈도우를 합칠 수 없으므로, source를 target 위치에 새 윈도우로 배치
  mergeFloatingWindows: (sourcePanelId, targetPanelId) => {
    set(state => {
      const targetWindow = state.floatingWindows.find(w => w.panelId === targetPanelId);
      if (!targetWindow) return state;

      const sourceInfo = PANEL_INFO[sourcePanelId];

      // source 제거 (도킹/플로팅 모두)
      const newLeftDock = removePanelFromDock(state.leftDock, sourcePanelId);
      const newRightDock = removePanelFromDock(state.rightDock, sourcePanelId);
      let newFloating = state.floatingWindows.filter(w => w.panelId !== sourcePanelId);

      // target 위치에 source를 새 윈도우로 추가 (약간 오프셋)
      const newWindow: FloatingWindow = {
        id: generateId(),
        panelId: sourcePanelId,
        x: targetWindow.x + 30,
        y: targetWindow.y + 30,
        width: sourceInfo.minWidth + 100,
        height: sourceInfo.minHeight + 150,
        isMinimized: false,
      };

      return {
        leftDock: newLeftDock,
        rightDock: newRightDock,
        floatingWindows: [...newFloating, newWindow],
        dragState: { panelId: null, sourceType: null, sourceGroupId: null },
        dropPreview: null,
      };
    });
  },

  // 플로팅 윈도우 분할 (상/하)
  splitFloatingWindow: (sourcePanelId, targetPanelId, position) => {
    set(state => {
      const targetWindow = state.floatingWindows.find(w => w.panelId === targetPanelId);
      if (!targetWindow) return state;

      const sourceInfo = PANEL_INFO[sourcePanelId];

      // source 제거 (도킹/플로팅 모두)
      const newLeftDock = removePanelFromDock(state.leftDock, sourcePanelId);
      const newRightDock = removePanelFromDock(state.rightDock, sourcePanelId);
      let newFloating = state.floatingWindows.filter(w => w.panelId !== sourcePanelId);

      // target 윈도우 높이를 반으로 줄이고, source를 위/아래에 배치
      const halfHeight = Math.max(sourceInfo.minHeight, targetWindow.height / 2);

      // target 윈도우 업데이트
      newFloating = newFloating.map(w => {
        if (w.panelId === targetPanelId) {
          return {
            ...w,
            y: position === 'top' ? w.y + halfHeight : w.y,
            height: halfHeight,
          };
        }
        return w;
      });

      // source 윈도우 추가
      const newWindow: FloatingWindow = {
        id: generateId(),
        panelId: sourcePanelId,
        x: targetWindow.x,
        y: position === 'top' ? targetWindow.y : targetWindow.y + halfHeight,
        width: targetWindow.width,
        height: halfHeight,
        isMinimized: false,
      };

      return {
        leftDock: newLeftDock,
        rightDock: newRightDock,
        floatingWindows: [...newFloating, newWindow],
        dragState: { panelId: null, sourceType: null, sourceGroupId: null },
        dropPreview: null,
      };
    });
  },

  // 컬럼 리사이즈
  resizeColumn: (dockSide, columnId, width) => {
    set(state => {
      const updateDock = (dock: DockArea): DockArea => ({
        columns: dock.columns.map(col =>
          col.id === columnId ? { ...col, width: Math.max(150, width) } : col
        ),
      });

      return dockSide === 'left'
        ? { leftDock: updateDock(state.leftDock) }
        : { rightDock: updateDock(state.rightDock) };
    });
  },

  // 탭 그룹 리사이즈 (높이) - 나중에 구현
  resizeTabGroup: (_groupId, _height) => {
    // TODO: 구현
  },

  // 패널이 열려있는지 확인
  isPanelOpen: (panelId) => {
    const state = get();

    // 플로팅에서 확인
    if (state.floatingWindows.some(w => w.panelId === panelId)) return true;

    // 도킹에서 확인
    const checkDock = (dock: DockArea) =>
      dock.columns.some(col =>
        col.tabGroups.some(group =>
          group.panels.includes(panelId)
        )
      );

    return checkDock(state.leftDock) || checkDock(state.rightDock);
  },

  // 패널 위치 정보
  getPanelLocation: (panelId) => {
    const state = get();

    // 플로팅 확인
    const floating = state.floatingWindows.find(w => w.panelId === panelId);
    if (floating) {
      return { type: 'floating' as const };
    }

    // 좌측 도킹 확인
    for (const col of state.leftDock.columns) {
      for (const group of col.tabGroups) {
        if (group.panels.includes(panelId)) {
          return { type: 'docked' as const, side: 'left' as const, groupId: group.id };
        }
      }
    }

    // 우측 도킹 확인
    for (const col of state.rightDock.columns) {
      for (const group of col.tabGroups) {
        if (group.panels.includes(panelId)) {
          return { type: 'docked' as const, side: 'right' as const, groupId: group.id };
        }
      }
    }

    return null;
  },
}));
