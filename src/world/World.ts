/**
 * 월드 클래스
 * 전체 게임 월드를 관리하고 청크 기반으로 지형을 로드/언로드합니다
 */

import { Tile, BiomeType } from './Tile';
import { Atmosphere, AtmosphereManager, INITIAL_ATMOSPHERE } from './Atmosphere';
import { TerrainGenerator } from './TerrainGenerator';
import { WORLD_CONFIG } from './WorldConfig';

/**
 * 청크 인터페이스
 * 월드의 일부 영역을 나타냅니다
 */
interface Chunk {
  // 청크의 청크 좌표 (0, 0), (1, 0) 등
  chunkX: number;
  chunkY: number;

  // 청크에 포함된 모든 타일
  tiles: Tile[][];

  // 청크가 메모리에 로드되어 있는지 여부
  loaded: boolean;

  // 청크 생성 시간 (메모리 관리용)
  createdAt: number;
}

export class World {
  // 월드의 가로 크기
  private width: number;

  // 월드의 세로 크기
  private height: number;

  // 청크의 크기
  private chunkSize: number;

  // 청크를 저장하는 맵 (키: "chunkX,chunkY")
  private chunks: Map<string, Chunk>;

  // 지형 생성기
  private terrainGenerator: TerrainGenerator;

  // 대기 관리자
  private atmosphereManager: AtmosphereManager;

  /**
   * World 생성자
   */
  constructor() {
    this.width = WORLD_CONFIG.width;
    this.height = WORLD_CONFIG.height;
    this.chunkSize = WORLD_CONFIG.chunkSize;
    this.chunks = new Map();
    this.terrainGenerator = new TerrainGenerator();
    this.atmosphereManager = new AtmosphereManager(INITIAL_ATMOSPHERE);
  }

  /**
   * 월드 정보를 반환합니다
   * @returns 월드의 가로, 세로, 청크 크기
   */
  public getWorldSize(): {
    width: number;
    height: number;
    chunkSize: number;
  } {
    return {
      width: this.width,
      height: this.height,
      chunkSize: this.chunkSize,
    };
  }

  /**
   * 특정 좌표의 타일을 반환합니다
   * @param x - 타일의 x 좌표
   * @param y - 타일의 y 좌표
   * @returns 해당 위치의 타일, 없으면 null
   */
  public getTile(x: number, y: number): Tile | null {
    // 월드 경계 확인
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }

