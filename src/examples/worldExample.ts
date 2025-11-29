/**
 * 월드 시스템 사용 예시
 * 이 파일은 월드 생성과 사용 방법을 보여줍니다
 */

import { World, BiomeType } from '../world';

/**
 * 기본적인 월드 생성 및 사용 예시
 */
export function basicWorldExample(): void {
  console.log('=== 월드 생성 예시 ===\n');

  // 1. 월드 생성
  const world = new World();
  const worldSize = world.getWorldSize();

  console.log(`월드 크기: ${worldSize.width} x ${worldSize.height}`);
  console.log(`청크 크기: ${worldSize.chunkSize}`);
  console.log(`총 청크 수: ${Math.ceil(worldSize.width / worldSize.chunkSize) * Math.ceil(worldSize.height / worldSize.chunkSize)}\n`);

  // 2. 특정 위치의 타일 조회
  console.log('=== 특정 위치의 타일 정보 ===\n');

  // (100, 100) 좌표의 타일 조회
  const tile = world.getTile(100, 100);
  if (tile) {
    console.log(`좌표: (${tile.x}, ${tile.y})`);
    console.log(`고도: ${tile.elevation.toFixed(2)} (0=바다, 1=산)`);
    console.log(`습도: ${tile.moisture.toFixed(2)} (0=건조, 1=습함)`);
    console.log(`온도: ${tile.temperature.toFixed(1)}°C`);
    console.log(`바이옴: ${tile.biome}`);
    console.log(`영양분: ${tile.nutrients}`);
    console.log(`물 타일: ${tile.isWater}\n`);
  }

  // 3. 특정 영역의 타일 조회
  console.log('=== 특정 영역의 타일 조회 ===\n');

  const regionTiles = world.getTiles(0, 0, 10, 10); // (0,0)에서 10x10 영역
  console.log(`${regionTiles.length}x${regionTiles[0].length} 영역 로드됨`);
  console.log(`로드된 청크 수: ${world.getLoadedChunkCount()}\n`);

  // 4. 바이옴별 타일 찾기
  console.log('=== 바이옴별 타일 개수 ===\n');

  const stats = world.getWorldStatistics();
  let totalTiles = 0;

  for (const biome in stats) {
    const count = stats[biome as BiomeType];
    totalTiles += count;
    if (count > 0) {
      const percentage = ((count / totalTiles) * 100).toFixed(1);
      console.log(`${biome}: ${count} (${percentage}%)`);
    }
  }

  console.log(`\n총 타일 수: ${totalTiles}`);

  // 5. 대기 정보
  console.log('\n=== 대기 정보 ===\n');

  const atmosphere = world.getAtmosphere();
  console.log(`산소: ${atmosphere.oxygen.toFixed(1)}%`);
  console.log(`이산화탄소: ${atmosphere.carbonDioxide.toFixed(0)} ppm`);
  console.log(`전역 온도: ${atmosphere.globalTemperature.toFixed(1)}°C`);
  console.log(`질소: ${atmosphere.nitrogen.toFixed(1)}%`);
  console.log(`기타 가스: ${atmosphere.other.toFixed(1)}%`);

  // 대기가 생명 유지에 적합한지 확인
  const atmosphereManager = world.getAtmosphereManager();
  console.log(`생명 유지 가능: ${atmosphereManager.isHabitable()}\n`);
}

/**
 * 특정 조건으로 타일 찾기 예시
 */
export function findTilesByConditionExample(): void {
  console.log('=== 조건으로 타일 찾기 ===\n');

  const world = new World();

  // 큰 영역을 로드해야 통계가 의미있음
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      world.getTile(x * 100, y * 100);
    }
  }

  // 1. 물 타일 찾기
  const waterTiles = world.findTiles((tile) => tile.isWater);
  console.log(`물 타일: ${waterTiles.length}개`);

  // 2. 산림 타일 찾기 (숲과 우림)
  const forestTiles = world.findTiles(
    (tile) =>
      tile.biome === BiomeType.FOREST || tile.biome === BiomeType.RAINFOREST
  );
  console.log(`산림 타일 (숲/우림): ${forestTiles.length}개`);

  // 3. 특정 온도 범위의 타일 찾기 (10~20°C)
  const mildTiles = world.findTiles(
    (tile) => tile.temperature >= 10 && tile.temperature <= 20
  );
  console.log(`온대 지역 (10~20°C): ${mildTiles.length}개`);

  // 4. 높은 영양분의 타일 찾기 (영양분 70 이상)
  const nutrientRichTiles = world.findTiles((tile) => tile.nutrients >= 70);
  console.log(`영양분 풍부한 지역: ${nutrientRichTiles.length}개\n`);
}

