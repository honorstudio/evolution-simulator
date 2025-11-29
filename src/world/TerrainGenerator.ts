/**
 * 지형 생성기
 * Simplex Noise를 사용하여 자연스러운 지형을 프로시저럴하게 생성합니다
 *
 * 실제 지구 비율 기반:
 * - 바다: 71% (심해 50%, 일반 바다 18%, 해변 3%)
 * - 육지: 29%
 *   - 빙하/설원: 3% (전체의 ~10%)
 *   - 사막: 10% (전체의 ~33%)
 *   - 초원/사바나: 7% (전체의 ~24%)
 *   - 숲/우림: 7% (전체의 ~24%)
 *   - 산악: 2% (전체의 ~7%)
 *
 * 특징:
 * - 대륙과 바다 형성 (지구 비율)
 * - 강, 호수 생성
 * - 기후 기반 바이옴 (사막, 습지, 설원 등)
 * - 바위, 화산 지형
 * - 섬, 빙하, 산맥
 */

import { createNoise2D, NoiseFunction2D } from 'simplex-noise';
import alea from 'alea';
import { Tile, BiomeType, createTile } from './Tile';
import { NOISE_CONFIG, WORLD_CONFIG } from './WorldConfig';

// 실제 타일 좌표 기준 월드 크기 (TerrainRenderer의 CHUNK_SIZE, TILE_SIZE와 일치해야 함)
const TILE_SIZE = 32;  // 타일 크기 (픽셀)
// const CHUNK_SIZE = 16; // 청크당 타일 수 (현재 미사용)

// 실제 타일 개수 기준 월드 크기
// 32000 / 32 = 1000 타일, 24000 / 32 = 750 타일
const WORLD_TILES_X = Math.ceil(WORLD_CONFIG.width / TILE_SIZE);
const WORLD_TILES_Y = Math.ceil(WORLD_CONFIG.height / TILE_SIZE);

export class TerrainGenerator {
  // 고도 맵 생성용 노이즈
  private elevationNoise: NoiseFunction2D;

  // 습도 맵 생성용 노이즈
  private moistureNoise: NoiseFunction2D;

  // 강/호수 생성용 노이즈
  private riverNoise: NoiseFunction2D;

  // 화산 위치용 노이즈
  private volcanicNoise: NoiseFunction2D;

  // 섬 생성용 노이즈
  private islandNoise: NoiseFunction2D;

  // 대륙 형태용 노이즈
  private continentNoise: NoiseFunction2D;

  // 시드 값
  private seed: number;

  // 월드 중심 좌표 (적도 계산용) - 타일 단위
  private worldCenterY: number;

  // 실제 지구 비율 상수 (고도 임계값)
  // 바다 71%: 고도 0 ~ 0.71
  // 육지 29%: 고도 0.71 ~ 1.0
  private readonly DEEP_OCEAN_THRESHOLD = 0.35;   // 심해 (바다의 ~50%)
  private readonly OCEAN_THRESHOLD = 0.62;         // 일반 바다 (바다의 ~38%)
  private readonly BEACH_THRESHOLD = 0.71;         // 해변 (바다의 ~12%)
  private readonly LOWLAND_THRESHOLD = 0.78;       // 저지대
  private readonly MIDLAND_THRESHOLD = 0.88;       // 중간 고도
  private readonly HIGHLAND_THRESHOLD = 0.94;      // 고지대
  private readonly MOUNTAIN_THRESHOLD = 0.97;      // 산악

  constructor(seed?: number) {
    // 시드가 주어지지 않으면 랜덤 시드 생성
    this.seed = seed ?? Math.random() * 1000000;

    // alea PRNG로 시드 기반 노이즈 생성
    const prng = alea(this.seed);
    this.elevationNoise = createNoise2D(prng);
    this.moistureNoise = createNoise2D(alea(this.seed + 1));
    this.riverNoise = createNoise2D(alea(this.seed + 2));
    this.volcanicNoise = createNoise2D(alea(this.seed + 3));
    this.islandNoise = createNoise2D(alea(this.seed + 4));
    this.continentNoise = createNoise2D(alea(this.seed + 5));

    // 월드 중심 Y (적도) - 타일 단위
    this.worldCenterY = WORLD_TILES_Y / 2;

    console.log(`🌍 지형 생성 시드: ${this.seed.toFixed(0)}`);
  }

