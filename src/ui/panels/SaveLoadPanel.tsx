/**
 * SaveLoadPanel - 저장/불러오기 패널
 *
 * 게임 저장 및 불러오기 UI를 제공합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../GameContext';
import { StorageManager, serializeGame, deserializeGame, SaveSlotInfo } from '../../storage';
import './SaveLoadPanel.css';

interface SaveLoadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveLoadPanel({ isOpen, onClose }: SaveLoadPanelProps) {
  const { game } = useGameContext();
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);
  const [storage] = useState(() => new StorageManager());
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [saveName, setSaveName] = useState('');

  // 저장소 초기화 및 슬롯 목록 로드
  useEffect(() => {
    async function init() {
      try {
        await storage.init();
        setIsInitialized(true);
        await loadSlots();
      } catch (error) {
        console.error('저장소 초기화 실패:', error);
        setMessage({ type: 'error', text: '저장소 초기화 실패' });
      }
    }
    if (isOpen) {
      init();
    }
  }, [isOpen, storage]);

  // 슬롯 목록 새로고침
  const loadSlots = useCallback(async () => {
    try {
      const slotList = await storage.getSlotList();
      setSlots(slotList);
    } catch (error) {
      console.error('슬롯 목록 로드 실패:', error);
    }
  }, [storage]);

  // 저장 처리
  const handleSave = useCallback(async (slotIndex: number) => {
    if (!game || !isInitialized || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const name = saveName || `저장 ${slotIndex}`;
      const saveData = serializeGame(game, slotIndex, name);
      await storage.save(slotIndex, saveData);

      setMessage({ type: 'success', text: `슬롯 ${slotIndex}에 저장 완료!` });
      setEditingSlot(null);
      setSaveName('');
      await loadSlots();
    } catch (error) {
      console.error('저장 실패:', error);
      setMessage({ type: 'error', text: '저장 실패' });
    } finally {
      setLoading(false);
    }
  }, [game, isInitialized, loading, saveName, storage, loadSlots]);

  // 불러오기 처리
  const handleLoad = useCallback(async (slotIndex: number) => {
    if (!game || !isInitialized || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const saveData = await storage.load(slotIndex);
      if (!saveData) {
        setMessage({ type: 'error', text: '저장 데이터 없음' });
        return;
      }

      // 게임 일시정지
      game.pause();

      // 데이터 복원
      deserializeGame(game, saveData);

      setMessage({ type: 'success', text: `슬롯 ${slotIndex} 불러오기 완료!` });

      // 잠시 후 패널 닫기
      setTimeout(() => {
        onClose();
        game.resume();
      }, 1000);
    } catch (error) {
      console.error('불러오기 실패:', error);
      setMessage({ type: 'error', text: '불러오기 실패' });
    } finally {
      setLoading(false);
    }
  }, [game, isInitialized, loading, storage, onClose]);

  // 삭제 처리
  const handleDelete = useCallback(async (slotIndex: number) => {
    if (!isInitialized || loading) return;

    if (!confirm(`슬롯 ${slotIndex}을(를) 삭제하시겠습니까?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      await storage.delete(slotIndex);
      setMessage({ type: 'success', text: `슬롯 ${slotIndex} 삭제 완료` });
      await loadSlots();
    } catch (error) {
      console.error('삭제 실패:', error);
      setMessage({ type: 'error', text: '삭제 실패' });
    } finally {
      setLoading(false);
    }
  }, [isInitialized, loading, storage, loadSlots]);

  // 날짜 포맷팅
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 플레이 시간 포맷팅
  const formatPlayTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    }
    return `${minutes}분 ${seconds % 60}초`;
  };

  if (!isOpen) return null;

  return (
    <div className="save-load-overlay" onClick={onClose}>
      <div className="save-load-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2>💾 저장/불러오기</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* 슬롯 목록 */}
        <div className="slots-container">
          {/* 자동 저장 슬롯 */}
          <div className="slot-section">
            <h3>🔄 자동 저장</h3>
            {slots.filter(s => s.slotIndex === 0).map(slot => (
              <SlotItem
                key={slot.slotIndex}
                slot={slot}
                loading={loading}
                onLoad={handleLoad}
                formatDate={formatDate}
                formatPlayTime={formatPlayTime}
                isAutoSave
              />
            ))}
          </div>

          {/* 수동 저장 슬롯 */}
          <h3>📁 저장 슬롯</h3>
          <div className="slots-list">
            {slots.filter(s => s.slotIndex > 0).map(slot => (
              <SlotItem
                key={slot.slotIndex}
                slot={slot}
                loading={loading}
                editing={editingSlot === slot.slotIndex}
                saveName={saveName}
                onSaveName={setSaveName}
                onStartEdit={() => {
                  setEditingSlot(slot.slotIndex);
                  setSaveName(slot.meta?.name || `저장 ${slot.slotIndex}`);
                }}
                onCancelEdit={() => {
                  setEditingSlot(null);
                  setSaveName('');
                }}
                onSave={handleSave}
                onLoad={handleLoad}
                onDelete={handleDelete}
                formatDate={formatDate}
                formatPlayTime={formatPlayTime}
              />
            ))}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="help-text">
          <p>💡 자동 저장은 5분마다 자동으로 저장됩니다.</p>
        </div>
      </div>
    </div>
  );
}

