/**
 * IndexedDB 기반 저장/불러오기 관리자
 *
 * 게임 상태를 브라우저 로컬 스토리지(IndexedDB)에 저장하고 불러옵니다.
 */

import {
  SaveData,
  SaveSlotInfo,
  SAVE_VERSION,
} from './types';

/**
 * 저장 관리자 클래스
 */
export class StorageManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'EvolutionSimulator';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'saves';
  private readonly MAX_SLOTS = 6; // 0: 자동저장, 1~5: 수동 저장

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      // DB 스키마 생성/업그레이드
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Object Store 생성 (이미 있으면 건너뜀)
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'meta.slotIndex',
          });

          // 인덱스 생성 (검색 최적화)
          store.createIndex('updatedAt', 'meta.updatedAt', { unique: false });
          store.createIndex('slotIndex', 'meta.slotIndex', { unique: true });

          console.log('IndexedDB 스토어 생성 완료');
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB 초기화 완료');
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB 초기화 실패:', event);
        reject(new Error('IndexedDB 초기화 실패'));
      };
    });
  }

  /**
   * 게임 저장
   *
   * @param slotIndex 저장 슬롯 (0: 자동저장, 1~5: 수동 저장)
   * @param saveData 저장할 데이터
   */
  async save(slotIndex: number, saveData: SaveData): Promise<void> {
    if (!this.db) {
      throw new Error('StorageManager가 초기화되지 않았습니다');
    }

    if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
      throw new Error(`잘못된 슬롯 번호: ${slotIndex} (0~${this.MAX_SLOTS - 1})`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      // 버전 정보 설정
      saveData.meta.version = SAVE_VERSION;
      saveData.meta.slotIndex = slotIndex;
      saveData.meta.updatedAt = Date.now();

      const request = store.put(saveData);

      request.onsuccess = () => {
        console.log(`슬롯 ${slotIndex} 저장 완료:`, saveData.meta.name);
        resolve();
      };

      request.onerror = () => {
        console.error(`슬롯 ${slotIndex} 저장 실패:`, request.error);
        reject(new Error('저장 실패'));
      };
    });
  }

  /**
   * 게임 불러오기
   *
   * @param slotIndex 불러올 슬롯 번호
   */
  async load(slotIndex: number): Promise<SaveData | null> {
    if (!this.db) {
      throw new Error('StorageManager가 초기화되지 않았습니다');
    }

    if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
      throw new Error(`잘못된 슬롯 번호: ${slotIndex}`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(slotIndex);

      request.onsuccess = () => {
        const data = request.result as SaveData | undefined;

        if (data) {
          // 버전 호환성 체크 (선택사항)
          if (data.meta.version !== SAVE_VERSION) {
            console.warn(
              `버전 불일치: 저장 ${data.meta.version}, 현재 ${SAVE_VERSION}`
            );
            // 필요시 마이그레이션 로직 추가
          }

          console.log(`슬롯 ${slotIndex} 불러오기 완료:`, data.meta.name);
          resolve(data);
        } else {
          console.log(`슬롯 ${slotIndex}에 저장 데이터 없음`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`슬롯 ${slotIndex} 불러오기 실패:`, request.error);
        reject(new Error('불러오기 실패'));
      };
    });
  }

  /**
   * 저장 데이터 삭제
   *
   * @param slotIndex 삭제할 슬롯 번호
   */
  async delete(slotIndex: number): Promise<void> {
    if (!this.db) {
      throw new Error('StorageManager가 초기화되지 않았습니다');
    }

    if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
      throw new Error(`잘못된 슬롯 번호: ${slotIndex}`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(slotIndex);

      request.onsuccess = () => {
        console.log(`슬롯 ${slotIndex} 삭제 완료`);
        resolve();
      };

      request.onerror = () => {
        console.error(`슬롯 ${slotIndex} 삭제 실패:`, request.error);
        reject(new Error('삭제 실패'));
      };
    });
  }

  /**
   * 모든 저장 슬롯 목록 가져오기
   */
  async getSlotList(): Promise<SaveSlotInfo[]> {
    if (!this.db) {
      throw new Error('StorageManager가 초기화되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allData = request.result as SaveData[];
        const slotMap = new Map<number, SaveData>();

        // 데이터를 슬롯 번호별로 매핑
        allData.forEach((data) => {
          slotMap.set(data.meta.slotIndex, data);
        });

        // 모든 슬롯 정보 생성
        const slotList: SaveSlotInfo[] = [];
        for (let i = 0; i < this.MAX_SLOTS; i++) {
          const data = slotMap.get(i);
          slotList.push({
            slotIndex: i,
            exists: !!data,
            meta: data?.meta,
          });
        }

        resolve(slotList);
      };

      request.onerror = () => {
        console.error('슬롯 목록 불러오기 실패:', request.error);
        reject(new Error('슬롯 목록 불러오기 실패'));
      };
    });
  }

  /**
   * 자동 저장 (슬롯 0 사용)
   *
   * @param saveData 저장할 데이터
   */
  async autoSave(saveData: SaveData): Promise<void> {
    saveData.meta.name = '[자동저장]';
    return this.save(0, saveData);
  }

  /**
   * 모든 저장 데이터 삭제 (리셋)
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('StorageManager가 초기화되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('모든 저장 데이터 삭제 완료');
        resolve();
      };

      request.onerror = () => {
        console.error('저장 데이터 삭제 실패:', request.error);
        reject(new Error('삭제 실패'));
      };
    });
  }

  /**
   * IndexedDB 연결 해제
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('IndexedDB 연결 해제');
    }
  }
}