  /**
   * 현재 시드 반환
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * 주어진 영역에 대해 지형을 생성합니다
   */
  public generate(
    startX: number,
    startY: number,
    width: number,
    height: number
  ): Tile[][] {
    const tiles: Tile[][] = [];

    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        const worldX = startX + x;
        const worldY = startY + y;

        // 각 타일의 환경 정보 생성
        const elevation = this.getElevation(worldX, worldY);
        const moisture = this.getMoisture(worldX, worldY, elevation);
        const temperature = this.getTemperature(worldY, elevation);

        // 바이옴 결정
        const biome = this.determineBiome(worldX, worldY, elevation, moisture, temperature);

        // 타일 생성
        row[x] = createTile(
          worldX,
          worldY,
          elevation,
          moisture,
          temperature,
          biome
        );
      }
      tiles[y] = row;
    }

    return tiles;
  }

  /**
   * 고도 값을 계산합니다 (0~1 범위)
   * Fractal Brownian Motion (FBM)을 사용하여 자연스러운 대륙 형성
   *
   * 실제 지구 비율: 바다 71%, 육지 29%
   */
  private getElevation(x: number, y: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = NOISE_CONFIG.elevation.baseFrequency;
    let maxValue = 0;

    // 여러 주파수의 노이즈를 합쳐서 자연스러운 지형 생성
    for (let octave = 0; octave < NOISE_CONFIG.elevation.octaves; octave++) {
      value += this.elevationNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;

      amplitude *= NOISE_CONFIG.elevation.persistence;
      frequency *= NOISE_CONFIG.elevation.lacunarity;
    }

    // -1~1 범위를 0~1로 정규화
    let elevation = (value / maxValue + 1) / 2;

    // 대륙 형태를 더 자연스럽게 만들기 위한 대륙 노이즈
    // 주파수 0.0005로 조정 (월드 4배 확대에 맞춤)
    const continentValue = this.continentNoise(x * 0.0005, y * 0.0005);
    const continentFactor = (continentValue + 1) / 2; // 0~1

    // 대륙 마스크 적용: 대륙 영역에서만 육지가 생성됨
    // 지구 비율을 위해 대륙 마스크 영역을 제한
    elevation = elevation * 0.4 + continentFactor * 0.6;

    // 바다 71%, 육지 29% 비율을 만들기 위한 조정
    // 고도 분포를 낮춰서 바다 비율 증가
    elevation = Math.pow(elevation, 1.3) * 0.95;

    // 섬 추가: 바다 영역에서 랜덤하게 작은 섬 생성
    // 주파수 0.005로 조정 (월드 4배 확대에 맞춤)
    if (elevation < this.BEACH_THRESHOLD && elevation > 0.2) {
      const islandValue = this.islandNoise(x * 0.005, y * 0.005);
      if (islandValue > 0.6) {
        // 섬 생성 (해변~저지대 고도)
        elevation = this.BEACH_THRESHOLD + (islandValue - 0.6) * 0.3;
      }
    }

    // 월드 가장자리는 바다가 되도록 (자연스러운 대륙 경계)
    const edgeDistance = this.getEdgeDistance(x, y);
    if (edgeDistance < 0.15) {
      elevation *= Math.pow(edgeDistance / 0.15, 0.5);
    }

    return Math.max(0, Math.min(1, elevation));
  }

  /**
   * 월드 가장자리와의 거리 계산 (0~1, 가장자리에서 0)
   * 타일 좌표 기준으로 계산
   */
  private getEdgeDistance(x: number, y: number): number {
    // 타일 좌표를 0~1로 정규화 (WORLD_TILES_X, WORLD_TILES_Y 사용)
    const normalizedX = x / WORLD_TILES_X;
    const normalizedY = y / WORLD_TILES_Y;

    const distX = Math.min(normalizedX, 1 - normalizedX) * 2;
    const distY = Math.min(normalizedY, 1 - normalizedY) * 2;

    return Math.min(distX, distY);
  }

  /**
   * 습도 값을 계산합니다 (0~1 범위)
   * 고도가 낮은 지역(물 근처)일수록 습도가 높음
   */
  private getMoisture(x: number, y: number, elevation: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = NOISE_CONFIG.moisture.baseFrequency;
    let maxValue = 0;

    for (let octave = 0; octave < NOISE_CONFIG.moisture.octaves; octave++) {
      value += this.moistureNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;

      amplitude *= NOISE_CONFIG.moisture.persistence;
      frequency *= NOISE_CONFIG.moisture.lacunarity;
    }

    // -1~1 범위를 0~1로 정규화
    let moisture = (value / maxValue + 1) / 2;

    // 물 근처(저지대)에서는 습도가 높음
    if (elevation < 0.45) {
      moisture = Math.min(1, moisture + (0.45 - elevation));
    }

    // 고지대에서는 습도가 낮음
    if (elevation > 0.6) {
      moisture *= 1 - (elevation - 0.6) * 0.5;
    }

    return Math.max(0, Math.min(1, moisture));
  }

  /**
   * 온도를 계산합니다 (섭씨)
   * 위도(y좌표)와 고도를 고려
   */
  private getTemperature(y: number, elevation: number): number {
    // 위도 기반 온도: 적도에서 가장 따뜻함
    const absLatitude = Math.abs(y - this.worldCenterY) / this.worldCenterY;
    const baseTemperature = 30 - absLatitude * 60; // -30°C ~ 30°C

    // 고도 기반 온도 감소 (고도 100m당 약 0.6°C 감소)
    const elevationPenalty = Math.max(0, elevation - 0.4) * 40;

    return baseTemperature - elevationPenalty;
  }

  /**
   * 강/하천 판정
   */
  private isRiver(x: number, y: number, elevation: number): boolean {
    // 해변~중간 고도 육지에서만 강이 흐름
    if (elevation < this.BEACH_THRESHOLD || elevation > this.MIDLAND_THRESHOLD) return false;

    // 강 노이즈 계산 (주파수 4배 축소)
    const riverValue = this.riverNoise(x * 0.00375, y * 0.00375);

    // 강은 좁은 띠 형태로 (-0.05 ~ 0.05 범위)
    return Math.abs(riverValue) < 0.025;
  }

  /**
   * 호수 판정
   */
  private isLake(x: number, y: number, elevation: number, moisture: number): boolean {
    // 저지대의 습한 지역에서만 호수 생성
    if (elevation < this.BEACH_THRESHOLD || elevation > this.LOWLAND_THRESHOLD) return false;
    if (moisture < 0.6) return false;

    // 호수 노이즈 (더 넓은 패턴, 주파수 4배 축소)
    const lakeValue = this.riverNoise(x * 0.002, y * 0.002);
    return lakeValue > 0.45;
  }

  /**
   * 화산 판정
   */
  private isVolcanic(x: number, y: number, elevation: number): boolean {
    // 고지대~산악 지역에서만 화산 가능
    if (elevation < this.MIDLAND_THRESHOLD || elevation > this.MOUNTAIN_THRESHOLD) return false;

    // 화산 노이즈 (희귀하게 발생, 주파수 4배 축소)
    const volcanicValue = this.volcanicNoise(x * 0.0025, y * 0.0025);
    return volcanicValue > 0.75;
  }

  /**
   * 고도, 습도, 온도를 바탕으로 바이옴을 결정합니다
   * 실제 지구 비율: 바다 71%, 육지 29%
   */
  private determineBiome(
    x: number,
    y: number,
    elevation: number,
    moisture: number,
    temperature: number
  ): BiomeType {
    // === 물 바이옴 (71%) ===
    if (elevation < this.DEEP_OCEAN_THRESHOLD) return BiomeType.DEEP_OCEAN;
    if (elevation < this.OCEAN_THRESHOLD) return BiomeType.OCEAN;
    if (elevation < this.BEACH_THRESHOLD) return BiomeType.BEACH;

    // === 특수 물 지형 (강, 호수) ===
    if (this.isRiver(x, y, elevation)) return BiomeType.RIVER;
    if (this.isLake(x, y, elevation, moisture)) return BiomeType.LAKE;

    // === 화산 지형 ===
    if (this.isVolcanic(x, y, elevation)) return BiomeType.VOLCANIC;

    // === 고산 바이옴 (산악 지대) ===
    if (elevation > this.MOUNTAIN_THRESHOLD) {
      // 가장 높은 곳은 만년설
      return BiomeType.SNOW;
    }
    if (elevation > this.HIGHLAND_THRESHOLD) {
      // 높은 산에서 습도 낮으면 바위
      if (moisture < 0.3) return BiomeType.ROCKY;
      return BiomeType.MOUNTAIN;
    }
    if (elevation > this.MIDLAND_THRESHOLD) {
      if (moisture < 0.25) return BiomeType.ROCKY;
      return BiomeType.MOUNTAIN;
    }

    // === 극지방/한랭 바이옴 (빙하, 설원) ===
    if (temperature < -15) return BiomeType.SNOW;
    if (temperature < -5) return BiomeType.TUNDRA;

    // === 습지 (저지대 + 고습도) ===
    if (elevation < this.LOWLAND_THRESHOLD && moisture > 0.7) {
      return BiomeType.SWAMP;
    }

    // === 건조 바이옴 (사막) ===
    // 실제 지구에서 사막은 육지의 약 33%
    if (moisture < 0.25) {
      if (temperature > 15) return BiomeType.DESERT;
      if (temperature > 0) return BiomeType.ROCKY;
      return BiomeType.TUNDRA;
    }

    // === 반건조 바이옴 (사바나, 초원) ===
    if (moisture < 0.4) {
      if (temperature > 18) return BiomeType.SAVANNA;
      return BiomeType.GRASSLAND;
    }

    // === 온대 바이옴 (초원) ===
    if (moisture < 0.55) {
      return BiomeType.GRASSLAND;
    }

    // === 습윤 바이옴 (숲) ===
    if (moisture < 0.75) {
      return BiomeType.FOREST;
    }

    // === 열대 우림 (고온 + 고습도) ===
    if (temperature > 18) {
      return BiomeType.RAINFOREST;
    }

    // 기본값: 숲
    return BiomeType.FOREST;
  }
}
