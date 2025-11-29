/**
 * App - 메인 애플리케이션 컴포넌트
 * macOS/Windows 스타일 메뉴바 + Adobe 스타일 도킹 패널
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameProvider, useGameContext } from './ui/GameContext';
import { GameCanvas } from './ui/components/GameCanvas';
import { StatsPanel, OrganismInfoPanel, OrganismListPanel, DebugInfoPanel, SaveLoadPanel, BrainViewer, EcosystemPanel, BottomPanel } from './ui/panels';
import { DockingLayout, useDockingStore, PANEL_INFO, PanelId } from './ui/docking';
import { Organism } from './organism/Organism';
import { DisasterType } from './disaster';
import './ui/panels/MenuBar.css';

/**
 * 시간 컨트롤 타입
 */
interface TimeControlProps {
  isPaused: boolean;
  speed: number;
  togglePause: () => void;
  changeSpeed: (speed: number) => void;
}

/**
 * macOS/Windows 스타일 메뉴바
 */
function MenuBar({
  onNewGame,
  onSave,
  timeControl,
}: {
  onNewGame: () => void;
  onSave: () => void;
  timeControl: TimeControlProps;
}) {
  const { isPaused, speed, togglePause, changeSpeed } = timeControl;
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { game } = useGameContext();
  const menuRef = useRef<HTMLDivElement>(null);

  // 도킹 스토어
  const { togglePanel, isPanelOpen } = useDockingStore();

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 재앙 발생
  const triggerDisaster = (type: DisasterType) => {
    if (!game) return;
    const engine = game.getSimulation();
    const config = engine.getConfig();
    const position = {
      x: config.worldWidth / 2 + (Math.random() - 0.5) * 500,
      y: config.worldHeight / 2 + (Math.random() - 0.5) * 500,
    };
    engine.triggerDisaster(type, 0.7 + Math.random() * 0.3, position);
    setActiveMenu(null);
  };

  // 패널 토글
  const handleTogglePanel = (panelId: PanelId) => {
    togglePanel(panelId);
  };

  return (
    <div className="menu-bar" ref={menuRef}>
      {/* 앱 아이콘/이름 */}
      <div className="menu-bar-title">
        <span className="app-icon">◉</span>
        <span className="app-name">Evolution</span>
      </div>

      {/* 파일 메뉴 */}
      <div className="menu-item">
        <button
          className={`menu-trigger ${activeMenu === 'file' ? 'active' : ''}`}
          onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
        >
          파일
        </button>
        {activeMenu === 'file' && (
          <div className="menu-dropdown">
            <button className="dropdown-item" onClick={() => { onNewGame(); setActiveMenu(null); }}>
              <span className="item-icon">○</span>
              <span className="item-label">새 게임</span>
              <span className="item-shortcut">⌘N</span>
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => { onSave(); setActiveMenu(null); }}>
              <span className="item-icon">↓</span>
              <span className="item-label">저장</span>
              <span className="item-shortcut">⌘S</span>
            </button>
            <button className="dropdown-item" onClick={() => { onSave(); setActiveMenu(null); }}>
              <span className="item-icon">↑</span>
              <span className="item-label">불러오기</span>
              <span className="item-shortcut">⌘O</span>
            </button>
          </div>
        )}
      </div>

      {/* 윈도우 메뉴 */}
      <div className="menu-item">
        <button
          className={`menu-trigger ${activeMenu === 'window' ? 'active' : ''}`}
          onClick={() => setActiveMenu(activeMenu === 'window' ? null : 'window')}
        >
          윈도우
        </button>
        {activeMenu === 'window' && (
          <div className="menu-dropdown">
            {(Object.keys(PANEL_INFO) as PanelId[]).map(panelId => {
              const info = PANEL_INFO[panelId];
              const isOpen = isPanelOpen(panelId);
              return (
                <button
                  key={panelId}
                  className="dropdown-item"
                  onClick={() => { handleTogglePanel(panelId); setActiveMenu(null); }}
                >
                  <span className="item-icon">{isOpen ? '✓' : ' '}</span>
                  <span className="item-label">{info.icon} {info.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 재앙 메뉴 */}
      <div className="menu-item">
        <button
          className={`menu-trigger ${activeMenu === 'disaster' ? 'active' : ''}`}
          onClick={() => setActiveMenu(activeMenu === 'disaster' ? null : 'disaster')}
        >
          재앙
        </button>
        {activeMenu === 'disaster' && (
          <div className="menu-dropdown">
            <div className="dropdown-section">지질</div>
            <button className="dropdown-item" onClick={() => triggerDisaster(DisasterType.METEOR_IMPACT)}>
              <span className="item-icon">●</span>
              <span className="item-label">운석 충돌</span>
            </button>
            <button className="dropdown-item" onClick={() => triggerDisaster(DisasterType.VOLCANIC_ERUPTION)}>
              <span className="item-icon">▲</span>
              <span className="item-label">화산 폭발</span>
            </button>
            <button className="dropdown-item" onClick={() => triggerDisaster(DisasterType.EARTHQUAKE)}>
              <span className="item-icon">≈</span>
              <span className="item-label">지진</span>
            </button>
            <div className="dropdown-divider" />
            <div className="dropdown-section">기후</div>
            <button className="dropdown-item" onClick={() => triggerDisaster(DisasterType.ICE_AGE)}>
              <span className="item-icon">*</span>
              <span className="item-label">빙하기</span>
            </button>
            <button className="dropdown-item" onClick={() => triggerDisaster(DisasterType.GLOBAL_WARMING)}>
              <span className="item-icon">↑</span>
              <span className="item-label">온난화</span>
            </button>
            <div className="dropdown-divider" />
            <div className="dropdown-section">생물</div>
            <button className="dropdown-item" onClick={() => triggerDisaster(DisasterType.PANDEMIC)}>
              <span className="item-icon">◎</span>
              <span className="item-label">전염병</span>
            </button>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="menu-divider" />

      {/* 재생/일시정지 버튼 (직접 컨트롤) */}
      <button
        className={`control-btn ${isPaused ? '' : 'active'}`}
        onClick={togglePause}
        title="Space"
      >
        {isPaused ? '▶' : '❚❚'}
      </button>

      {/* 속도 버튼들 (직접 컨트롤) */}
      <div className="speed-controls">
        {[
          { value: 0.5, label: '½', key: '`' },
          { value: 1, label: '1', key: '1' },
          { value: 2, label: '2', key: '2' },
          { value: 5, label: '5', key: '3' },
          { value: 10, label: '10', key: '4' },
        ].map((opt) => (
          <button
            key={opt.value}
            className={`speed-btn ${speed === opt.value ? 'active' : ''}`}
            onClick={() => changeSpeed(opt.value)}
            title={`${opt.value}x (${opt.key})`}
          >
            {opt.label}×
          </button>
        ))}
      </div>

      {/* 구분선 */}
      <div className="menu-divider" />

      {/* 줌 컨트롤 힌트 */}
      <div className="zoom-hint">
        <span className="hint-icon">◎</span>
        <span className="hint-text">Z/X 줌</span>
      </div>

      {/* 우측 정보 영역 */}
      <div className="menu-bar-right">
        <span className="status-item">{isPaused ? '일시정지' : `${speed}x 재생중`}</span>
      </div>
    </div>
  );
}

/**
 * 개체 정보 팝업
 */
function OrganismPopup({
  organism,
  onClose
}: {
  organism: Organism | null;
  onClose: () => void;
}) {
  if (!organism) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-panel" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>개체 정보</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">ID</span>
              <span className="info-value">{organism.id.slice(0, 8)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">에너지</span>
              <span className="info-value">{organism.energy.toFixed(1)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">나이</span>
              <span className="info-value">{organism.age} 틱</span>
            </div>
            <div className="info-item">
              <span className="info-label">세대</span>
              <span className="info-value">{organism.generation}</span>
            </div>
            <div className="info-item">
              <span className="info-label">크기</span>
              <span className="info-value">{organism.genome.size.toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">속도</span>
              <span className="info-value">{organism.genome.speed.toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">위치</span>
              <span className="info-value">({organism.x.toFixed(0)}, {organism.y.toFixed(0)})</span>
            </div>
            <div className="info-item">
              <span className="info-label">식단</span>
              <span className="info-value">{organism.genome.diet}</span>
            </div>
          </div>
        </div>
        <div className="popup-footer">
          <span>ESC 또는 바깥 클릭으로 닫기</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 메인 게임 컴포넌트 (GameProvider 내부)
 */
function GameMain({ onNewGame }: { onNewGame: () => void }) {
  const [selectedOrganismId, setSelectedOrganismId] = useState<string | null>(null);
  const [selectedOrganism, setSelectedOrganism] = useState<Organism | null>(null);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showOrganismPopup, setShowOrganismPopup] = useState(false);
  const [highlightedOrganismId, setHighlightedOrganismId] = useState<string | null>(null);
  const [trackingOrganismId, setTrackingOrganismId] = useState<string | null>(null);
  const { game, isReady } = useGameContext();
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // 시간 컨트롤 상태 (한 곳에서 관리)
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  // 이전 일시정지 상태 저장
  const wasPausedBeforeSelectRef = useRef(false);

  // 초기 상태 동기화
  useEffect(() => {
    if (!game || !isReady) return;
    const timeManager = game.getSimulation().getTimeManager();
    setIsPaused(timeManager.isPaused());
    setSpeed(timeManager.getSpeed());
  }, [game, isReady]);

  // 일시정지 토글
  const togglePause = useCallback(() => {
    if (!game) return;
    game.togglePause();
    setIsPaused(prev => !prev);
  }, [game]);

  // 속도 변경
  const changeSpeed = useCallback((newSpeed: number) => {
    if (!game) return;
    game.setSpeed(newSpeed);
    setSpeed(newSpeed);
  }, [game]);

  // 새 게임 확인
  const handleNewGame = useCallback(() => {
    if (confirm('현재 진행 상황이 사라집니다. 새 게임을 시작하시겠습니까?')) {
      if (game) {
        game.destroy();
      }
      onNewGame();
    }
  }, [game, onNewGame]);

  // 생명체 선택 핸들러 - 일시정지 + 팝업
  const handleOrganismSelect = useCallback((organismId: string | null) => {
    setSelectedOrganismId(organismId);

    if (organismId && game) {
      // 선택 시 일시정지 (이전 상태 저장)
      if (!isPaused) {
        wasPausedBeforeSelectRef.current = false;
        togglePause();
      } else {
        wasPausedBeforeSelectRef.current = true;
      }

      // 선택된 개체 찾기
      const simulation = game.getSimulation();
      const organismManager = simulation.getOrganismManager();
      const organisms = organismManager ? organismManager.getOrganisms() : [];
      const found = organisms.find((o: Organism) => o.id === organismId);
      setSelectedOrganism(found || null);
      setShowOrganismPopup(true);
    }
  }, [game, isPaused, togglePause]);

  // 팝업 닫기
  const handleClosePopup = useCallback(() => {
    setShowOrganismPopup(false);
    setSelectedOrganism(null);
    setSelectedOrganismId(null);

    // 이전에 일시정지 상태가 아니었으면 재개
    if (!wasPausedBeforeSelectRef.current && isPaused) {
      togglePause();
    }
  }, [isPaused, togglePause]);

  // 생명체 목록에서 호버 하이라이트
  const handleListHighlight = useCallback((organismId: string | null) => {
    setHighlightedOrganismId(organismId);
  }, []);

  // 생명체 목록에서 카메라 이동 (현재 줌 유지, UI 영역 고려)
  const handleCameraMove = useCallback((x: number, y: number) => {
    if (!game) return;

    const renderer = game.getRenderer();
    if (!renderer) return;

    const camera = renderer.getCamera();

    // UI 영역 고려한 오프셋 계산
    // 좌측 패널: ~250px, 우측 패널: ~300px, 하단 패널: ~80px, 상단 메뉴: ~32px
    const leftPanelWidth = 250;
    const rightPanelWidth = 300;
    const topMenuHeight = 32;
    const bottomPanelHeight = 80;

    // 사용 가능 영역의 중앙으로 오프셋 계산
    const offsetX = (leftPanelWidth - rightPanelWidth) / 2;
    const offsetY = (topMenuHeight - bottomPanelHeight) / 2;

    // 현재 줌 레벨 유지하면서 목표 위치로 이동
    // UI 오프셋을 월드 좌표로 변환해서 적용
    const zoom = camera.getZoom();
    const worldOffsetX = offsetX / zoom;
    const worldOffsetY = offsetY / zoom;

    camera.moveTo(x - worldOffsetX, y - worldOffsetY);

    // 추적 모드 해제
    setTrackingOrganismId(null);
  }, [game]);

  // 생명체 추적 모드
  const handleTrackOrganism = useCallback((organismId: string) => {
    setTrackingOrganismId(organismId);
    setSelectedOrganismId(organismId);
  }, []);

  // 추적 모드: 매 프레임 카메라 업데이트
  useEffect(() => {
    if (!trackingOrganismId || !game) return;

    const trackInterval = setInterval(() => {
      const simulation = game.getSimulation();
      const organismManager = simulation.getOrganismManager();
      if (!organismManager) return;

      const organisms = organismManager.getOrganisms();
      const tracked = organisms.find((o: Organism) => o.id === trackingOrganismId);

      if (tracked && tracked.isAlive) {
        handleCameraMove(tracked.x, tracked.y);
      } else {
        // 생명체가 죽으면 추적 해제
        setTrackingOrganismId(null);
      }
    }, 50); // 20fps로 추적

    return () => clearInterval(trackInterval);
  }, [trackingOrganismId, game, handleCameraMove]);

  // 마우스 위치 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 팝업 열린 상태에서 ESC
      if (e.key === 'Escape' && showOrganismPopup) {
        handleClosePopup();
        return;
      }

      switch (e.key) {
        case ' ': // Space - 일시정지/재생
          e.preventDefault();
          togglePause();
          break;
        case '`': // ` - 0.5x
        case '~':
          e.preventDefault();
          changeSpeed(0.5);
          break;
        case '1': // 1 - 1x
          e.preventDefault();
          changeSpeed(1);
          break;
        case '2': // 2 - 2x
          e.preventDefault();
          changeSpeed(2);
          break;
        case '3': // 3 - 5x
          e.preventDefault();
          changeSpeed(5);
          break;
        case '4': // 4 - 10x
          e.preventDefault();
          changeSpeed(10);
          break;
        case 'z': // Z - 줌 인 (마우스 기준)
        case 'Z':
          if (game) {
            const renderer = game.getRenderer();
            if (renderer) {
              const camera = renderer.getCamera();
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = mousePositionRef.current.x - rect.left;
                const mouseY = mousePositionRef.current.y - rect.top;
                camera.zoomAt(mouseX, mouseY, 100);
              }
            }
          }
          break;
        case 'x': // X - 줌 아웃 (마우스 기준)
        case 'X':
          if (game) {
            const renderer = game.getRenderer();
            if (renderer) {
              const camera = renderer.getCamera();
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = mousePositionRef.current.x - rect.left;
                const mouseY = mousePositionRef.current.y - rect.top;
                camera.zoomAt(mouseX, mouseY, -100);
              }
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, changeSpeed, game, showOrganismPopup, handleClosePopup]);

  // 시간 컨트롤 props
  const timeControl: TimeControlProps = {
    isPaused,
    speed,
    togglePause,
    changeSpeed,
  };

  // 패널 컴포넌트들
  const panels: Record<PanelId, React.ReactNode> = {
    'ecosystem': <EcosystemPanel />,
    'stats': <StatsPanel />,
    'organism-info': <OrganismInfoPanel organismId={selectedOrganismId} />,
    'organism-list': (
      <OrganismListPanel
        onHighlight={handleListHighlight}
        onCameraMove={handleCameraMove}
        onTrack={handleTrackOrganism}
      />
    ),
    'brain-viewer': <BrainViewer organismId={selectedOrganismId} />,
    'disaster': <div className="panel">재앙 패널 (개발 중)</div>,
    'debug-info': <DebugInfoPanel />,
  };

  return (
    <div className="app">
      {/* macOS/Windows 스타일 메뉴바 */}
      <MenuBar
        onNewGame={handleNewGame}
        onSave={() => setShowSaveLoad(true)}
        timeControl={timeControl}
      />

      {/* 메인 영역 - 도킹 레이아웃 */}
      <main className="app-main with-menubar">
        <DockingLayout panels={panels}>
          {/* 시뮬레이션 캔버스 */}
          <GameCanvas
            onOrganismSelect={handleOrganismSelect}
            highlightedOrganismId={highlightedOrganismId || selectedOrganismId}
          />
        </DockingLayout>
      </main>

      {/* 하단 패널 */}
      <BottomPanel />

      {/* 저장/불러오기 모달 */}
      <SaveLoadPanel
        isOpen={showSaveLoad}
        onClose={() => setShowSaveLoad(false)}
      />

      {/* 개체 정보 팝업 */}
      {showOrganismPopup && (
        <OrganismPopup organism={selectedOrganism} onClose={handleClosePopup} />
      )}
    </div>
  );
}

/**
 * App - 메인 애플리케이션
 */
function App() {
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // 새 게임 시작 (GameProvider 재생성, 시작 화면으로 돌아가지 않음)
  const handleNewGame = useCallback(() => {
    // 시작 화면으로 돌아가지 않고 게임만 리셋
    setGameKey(prev => prev + 1);
  }, []);

  // 시작 화면
  if (!started) {
    return (
      <div className="start-screen">
        <div className="start-content">
          <h1>Evolution Simulator</h1>
          <p>AI 기반 생태계 진화 시뮬레이션</p>
          <button onClick={() => setStarted(true)}>시작하기</button>
        </div>
      </div>
    );
  }

  // 메인 게임 화면
  return (
    <GameProvider key={gameKey}>
      <GameMain onNewGame={handleNewGame} />
    </GameProvider>
  );
}

export default App;
