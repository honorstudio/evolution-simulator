import { Graphics, Container } from 'pixi.js';
import { Camera } from './Camera';
import { BIOME_COLORS, getElevationTint } from './colors';
import { TerrainGenerator } from '../world/TerrainGenerator';
import { Tile, BiomeType } from '../world/Tile';
import { WORLD_CONFIG } from '../world/WorldConfig';

/**
 * 청크 크기 설정
 */
const CHUNK_SIZE = 16; // 청크당 타일 수
const TILE_SIZE = 32;  // 타일 크기 (픽셀)

/**
 * 지형 렌더러
 * TerrainGenerator를 사용하여 실제 노이즈 기반 지형 렌더링
 */
export class TerrainRenderer {
  private container: Container;
  private camera: Camera;
  private terrainGenerator: TerrainGenerator;

  // 청크 관리
  private chunkGraphics: Map<string, Graphics> = new Map();
  private chunkData: Map<string, Tile[][]> = new Map();

  // LOD 설정
  private currentLOD: number = 3;

  constructor(camera: Camera, seed?: number) {
    this.camera = camera;
    this.container = new Container();
    this.terrainGenerator = new TerrainGenerator(seed);
  }

  /**
   * 컨테이너 가져오기
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * TerrainGenerator 가져오기
   */
  getTerrainGenerator(): TerrainGenerator {
    return this.terrainGenerator;
  }

  /**
   * 특정 월드 좌표의 타일 정보 가져오기
   */
  getTileAt(worldX: number, worldY: number): Tile | null {
    const chunkX = Math.floor(worldX / TILE_SIZE / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / TILE_SIZE / CHUNK_SIZE);
    const key = `${chunkX},${chunkY}`;

    const tiles = this.chunkData.get(key);
    if (!tiles) return null;

    const localX = Math.floor((worldX / TILE_SIZE) % CHUNK_SIZE);
    const localY = Math.floor((worldY / TILE_SIZE) % CHUNK_SIZE);

    const row = tiles[localY];
    if (localY >= 0 && localY < tiles.length && row && localX >= 0 && localX < row.length) {
      return row[localX] ?? null;
    }
    return null;
  }

