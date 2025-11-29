/**
 * 타일(셀) 타입 정의
 * 월드를 구성하는 가장 작은 단위
 */

export enum BiomeType {
  // 물 타입
  DEEP_OCEAN = 'deep_ocean',   // 깊은 바다 (고도 < 0.25)
  OCEAN = 'ocean',              // 일반 바다 (0.25 <= 고도 < 0.35)
  BEACH = 'beach',              // 해변 (0.35 <= 고도 < 0.4)
  LAKE = 'lake',                // 호수 (내륙 저지대 물)
  RIVER = 'river',              // 강 (고지대에서 저지대로 흐르는 수로)

  // 육지 타입
  DESERT = 'desert',            // 사막 (건조, 고온)
  GRASSLAND = 'grassland',      // 초원 (중간 습도)
  FOREST = 'forest',            // 숲 (높은 습도)
  RAINFOREST = 'rainforest',    // 우림 (매우 높은 습도, 고온)
  SAVANNA = 'savanna',          // 사바나 (중간 습도, 고온)
  SWAMP = 'swamp',              // 습지 (매우 높은 습도, 저지대)

  // 극한 지형
  TUNDRA = 'tundra',            // 툰드라 (추운 지역)
  MOUNTAIN = 'mountain',        // 산 (고도 0.7~0.85)
  SNOW = 'snow',                // 눈/빙원 (고도 > 0.85 또는 극지방)
  ROCKY = 'rocky',              // 바위 지형 (산 근처, 건조)
  VOLCANIC = 'volcanic',        // 화산 지형 (특수 지역)
}

/**
 * 타일 인터페이스
 * 월드의 각 위치에 존재하는 기본 정보
 */
export interface Tile {
  // 좌표
  x: number;
  y: number;

  // 지형 정보
  elevation: number;      // 0~1 (0=깊은바다, 1=높은산)
  moisture: number;       // 0~1 (0=건조, 1=습함)
  temperature: number;    // -50~50 (섭씨 온도)

  // 바이옴 타입
  biome: BiomeType;

  // 생태 정보
  nutrients: number;      // 0~100 (영양분 농도, 식물 성장 영향)
  isWater: boolean;       // 물 타일 여부 (바다, 호수 등)
}

/**
 * 타일을 생성하는 팩토리 함수
 * @param x - x 좌표
 * @param y - y 좌표
 * @param elevation - 고도 (0~1)
 * @param moisture - 습도 (0~1)
 * @param temperature - 온도 (섭씨)
 * @param biome - 바이옴 타입
 * @returns 생성된 타일
 */
export function createTile(
  x: number,
  y: number,
  elevation: number,
  moisture: number,
  temperature: number,
  biome: BiomeType
): Tile {
  // 물 타일인지 판단 (물 관련 바이옴)
  const isWater = [
    BiomeType.DEEP_OCEAN,
    BiomeType.OCEAN,
    BiomeType.LAKE,
    BiomeType.RIVER,
  ].includes(biome);

  // 바이옴별 기본 영양분 설정
  // 숲과 우림이 높은 영양분, 사막과 눈 지역은 낮은 영양분
  let nutrients = 50;
  switch (biome) {
    case BiomeType.RAINFOREST:
      nutrients = 90;
      break;
    case BiomeType.SWAMP:
      nutrients = 85; // 습지는 영양분 풍부
      break;
    case BiomeType.FOREST:
      nutrients = 75;
      break;
    case BiomeType.GRASSLAND:
      nutrients = 60;
      break;
    case BiomeType.SAVANNA:
      nutrients = 55;
      break;
    case BiomeType.BEACH:
      nutrients = 40;
      break;
    case BiomeType.ROCKY:
      nutrients = 15; // 바위는 영양분 적음
      break;
    case BiomeType.MOUNTAIN:
      nutrients = 30;
      break;
    case BiomeType.TUNDRA:
      nutrients = 25;
      break;
    case BiomeType.DESERT:
      nutrients = 20;
      break;
    case BiomeType.VOLCANIC:
      nutrients = 35; // 화산은 미네랄 풍부
      break;
    case BiomeType.SNOW:
      nutrients = 10;
      break;
    case BiomeType.LAKE:
    case BiomeType.RIVER:
      nutrients = 70; // 민물은 영양분 풍부
      break;
    default:
      nutrients = 0; // 바다
  }

  return {
    x,
    y,
    elevation,
    moisture,
    temperature,
    biome,
    nutrients,
    isWater,
  };
}

/**
 * 서식지 타입 (Habitat)
 * Genome.ts의 HabitatType과 동기화
 */
export type TileHabitatType = 'water' | 'land' | 'amphibious';

/**
 * 바이옴에서 서식지 타입을 반환
 * - DEEP_OCEAN, OCEAN, LAKE, RIVER: water (물에서만 생존 가능)
 * - BEACH, SWAMP: amphibious (양서 가능 지역)
 * - 나머지 육지: land (육지에서만 생존 가능)
 */
export function getBiomeHabitat(biome: BiomeType): TileHabitatType {
  switch (biome) {
    case BiomeType.DEEP_OCEAN:
    case BiomeType.OCEAN:
    case BiomeType.LAKE:
    case BiomeType.RIVER:
      return 'water';
    case BiomeType.BEACH:
    case BiomeType.SWAMP:
      return 'amphibious';
    default:
      return 'land';
  }
}

/**
 * 타일에서 서식지 타입을 반환
 */
export function getTileHabitat(tile: Tile): TileHabitatType {
  return getBiomeHabitat(tile.biome);
}

/**
 * 생명체의 서식지가 타일과 호환되는지 확인
 * @param organismHabitat 생명체의 서식지 타입
 * @param tileHabitat 타일의 서식지 타입
 * @returns 생존 가능 여부
 */
export function isHabitatCompatible(
  organismHabitat: TileHabitatType,
  tileHabitat: TileHabitatType
): boolean {
  // 양서류는 물과 해변에서 생존 가능
  if (organismHabitat === 'amphibious') {
    return tileHabitat === 'water' || tileHabitat === 'amphibious';
  }

  // 물 생물은 물에서만 생존
  if (organismHabitat === 'water') {
    return tileHabitat === 'water';
  }

  // 육지 생물은 육지와 해변에서 생존 가능
  if (organismHabitat === 'land') {
    return tileHabitat === 'land' || tileHabitat === 'amphibious';
  }

  return false;
}

/**
 * 해변(양서 가능 지역)인지 확인
 */
export function isBeachBiome(biome: BiomeType): boolean {
  return biome === BiomeType.BEACH;
}
