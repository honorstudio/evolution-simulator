/**
 * 도킹 시스템 모듈
 */

export { useDockingStore, PANEL_INFO } from './dockingStore';
export type { PanelId, PanelInfo, TabGroup, DockColumn, DockArea, FloatingWindow, DropZone } from './dockingStore';
export { PanelContainer } from './PanelContainer';
export { DockZone } from './DockZone';
export { FloatingWindow as FloatingWindowComponent } from './FloatingWindow';
export { DockingLayout } from './DockingLayout';