    // 어느 청크에 속하는지 계산
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);

    // 청크 로드 (없으면 생성)
    const chunk = this.getChunk(chunkX, chunkY);

    // 청크 내에서의 상대 좌표
    const localX = x % this.chunkSize;
    const localY = y % this.chunkSize;

    const row = chunk.tiles[localY];
    return row ? (row[localX] ?? null) : null;
  }

  /**
   * 특정 영역의 타일들을 반환합니다
   * @param startX - 시작 x 좌표
   * @param startY - 시작 y 좌표
   * @param width - 가로 범위
   * @param height - 세로 범위
   * @returns 해당 영역의 타일 2D 배열
   */
  public getTiles(
    startX: number,
    startY: number,
    width: number,
    height: number
  ): Tile[][] {
    const result: Tile[][] = [];

    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        const tile = this.getTile(startX + x, startY + y);
        if (tile) {
          row[x] = tile;
        }
      }
      result[y] = row;
    }

    return result;
  }

  /**
   * 청크를 로드하거나 캐시에서 가져옵니다
   * @param chunkX - 청크의 x 좌표
   * @param chunkY - 청크의 y 좌표
   * @returns 로드된 청크
   */
  private getChunk(chunkX: number, chunkY: number): Chunk {
    const key = `${chunkX},${chunkY}`;

    // 이미 로드된 청크가 있으면 반환
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!;
    }

    // 청크 생성
    const chunk = this.generateChunk(chunkX, chunkY);
    this.chunks.set(key, chunk);

    return chunk;
  }

  /**
   * 청크를 생성합니다
   * @param chunkX - 청크의 x 좌표
   * @param chunkY - 청크의 y 좌표
   * @returns 생성된 청크
   */
  private generateChunk(chunkX: number, chunkY: number): Chunk {
    // 청크의 월드 좌표
    const worldX = chunkX * this.chunkSize;
    const worldY = chunkY * this.chunkSize;

    // 지형 생성
    const tiles = this.terrainGenerator.generate(
      worldX,
      worldY,
      this.chunkSize,
      this.chunkSize
    );

    return {
      chunkX,
      chunkY,
      tiles,
      loaded: true,
      createdAt: Date.now(),
    };
  }

  /**
   * 특정 청크를 메모리에서 언로드합니다
   * @param chunkX - 청크의 x 좌표
   * @param chunkY - 청크의 y 좌표
   */
  public unloadChunk(chunkX: number, chunkY: number): void {
    const key = `${chunkX},${chunkY}`;
    this.chunks.delete(key);
  }

  /**
   * 모든 로드된 청크를 언로드합니다
   */
  public unloadAllChunks(): void {
    this.chunks.clear();
  }

  /**
   * 현재 로드된 청크의 개수를 반환합니다
   * @returns 로드된 청크 개수
   */
  public getLoadedChunkCount(): number {
    return this.chunks.size;
  }

  /**
   * 현재 대기 상태를 반환합니다
   * @returns 대기 정보
   */
  public getAtmosphere(): Atmosphere {
    return this.atmosphereManager.getAtmosphere();
  }

  /**
   * 대기 관리자를 반환합니다
   * @returns 대기 관리자 인스턴스
   */
  public getAtmosphereManager(): AtmosphereManager {
    return this.atmosphereManager;
  }

  /**
   * 특정 바이옴의 모든 타일을 찾습니다
   * 주의: 로드된 청크만 검색합니다
   * @param biome - 검색할 바이옴 타입
   * @returns 해당 바이옴의 타일 배열
   */
  public findTilesByBiome(biome: BiomeType): Tile[] {
    const result: Tile[] = [];

    // 모든 로드된 청크를 순회
    for (const chunk of this.chunks.values()) {
      for (const row of chunk.tiles) {
        for (const tile of row) {
          if (tile.biome === biome) {
            result.push(tile);
          }
        }
      }
    }

    return result;
  }

  /**
   * 특정 조건을 만족하는 모든 타일을 찾습니다
   * @param predicate - 타일 조건 함수
   * @returns 조건을 만족하는 타일 배열
   */
  public findTiles(predicate: (tile: Tile) => boolean): Tile[] {
    const result: Tile[] = [];

    for (const chunk of this.chunks.values()) {
      for (const row of chunk.tiles) {
        for (const tile of row) {
          if (predicate(tile)) {
            result.push(tile);
          }
        }
      }
    }

    return result;
  }

  /**
   * 실제 월드 좌표(픽셀)로 타일을 반환합니다
   * getTile은 타일 좌표를 사용하고, 이 함수는 픽셀 좌표를 사용합니다
   * @param x - 픽셀 x 좌표
   * @param y - 픽셀 y 좌표
   * @returns 해당 위치의 타일, 없으면 null
   */
  public getTileAtPosition(x: number, y: number): Tile | null {
    // 픽셀 좌표를 타일 좌표로 변환 (타일 크기 = 1)
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    return this.getTile(tileX, tileY);
  }

  /**
   * 물 타일인지 확인합니다
   * @param x - 픽셀 x 좌표
   * @param y - 픽셀 y 좌표
   * @returns 물 타일이면 true
   */
  public isWaterAt(x: number, y: number): boolean {
    const tile = this.getTileAtPosition(x, y);
    if (!tile) return false;
    return tile.biome === BiomeType.DEEP_OCEAN ||
           tile.biome === BiomeType.OCEAN;
  }

  /**
   * 랜덤한 물 타일의 픽셀 좌표를 반환합니다
   * @param maxAttempts - 최대 시도 횟수 (기본 1000)
   * @returns 물 타일의 {x, y} 좌표, 없으면 null
   */
  public getRandomWaterPosition(maxAttempts: number = 1000): { x: number; y: number } | null {
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;

      if (this.isWaterAt(x, y)) {
        return { x, y };
      }
    }

    // 실패시 로드된 청크에서 물 타일 찾기
    const waterTiles = this.findTiles(tile =>
      tile.biome === BiomeType.DEEP_OCEAN || tile.biome === BiomeType.OCEAN
    );

    if (waterTiles.length > 0) {
      const tile = waterTiles[Math.floor(Math.random() * waterTiles.length)]!;
      return { x: tile.x + 0.5, y: tile.y + 0.5 };
    }

    return null;
  }

  /**
   * 여러 개의 랜덤한 물 타일 좌표를 반환합니다
   * 월드 전체에 균등하게 분포하도록 구역을 나누어 스폰합니다
   * @param count - 필요한 좌표 개수
   * @returns 물 타일 좌표 배열
   */
  public getRandomWaterPositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];

    // 월드를 격자로 나눠서 균등 분포 보장
    // 그리드 크기 계산 (count가 20이면 약 5x4 그리드)
    const gridCols = Math.ceil(Math.sqrt(count * (this.width / this.height)));
    const gridRows = Math.ceil(count / gridCols);

    const cellWidth = this.width / gridCols;
    const cellHeight = this.height / gridRows;

    for (let i = 0; i < count; i++) {
      // 해당 셀 계산
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);

      // 셀 내에서 랜덤 위치 찾기
      const cellX = col * cellWidth;
      const cellY = row * cellHeight;

      let found = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const x = cellX + Math.random() * cellWidth;
        const y = cellY + Math.random() * cellHeight;

        // 월드 경계 확인
        if (x >= this.width || y >= this.height) continue;

        if (this.isWaterAt(x, y)) {
          positions.push({ x, y });
          found = true;
          break;
        }
      }

      // 해당 셀에서 물을 못 찾으면 전체에서 랜덤 검색
      if (!found) {
        const pos = this.getRandomWaterPosition(500);
        if (pos) {
          positions.push(pos);
        }
      }
    }

    return positions;
  }

  /**
   * 월드의 통계를 계산합니다
   * @returns 바이옴별 타일 개수
   */
  public getWorldStatistics(): Record<BiomeType, number> {
    const stats: Record<BiomeType, number> = {
      [BiomeType.DEEP_OCEAN]: 0,
      [BiomeType.OCEAN]: 0,
      [BiomeType.BEACH]: 0,
      [BiomeType.LAKE]: 0,
      [BiomeType.RIVER]: 0,
      [BiomeType.DESERT]: 0,
      [BiomeType.GRASSLAND]: 0,
      [BiomeType.FOREST]: 0,
      [BiomeType.RAINFOREST]: 0,
      [BiomeType.SAVANNA]: 0,
      [BiomeType.SWAMP]: 0,
      [BiomeType.TUNDRA]: 0,
      [BiomeType.MOUNTAIN]: 0,
      [BiomeType.SNOW]: 0,
      [BiomeType.ROCKY]: 0,
      [BiomeType.VOLCANIC]: 0,
    };

    for (const chunk of this.chunks.values()) {
      for (const row of chunk.tiles) {
        for (const tile of row) {
          stats[tile.biome]++;
        }
      }
    }

    return stats;
  }
}
