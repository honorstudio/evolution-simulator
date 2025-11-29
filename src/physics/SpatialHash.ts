import { PhysicsBody } from './Body';
import { SPATIAL_HASH } from './constants';

/**
 * 공간 해시 그리드
 *
 * **문제**: 10,000개 객체의 충돌을 검사하면 약 5천만 번의 비교 필요 (O(n²))
 * **해결**: 공간을 격자로 나누어 근처 객체만 검사 (O(n))
 *
 * 예시:
 * - 격자 없이: 10,000 × 10,000 / 2 = 50,000,000 번 비교
 * - 격자 사용: 10,000 × 평균 10개 = 100,000 번 비교 (500배 빠름!)
 *
 * @template T - PhysicsBody를 구현한 타입
 */
export class SpatialHash<T extends PhysicsBody> {
  private cellSize: number;
  private grid: Map<string, T[]>;

  /**
   * @param cellSize - 격자 셀의 크기 (픽셀)
   *                   일반적으로 객체 크기의 2-3배가 적당
   */
  constructor(cellSize: number = SPATIAL_HASH.CELL_SIZE) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * 위치를 격자 키로 변환
   *
   * 예: (250, 350) → 셀 크기 100 → 키 "2,3"
   *
   * @private
   */
  public getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * 위치가 속한 모든 셀 키 목록
   *
   * 객체가 여러 셀에 걸쳐 있을 수 있으므로 모든 셀에 등록
   *
   * @private
   */
  private getCellKeys(body: T): string[] {
    const keys: string[] = [];

    // 객체가 차지하는 영역의 경계 계산
    const minX = body.position.x - body.radius;
    const maxX = body.position.x + body.radius;
    const minY = body.position.y - body.radius;
    const maxY = body.position.y + body.radius;

    // 경계가 속한 모든 셀의 키 생성
    const minCellX = Math.floor(minX / this.cellSize);
    const maxCellX = Math.floor(maxX / this.cellSize);
    const minCellY = Math.floor(minY / this.cellSize);
    const maxCellY = Math.floor(maxY / this.cellSize);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        keys.push(`${x},${y}`);
      }
    }

    return keys;
  }

  /**
   * 모든 객체 제거
   *
   * 매 프레임 시작 시 호출하여 격자를 초기화
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * 객체를 격자에 삽입
   *
   * 객체가 차지하는 모든 셀에 등록
   *
   * @param body - 삽입할 물리 바디
   */
  insert(body: T): void {
    const keys = this.getCellKeys(body);

    for (const key of keys) {
      // 해당 셀이 없으면 생성
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }

      // 셀에 객체 추가
      this.grid.get(key)!.push(body);
    }
  }

  /**
   * 근처 객체 조회
   *
   * 주어진 객체와 같은 셀 또는 인접 셀에 있는 객체들을 반환
   * 중복 제거를 위해 Set 사용
   *
   * @param body - 기준 물리 바디
   * @returns 근처 객체 배열
   */
  getNearby(body: T): T[] {
    const keys = this.getCellKeys(body);
    const nearby = new Set<T>();

    for (const key of keys) {
      const cell = this.grid.get(key);
      if (cell) {
        // 같은 셀의 모든 객체 추가 (자기 자신 제외)
        for (const other of cell) {
          if (other !== body) {
            nearby.add(other);
          }
        }
      }
    }

    return Array.from(nearby);
  }

  /**
   * 특정 영역의 객체 조회
   *
   * 원형 영역 내의 모든 객체를 찾습니다
   * 마우스 드래그 선택, 폭발 범위 등에 사용
   *
   * @param x - 중심 X 좌표
   * @param y - 중심 Y 좌표
   * @param radius - 검색 반경
   * @returns 영역 내 객체 배열
   */
  query(x: number, y: number, radius: number): T[] {
    const results = new Set<T>();

    // 검색 영역이 포함된 모든 셀 계산
    const minX = x - radius;
    const maxX = x + radius;
    const minY = y - radius;
    const maxY = y + radius;

    const minCellX = Math.floor(minX / this.cellSize);
    const maxCellX = Math.floor(maxX / this.cellSize);
    const minCellY = Math.floor(minY / this.cellSize);
    const maxCellY = Math.floor(maxY / this.cellSize);

    // 해당 셀들의 모든 객체 수집
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cell = this.grid.get(key);

        if (cell) {
          for (const body of cell) {
            // 정확한 거리 검사 (원형 영역)
            const dx = body.position.x - x;
            const dy = body.position.y - y;
            const distanceSquared = dx * dx + dy * dy;
            const radiusSquared = (radius + body.radius) * (radius + body.radius);

            if (distanceSquared <= radiusSquared) {
              results.add(body);
            }
          }
        }
      }
    }

    return Array.from(results);
  }

  /**
   * 격자 통계 정보 (디버깅용)
   */
  getStats(): { totalCells: number; totalObjects: number; avgObjectsPerCell: number } {
    let totalObjects = 0;

    for (const cell of this.grid.values()) {
      totalObjects += cell.length;
    }

    return {
      totalCells: this.grid.size,
      totalObjects,
      avgObjectsPerCell: this.grid.size > 0 ? totalObjects / this.grid.size : 0,
    };
  }

  /**
   * 격자 시각화 데이터 (디버그 렌더링용)
   */
  getDebugData(): { key: string; count: number; x: number; y: number }[] {
    const data: { key: string; count: number; x: number; y: number }[] = [];

    for (const [key, cell] of this.grid.entries()) {
      const parts = key.split(',').map(Number);
      const cellX = parts[0] ?? 0;
      const cellY = parts[1] ?? 0;
      data.push({
        key,
        count: cell.length,
        x: cellX * this.cellSize,
        y: cellY * this.cellSize,
      });
    }

    return data;
  }
}