  /**
   * 청크 키 생성
   */
  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  /**
   * 청크 생성 및 렌더링
   */
  private generateAndRenderChunk(chunkX: number, chunkY: number): void {
    const key = this.getChunkKey(chunkX, chunkY);

    // 이미 렌더링된 청크면 스킵
    if (this.chunkGraphics.has(key)) return;

    // 월드 좌표로 변환
    const startX = chunkX * CHUNK_SIZE;
    const startY = chunkY * CHUNK_SIZE;

    // TerrainGenerator로 타일 데이터 생성
    const tiles = this.terrainGenerator.generate(startX, startY, CHUNK_SIZE, CHUNK_SIZE);
    this.chunkData.set(key, tiles);

    // 디버그: 첫 번째 청크의 첫 번째 타일 정보 출력
    if (chunkX === 0 && chunkY === 0) {
      const firstTile = tiles[0]?.[0];
      if (firstTile) {
        console.log(`🗺️ 첫 번째 타일 정보:`, {
          biome: firstTile.biome,
          elevation: firstTile.elevation,
          color: BIOME_COLORS[firstTile.biome],
          colorHex: BIOME_COLORS[firstTile.biome]?.toString(16)
        });
      }
    }

    // 그래픽 렌더링 - 청크를 대표 바이옴 색상으로 렌더링 (성능 최적화)
    const graphics = new Graphics();
    const chunkWorldX = chunkX * CHUNK_SIZE * TILE_SIZE;
    const chunkWorldY = chunkY * CHUNK_SIZE * TILE_SIZE;
    const chunkPixelSize = CHUNK_SIZE * TILE_SIZE;

    // 청크 중앙 타일의 바이옴을 대표 색상으로 사용
    const centerTile = tiles[Math.floor(CHUNK_SIZE / 2)]?.[Math.floor(CHUNK_SIZE / 2)];
    const chunkColor = centerTile ? (BIOME_COLORS[centerTile.biome] ?? 0x808080) : 0x808080;

    // 청크 배경 렌더링 - 실제 바이옴 색상 사용
    graphics.rect(chunkWorldX, chunkWorldY, chunkPixelSize, chunkPixelSize).fill(chunkColor);

    // 개별 타일 렌더링 (바이옴이 다른 경우만)
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const tile = tiles[y]?.[x];
        // 중앙 타일과 다른 바이옴만 개별 렌더링
        if (tile && centerTile && tile.biome !== centerTile.biome) {
          const worldX = (chunkX * CHUNK_SIZE + x) * TILE_SIZE;
          const worldY = (chunkY * CHUNK_SIZE + y) * TILE_SIZE;
          const baseColor = BIOME_COLORS[tile.biome] ?? 0x808080;
          graphics.rect(worldX, worldY, TILE_SIZE, TILE_SIZE).fill(baseColor);
        }
      }
    }

    this.chunkGraphics.set(key, graphics);
    this.container.addChild(graphics);
  }

  /**
   * 개별 타일 렌더링 (향후 확장용)
   */
  // @ts-expect-error 향후 LOD 시스템에서 사용 예정
  private renderTile(
    graphics: Graphics,
    chunkX: number,
    chunkY: number,
    localX: number,
    localY: number,
    tile: Tile
  ): void {
    const worldX = (chunkX * CHUNK_SIZE + localX) * TILE_SIZE;
    const worldY = (chunkY * CHUNK_SIZE + localY) * TILE_SIZE;

    // 바이옴 색상 가져오기 (BiomeType enum 값 사용)
    const baseColor = BIOME_COLORS[tile.biome] ?? 0x808080;

    // LOD에 따라 렌더링 방식 변경
    if (this.currentLOD === 0) {
      // 점으로만 표시
      graphics
        .circle(worldX + TILE_SIZE / 2, worldY + TILE_SIZE / 2, 2)
        .fill({ color: baseColor });
    } else {
      // 사각형 타일
      graphics
        .rect(worldX, worldY, TILE_SIZE, TILE_SIZE)
        .fill({ color: baseColor });

      // 고도에 따른 밝기 조절 (LOD 2 이상)
      if (this.currentLOD >= 2) {
        const tint = getElevationTint(tile.elevation * 2 - 1); // 0~1을 -1~1로 변환
        graphics
          .rect(worldX, worldY, TILE_SIZE, TILE_SIZE)
          .fill({ color: tint, alpha: 0.15 });
      }

      // 디테일 추가 (LOD 3)
      if (this.currentLOD >= 3) {
        this.addTerrainDetails(graphics, worldX, worldY, tile);
      }
    }
  }

  /**
   * 지형 디테일 추가
   */
  private addTerrainDetails(
    graphics: Graphics,
    x: number,
    y: number,
    tile: Tile
  ): void {
    // 바이옴별 디테일 패턴 (시드 기반으로 일관성 유지)
    const detailSeed = (tile.x * 1000 + tile.y) % 100;

    switch (tile.biome) {
      case BiomeType.FOREST:
      case BiomeType.RAINFOREST:
        // 나무 표시
        if (detailSeed > 70) {
          const treeX = x + (detailSeed % 20) + 6;
          const treeY = y + ((detailSeed * 3) % 20) + 6;
          graphics.circle(treeX, treeY, 3).fill({ color: 0x1b5e20, alpha: 0.6 });
        }
        break;

      case BiomeType.SWAMP:
        // 습지 물웅덩이
        if (detailSeed > 60) {
          const poolX = x + (detailSeed % 16) + 8;
          const poolY = y + ((detailSeed * 2) % 16) + 8;
          graphics.circle(poolX, poolY, 4).fill({ color: 0x4a7c59, alpha: 0.4 });
        }
        break;

      case BiomeType.MOUNTAIN:
      case BiomeType.ROCKY:
        // 바위 표시
        if (detailSeed > 75) {
          graphics
            .rect(x + (detailSeed % 20) + 6, y + ((detailSeed * 3) % 20) + 6, 5, 4)
            .fill({ color: 0x4e342e, alpha: 0.5 });
        }
        break;

      case BiomeType.VOLCANIC:
        // 화산암/용암
        if (detailSeed > 50) {
          graphics
            .circle(x + (detailSeed % 20) + 8, y + ((detailSeed * 2) % 20) + 8, 3)
            .fill({ color: 0xff5722, alpha: 0.4 });
        }
        break;

      case BiomeType.BEACH:
        // 파도 표시
        graphics.rect(x, y, TILE_SIZE, 2).fill({ color: 0x4fc3f7, alpha: 0.3 });
        break;

      case BiomeType.RIVER:
        // 강 물결
        if (detailSeed > 50) {
          graphics.rect(x + 8, y + 12, 16, 2).fill({ color: 0xffffff, alpha: 0.2 });
        }
        break;

      case BiomeType.LAKE:
        // 호수 반짝임
        if (detailSeed > 80) {
          graphics.circle(x + 16, y + 16, 2).fill({ color: 0xffffff, alpha: 0.3 });
        }
        break;

      case BiomeType.DESERT:
        // 사막 모래 무늬
        if (detailSeed > 85) {
          graphics.rect(x + (detailSeed % 24) + 4, y + 14, 8, 2).fill({ color: 0xffe0b2, alpha: 0.4 });
        }
        break;

      case BiomeType.SNOW:
        // 눈 반짝임
        if (detailSeed > 70) {
          graphics.circle(x + (detailSeed % 24) + 4, y + ((detailSeed * 2) % 24) + 4, 1).fill({ color: 0xffffff, alpha: 0.5 });
        }
        break;
    }
  }

  /**
   * 전체 지형 생성 (초기화용)
   */
  generateTerrain(): void {
    // 월드 전체를 청크로 나눠서 생성
    const chunksX = Math.ceil(WORLD_CONFIG.width / TILE_SIZE / CHUNK_SIZE);
    const chunksY = Math.ceil(WORLD_CONFIG.height / TILE_SIZE / CHUNK_SIZE);

    console.log(`🗺️ 지형 생성 중: ${chunksX}x${chunksY} 청크`);

    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        this.generateAndRenderChunk(cx, cy);
      }
    }

    console.log(`🗺️ 지형 생성 완료: ${this.chunkGraphics.size} 청크`);
  }

  /**
   * 테스트용 지형 생성 (하위 호환성)
   */
  generateTestTerrain(_size: number = 4): void {
    this.generateTerrain();
  }

  /**
   * 매 프레임 업데이트
   */
  update(): void {
    // LOD 레벨 업데이트
    const newLOD = this.camera.getLODLevel();
    if (newLOD !== this.currentLOD) {
      this.currentLOD = newLOD;
      // LOD 변경 시 청크 갱신 (성능 고려하여 비활성화)
      // this.refreshAllChunks();
    }
  }

  /**
   * 보이는 청크만 활성화 (컬링)
   */
  public updateVisibleChunks(): void {
    const bounds = this.camera.getVisibleBounds();
    const chunkPixelSize = CHUNK_SIZE * TILE_SIZE;

    const minChunkX = Math.floor(bounds.x / chunkPixelSize);
    const minChunkY = Math.floor(bounds.y / chunkPixelSize);
    const maxChunkX = Math.ceil((bounds.x + bounds.width) / chunkPixelSize);
    const maxChunkY = Math.ceil((bounds.y + bounds.height) / chunkPixelSize);

    // 모든 청크 숨기기
    for (const graphics of this.chunkGraphics.values()) {
      graphics.visible = false;
    }

    // 보이는 청크만 표시 (필요시 생성)
    for (let cy = minChunkY; cy <= maxChunkY; cy++) {
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        if (cx < 0 || cy < 0) continue;

        const key = this.getChunkKey(cx, cy);
        let graphics = this.chunkGraphics.get(key);

        if (!graphics) {
          // 청크가 없으면 생성
          this.generateAndRenderChunk(cx, cy);
          graphics = this.chunkGraphics.get(key);
        }

        if (graphics) {
          graphics.visible = true;
        }
      }
    }
  }

  /**
   * 모든 청크 다시 그리기
   */
  public refreshAllChunks(): void {
    for (const graphics of this.chunkGraphics.values()) {
      graphics.destroy();
    }
    this.chunkGraphics.clear();
    this.chunkData.clear();
    this.container.removeChildren();

    this.generateTerrain();
  }

  /**
   * 정리
   */
  destroy(): void {
    for (const graphics of this.chunkGraphics.values()) {
      graphics.destroy();
    }
    this.chunkGraphics.clear();
    this.chunkData.clear();
    this.container.destroy();
  }
}