// 슬롯 아이템 컴포넌트
interface SlotItemProps {
  slot: SaveSlotInfo;
  loading: boolean;
  editing?: boolean;
  saveName?: string;
  onSaveName?: (name: string) => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSave?: (slotIndex: number) => void;
  onLoad: (slotIndex: number) => void;
  onDelete?: (slotIndex: number) => void;
  formatDate: (timestamp: number) => string;
  formatPlayTime: (ms: number) => string;
  isAutoSave?: boolean;
}

function SlotItem({
  slot,
  loading,
  editing,
  saveName,
  onSaveName,
  onStartEdit,
  onCancelEdit,
  onSave,
  onLoad,
  onDelete,
  formatDate,
  formatPlayTime,
  isAutoSave,
}: SlotItemProps) {
  return (
    <div className={`slot-item ${slot.exists ? 'has-data' : 'empty'}`}>
      <div className="slot-info">
        {!isAutoSave && <span className="slot-number">#{slot.slotIndex}</span>}

        {slot.exists && slot.meta ? (
          <>
            {editing ? (
              <input
                type="text"
                className="save-name-input"
                value={saveName}
                onChange={e => onSaveName?.(e.target.value)}
                placeholder="저장 이름 입력"
                autoFocus
              />
            ) : (
              <span className="slot-name">{slot.meta.name}</span>
            )}
            <div className="slot-details">
              <span>🕐 {formatDate(slot.meta.updatedAt)}</span>
              <span>⏱️ {formatPlayTime(slot.meta.playTime)}</span>
            </div>
          </>
        ) : (
          <span className="slot-empty">빈 슬롯</span>
        )}
      </div>

      <div className="slot-actions">
        {editing ? (
          <>
            <button
              className="btn btn-primary"
              onClick={() => onSave?.(slot.slotIndex)}
              disabled={loading}
            >
              저장
            </button>
            <button
              className="btn btn-secondary"
              onClick={onCancelEdit}
              disabled={loading}
            >
              취소
            </button>
          </>
        ) : (
          <>
            {slot.exists && (
              <button
                className="btn btn-primary"
                onClick={() => onLoad(slot.slotIndex)}
                disabled={loading}
              >
                불러오기
              </button>
            )}
            {!isAutoSave && (
              <button
                className="btn btn-secondary"
                onClick={onStartEdit}
                disabled={loading}
              >
                {slot.exists ? '덮어쓰기' : '저장'}
              </button>
            )}
            {slot.exists && !isAutoSave && (
              <button
                className="btn btn-danger"
                onClick={() => onDelete?.(slot.slotIndex)}
                disabled={loading}
              >
                삭제
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
