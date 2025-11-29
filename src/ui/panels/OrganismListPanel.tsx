/**
 * OrganismListPanel - 생명체 목록 패널
 *
 * 현재 살아있는 모든 생명체를 리스트로 표시합니다.
 * 가상화 스크롤, 필터/검색/정렬, 호버 하이라이트, 클릭 카메라 이동 지원
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useGameContext } from '../GameContext';
import { Organism } from '../../organism/Organism';
import './OrganismListPanel.css';

// 필터 타입
type KingdomFilter = 'all' | 'plant' | 'animal';
type DietFilter = 'all' | 'herbivore' | 'carnivore' | 'omnivore' | 'photosynthetic';
type SortKey = 'energy' | 'age' | 'generation' | 'size';
type SortOrder = 'asc' | 'desc';

// 가상 스크롤 설정
const ITEM_HEIGHT = 44; // 각 아이템 높이 (px)
const BUFFER_ITEMS = 5; // 위아래로 추가 렌더링할 아이템 수

interface OrganismListPanelProps {
  onHighlight?: (organismId: string | null) => void;
  onCameraMove?: (x: number, y: number) => void;
  onTrack?: (organismId: string) => void;
}

export function OrganismListPanel({
  onHighlight,
  onCameraMove,
  onTrack,
}: OrganismListPanelProps) {
  const { game } = useGameContext();
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [searchText, setSearchText] = useState('');
  const [kingdomFilter, setKingdomFilter] = useState<KingdomFilter>('all');
  const [dietFilter, setDietFilter] = useState<DietFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('energy');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(300);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

  // 생명체 데이터 업데이트
  useEffect(() => {
    if (!game) return;

    const updateOrganisms = () => {
      const simulation = game.getSimulation();
      const organismManager = simulation.getOrganismManager();
      if (!organismManager) return;

      const allOrganisms = organismManager.getOrganisms();
      const alive = allOrganisms.filter((o: Organism) => o.isAlive);
      setOrganisms(alive);
    };

    // 초기 로드
    updateOrganisms();

    // 주기적 업데이트 (500ms)
    const interval = setInterval(updateOrganisms, 500);

    return () => clearInterval(interval);
  }, [game]);

  // 컨테이너 높이 감지
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 필터링 및 정렬된 생명체 목록
  const filteredOrganisms = useMemo(() => {
    let result = [...organisms];

    // Kingdom 필터
    if (kingdomFilter !== 'all') {
      result = result.filter((o) => o.genome.kingdom === kingdomFilter);
    }

    // Diet 필터
    if (dietFilter !== 'all') {
      result = result.filter((o) => o.genome.diet === dietFilter);
    }

    // 검색 필터 (ID 앞 6자리)
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter((o) =>
        o.id.toLowerCase().includes(search)
      );
    }

    // 정렬
    result.sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortKey) {
        case 'energy':
          aVal = a.energy;
          bVal = b.energy;
          break;
        case 'age':
          aVal = a.age;
          bVal = b.age;
          break;
        case 'generation':
          aVal = a.generation;
          bVal = b.generation;
          break;
        case 'size':
          aVal = a.genome.size;
          bVal = b.genome.size;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [organisms, kingdomFilter, dietFilter, searchText, sortKey, sortOrder]);

  // 가상 스크롤 계산
  const { visibleItems, startIndex, totalHeight } = useMemo(() => {
    const total = filteredOrganisms.length;
    const totalH = total * ITEM_HEIGHT;

    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
    const end = Math.min(
      total,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_ITEMS
    );

    const visible = filteredOrganisms.slice(start, end);

    return {
      visibleItems: visible,
      startIndex: start,
      totalHeight: totalH,
    };
  }, [filteredOrganisms, scrollTop, containerHeight]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 호버 핸들러
  const handleMouseEnter = useCallback(
    (organism: Organism) => {
      onHighlight?.(organism.id);
    },
    [onHighlight]
  );

  const handleMouseLeave = useCallback(() => {
    onHighlight?.(null);
  }, [onHighlight]);

  // 클릭 핸들러 (더블클릭 감지 포함)
  const handleClick = useCallback(
    (organism: Organism) => {
      const now = Date.now();
      const last = lastClickRef.current;

      // 더블클릭 감지 (300ms 이내 같은 아이템)
      if (last && last.id === organism.id && now - last.time < 300) {
        // 더블클릭 - 추적 모드
        onTrack?.(organism.id);
        lastClickRef.current = null;
      } else {
        // 단일 클릭 - 카메라 이동
        onCameraMove?.(organism.x, organism.y);
        lastClickRef.current = { id: organism.id, time: now };
      }
    },
    [onCameraMove, onTrack]
  );

  // 정렬 토글
  const handleSortChange = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  }, [sortKey]);

  // Kingdom 레이블
  const getKingdomIcon = (kingdom: string) => {
    switch (kingdom) {
      case 'plant':
        return '🌱';
      case 'animal':
        return '🐾';
      default:
        return '●';
    }
  };

  // Diet 레이블
  const getDietLabel = (diet: string) => {
    switch (diet) {
      case 'herbivore':
        return '초';
      case 'carnivore':
        return '육';
      case 'omnivore':
        return '잡';
      case 'photosynthetic':
        return '광';
      default:
        return '?';
    }
  };

  return (
    <div className="organism-list-panel panel">
      <h3>📋 생명체 목록 ({filteredOrganisms.length}/{organisms.length})</h3>

      {/* 검색 */}
      <div className="list-search">
        <input
          type="text"
          placeholder="ID 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* 필터 */}
      <div className="list-filters">
        <select
          value={kingdomFilter}
          onChange={(e) => setKingdomFilter(e.target.value as KingdomFilter)}
        >
          <option value="all">전체</option>
          <option value="plant">🌱 식물</option>
          <option value="animal">🐾 동물</option>
        </select>

        <select
          value={dietFilter}
          onChange={(e) => setDietFilter(e.target.value as DietFilter)}
        >
          <option value="all">전체 식단</option>
          <option value="herbivore">초식</option>
          <option value="carnivore">육식</option>
          <option value="omnivore">잡식</option>
          <option value="photosynthetic">광합성</option>
        </select>
      </div>

      {/* 정렬 버튼 */}
      <div className="list-sort">
        <span className="sort-label">정렬:</span>
        {(['energy', 'age', 'generation', 'size'] as SortKey[]).map((key) => (
          <button
            key={key}
            className={`sort-btn ${sortKey === key ? 'active' : ''}`}
            onClick={() => handleSortChange(key)}
          >
            {key === 'energy' && '에너지'}
            {key === 'age' && '나이'}
            {key === 'generation' && '세대'}
            {key === 'size' && '크기'}
            {sortKey === key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      {/* 가상 스크롤 리스트 */}
      <div
        ref={containerRef}
        className="list-container"
        onScroll={handleScroll}
      >
        <div
          className="list-content"
          style={{ height: totalHeight, position: 'relative' }}
        >
          {visibleItems.map((organism, idx) => {
            const actualIndex = startIndex + idx;
            return (
              <div
                key={organism.id}
                className="list-item"
                style={{
                  position: 'absolute',
                  top: actualIndex * ITEM_HEIGHT,
                  height: ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                }}
                onMouseEnter={() => handleMouseEnter(organism)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(organism)}
              >
                <span className="item-icon">
                  {getKingdomIcon(organism.genome.kingdom)}
                </span>
                <span className="item-id">
                  #{organism.id.substring(0, 6)}
                </span>
                <span className={`item-diet diet-${organism.genome.diet}`}>
                  {getDietLabel(organism.genome.diet)}
                </span>
                <span className="item-energy">
                  {Math.round((organism.energy / organism.maxEnergy) * 100)}%
                </span>
                <span className="item-gen">
                  G{organism.generation}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 도움말 */}
      <div className="list-help">
        <span>클릭: 이동 | 더블클릭: 추적</span>
      </div>
    </div>
  );
}

export default OrganismListPanel;