/**
 * 대기 조건 변화 예시
 */
export function atmosphereExample(): void {
  console.log('=== 대기 변화 시뮬레이션 ===\n');

  const world = new World();
  const atmosphereManager = world.getAtmosphereManager();

  console.log('초기 상태:');
  let atmosphere = atmosphereManager.getAtmosphere();
  console.log(`산소: ${atmosphere.oxygen.toFixed(1)}%`);
  console.log(`이산화탄소: ${atmosphere.carbonDioxide.toFixed(0)} ppm`);
  console.log(`전역 온도: ${atmosphere.globalTemperature.toFixed(1)}°C`);
  console.log(`생명 유지 가능: ${atmosphereManager.isHabitable()}\n`);

  // 1. 산소 증가
  console.log('시간 경과 - 생명체가 산소 생성:');
  atmosphereManager.addOxygen(2);
  atmosphereManager.addCarbonDioxide(-50);
  atmosphereManager.changeGlobalTemperature(0.5);

  atmosphere = atmosphereManager.getAtmosphere();
  console.log(`산소: ${atmosphere.oxygen.toFixed(1)}%`);
  console.log(`이산화탄소: ${atmosphere.carbonDioxide.toFixed(0)} ppm`);
  console.log(`전역 온도: ${atmosphere.globalTemperature.toFixed(1)}°C`);
  console.log(`생명 유지 가능: ${atmosphereManager.isHabitable()}\n`);

  // 2. 극한 상황 시뮬레이션
  console.log('극한 상황 - 과도한 온난화:');
  atmosphereManager.changeGlobalTemperature(40);

  atmosphere = atmosphereManager.getAtmosphere();
  console.log(`전역 온도: ${atmosphere.globalTemperature.toFixed(1)}°C`);
  console.log(`생명 유지 가능: ${atmosphereManager.isHabitable()}\n`);

  // 3. 리셋
  console.log('초기값으로 리셋:');
  atmosphereManager.reset();

  atmosphere = atmosphereManager.getAtmosphere();
  console.log(`산소: ${atmosphere.oxygen.toFixed(1)}%`);
  console.log(`이산화탄소: ${atmosphere.carbonDioxide.toFixed(0)} ppm`);
  console.log(`전역 온도: ${atmosphere.globalTemperature.toFixed(1)}°C`);
  console.log(`생명 유지 가능: ${atmosphereManager.isHabitable()}\n`);
}

/**
 * 바이옴 분포 분석 예시
 */
export function biomeDistributionExample(): void {
  console.log('=== 바이옴 분포 분석 ===\n');

  const world = new World();

  // 더 큰 영역을 로드 (대표성 있는 샘플)
  console.log('월드 로드 중...');
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      world.getTile(x * 100, y * 100);
    }
  }

  // 통계 계산
  const stats = world.getWorldStatistics();
  const biomeNames: Record<BiomeType, string> = {
    [BiomeType.DEEP_OCEAN]: '깊은 바다',
    [BiomeType.OCEAN]: '바다',
    [BiomeType.BEACH]: '해변',
    [BiomeType.DESERT]: '사막',
    [BiomeType.GRASSLAND]: '초원',
    [BiomeType.FOREST]: '숲',
    [BiomeType.RAINFOREST]: '우림',
    [BiomeType.SAVANNA]: '사바나',
    [BiomeType.TUNDRA]: '툰드라',
    [BiomeType.MOUNTAIN]: '산',
    [BiomeType.SNOW]: '눈/빙원',
  };

  console.log('바이옴별 분포:');
  let totalTiles = 0;
  const sortedStats = Object.entries(stats)
    .sort((a, b) => b[1] - a[1]);

  for (const [biome, count] of sortedStats) {
    totalTiles += count;
  }

  for (const [biome, count] of sortedStats) {
    if (count > 0) {
      const percentage = ((count / totalTiles) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(Number(percentage) / 5));
      console.log(`${biomeNames[biome as BiomeType].padEnd(10)}: ${bar} ${percentage}%`);
    }
  }

  console.log(`\n총 타일 수: ${totalTiles}`);
  console.log(`로드된 청크 수: ${world.getLoadedChunkCount()}\n`);
}
