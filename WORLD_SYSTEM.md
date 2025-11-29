# 월드 생성 시스템 문서

Evolution Simulator의 프로시저럴 월드 생성 시스템입니다.

## 시스템 개요

이 시스템은 **Simplex Noise** 알고리즘을 사용하여 자연스럽고 다양한 지형을 자동으로 생성합니다.

### 핵심 특징

1. **프로시저럴 생성**: 완전히 자동으로 지형을 생성
2. **청크 시스템**: 필요한 부분만 메모리에 로드 (성능 최적화)
3. **바이옴 다양성**: 11가지 다양한 지형 타입
4. **다중 노이즈 계층**: 자연스러운 지형 생성 (Fractal Brownian Motion)
5. **대기 시스템**: 행성의 환경 조건 관리

---

## 파일 구조

```
src/world/
├── WorldConfig.ts        # 월드 설정 상수
├── Tile.ts               # 타일/셀 타입 정의
├── TerrainGenerator.ts   # Simplex Noise 기반 지형 생성
├── Atmosphere.ts         # 대기 시스템
├── World.ts              # 메인 월드 클래스
└── index.ts              # 모든 export

src/examples/
└── worldExample.ts       # 사용 예시
```

---

## 핵심 개념

### 1. 타일 (Tile)

월드를 구성하는 가장 작은 단위입니다.

```typescript
interface Tile {
  x: number;              // x 좌표
  y: number;              // y 좌표
  elevation: number;      // 고도 (0~1)
  moisture: number;       // 습도 (0~1)
  temperature: number;    // 온도 (섭씨)
  biome: BiomeType;       // 지형 타입
  nutrients: number;      // 영양분 (0~100)
  isWater: boolean;       // 물인지 여부
}
```

**고도**
- `0.0~0.3`: 깊은 바다
- `0.3~0.4`: 일반 바다
- `0.4~0.42`: 해변
- `0.42~0.7`: 육지 (평지~산 경사)
- `0.7~0.85`: 산
- `0.85~1.0`: 눈/빙원

### 2. 바이옴 (Biome)

11가지 지형 타입:

| 바이옴 | 환경 | 특징 |
|--------|------|------|
| DEEP_OCEAN | 깊은 바다 | 가장 낮은 고도, 생명 불가 |
| OCEAN | 바다 | 일반 바다, 해양 생명 |
| BEACH | 해변 | 육지와 바다의 경계 |
| DESERT | 사막 | 낮은 습도, 높은 온도 |
| GRASSLAND | 초원 | 중간 습도, 풀과 초목 |
| FOREST | 숲 | 높은 습도, 나무가 많음 |
| RAINFOREST | 우림 | 매우 높은 습도, 밀림 |
| SAVANNA | 사바나 | 반건조, 초지와 관목 |
| TUNDRA | 툰드라 | 극저온, 낮은 습도 |
| MOUNTAIN | 산 | 높은 고도, 척박한 환경 |
| SNOW | 눈/빙원 | 극도로 높은 고도, 얼음 |

### 3. 청크 (Chunk)

월드는 청크라는 단위로 나뉩니다. 각 청크는 100x100 타일로 구성됩니다.

```
월드 크기: 4000 x 3000 타일
청크 크기: 100 x 100 타일
총 청크: 40 x 30 = 1200개
```

**장점**:
- 필요한 부분만 메모리에 로드
- 대규모 월드도 효율적으로 관리
- 동적 로드/언로드 가능

### 4. 노이즈 (Noise)

Simplex Noise를 여러 층으로 합쳐서 자연스러운 지형을 생성합니다.

**Fractal Brownian Motion (FBM)**:
```
final_value = octave1 + octave2 * 0.5 + octave3 * 0.25 + ...
```

각 옥타브:
- 주파수 증가 (lacunarity = 2.0)
- 진폭 감소 (persistence = 0.5)

이렇게 하면 큰 지형부터 작은 디테일까지 자연스러운 형태가 나옵니다.

---

## 기본 사용법

### 월드 생성

```typescript
import { World } from './world';

// 월드 생성 (모든 설정은 WorldConfig에서 자동 적용)
const world = new World();

// 월드 크기 확인
const size = world.getWorldSize();
// { width: 4000, height: 3000, chunkSize: 100 }
```

### 타일 조회

```typescript
// 특정 좌표의 타일 가져오기
const tile = world.getTile(100, 150);

if (tile) {
  console.log(`바이옴: ${tile.biome}`);
  console.log(`고도: ${tile.elevation}`);  // 0~1
  console.log(`습도: ${tile.moisture}`);   // 0~1
  console.log(`온도: ${tile.temperature}`); // 섭씨
}

// 특정 영역의 타일 가져오기 (10x10 범위)
const tiles = world.getTiles(100, 100, 10, 10);
// tiles[y][x] 형태의 2D 배열
```

### 타일 검색

```typescript
// 특정 바이옴 찾기
const forestTiles = world.findTilesByBiome(BiomeType.FOREST);

// 조건으로 찾기
const hotTiles = world.findTiles((tile) => tile.temperature > 25);
const seaTiles = world.findTiles((tile) => tile.isWater);
```

### 통계

```typescript
// 바이옴별 타일 개수
const stats = world.getWorldStatistics();
console.log(stats[BiomeType.FOREST]); // 숲 타일 개수

// 로드된 청크 개수 확인
console.log(world.getLoadedChunkCount());
```

---

## 대기 시스템

월드의 환경 조건을 관리합니다.

### 대기 상태

```typescript
interface Atmosphere {
  oxygen: number;        // 산소 (%)
  carbonDioxide: number; // 이산화탄소 (ppm)
  globalTemperature: number; // 전역 온도 (섭씨)
  nitrogen: number;      // 질소 (%)
  other: number;         // 기타 가스 (%)
}
```

### 대기 관리

```typescript
const world = new World();
const atmosphereManager = world.getAtmosphereManager();

// 현재 상태 확인
const atmosphere = atmosphereManager.getAtmosphere();

// 값 변경
atmosphereManager.setOxygen(22);           // 산소 22%로 설정
atmosphereManager.addCarbonDioxide(50);    // CO2 50ppm 증가
atmosphereManager.changeGlobalTemperature(2); // 온도 2°C 증가

// 생명 유지 가능 확인
if (atmosphereManager.isHabitable()) {
  console.log('생명 유지 가능한 환경입니다');
}

// 초기값으로 리셋
atmosphereManager.reset();
```

### 생명 유지 조건

- 산소: 10% ~ 50%
- 온도: -50°C ~ 50°C

---

## 노이즈 파라미터 튜닝

`WorldConfig.ts`의 `NOISE_CONFIG`에서 지형 생성을 조정할 수 있습니다.

```typescript
export const NOISE_CONFIG = {
  elevation: {
    baseFrequency: 0.005,  // 낮을수록 넓은 지형
    octaves: 6,            // 많을수록 복잡함 (비용 증가)
    persistence: 0.5,      // 높을수록 거친 지형
    lacunarity: 2.0,       // 주파수 증가율 (보통 2.0)
  },
  moisture: {
    baseFrequency: 0.004,
    octaves: 5,
    persistence: 0.5,
    lacunarity: 2.0,
  },
};
```

### 파라미터 설명

| 파라미터 | 범위 | 영향 |
|---------|------|------|
| baseFrequency | 0.001~0.01 | 낮음: 큰 지형, 높음: 작은 지형 |
| octaves | 3~8 | 많음: 디테일 많음, 적음: 단순함 |
| persistence | 0.3~0.7 | 높음: 거친 지형, 낮음: 부드러운 지형 |
| lacunarity | 1.5~2.5 | 일반적으로 2.0 |

### 조정 예시

**산이 많은 세상**:
```typescript
elevation: {
  baseFrequency: 0.008,
  octaves: 7,
  persistence: 0.6,
}
```

**평탄한 세상**:
```typescript
elevation: {
  baseFrequency: 0.002,
  octaves: 4,
  persistence: 0.3,
}
```

---

## 온도 계산 알고리즘

온도는 두 가지 요소로 결정됩니다:

### 1. 위도 (Y 좌표)

```
위도 기반 온도 = 25 - |y - 1500| / 1500 * 50
```

- 적도 (y=1500): 25°C (따뜻함)
- 극지 (y=0, y=3000): -25°C (추움)

### 2. 고도 (Elevation)

```
고도 페널티 = max(0, elevation - 0.5) * 50
최종 온도 = 위도 기반 온도 - 고도 페널티
```

- 고도 0.5 (500m) 이상에서 온도 감소
- 1000m당 약 6.5°C 감소

---

## 바이옴 결정 로직

바이옴은 고도, 습도, 온도의 조합으로 결정됩니다.

```
고도 우선:
  < 0.3  → DEEP_OCEAN
  < 0.4  → OCEAN
  < 0.42 → BEACH
  > 0.85 → SNOW
  > 0.7  → MOUNTAIN

온도:
  < 0°C  → TUNDRA

습도 (주로):
  < 0.2  → DESERT
  < 0.4  → SAVANNA
  < 0.6  → GRASSLAND
  < 0.8  → FOREST
  >= 0.8 → RAINFOREST
```

---

## 성능 최적화

### 청크 언로드

메모리 절약을 위해 필요 없는 청크를 언로드할 수 있습니다:

```typescript
// 특정 청크 언로드
world.unloadChunk(chunkX, chunkY);

// 모든 청크 언로드
world.unloadAllChunks();
```

### 대량 타일 조회

많은 타일을 조회할 때는 한 번에 가져오는 것이 효율적입니다:

```typescript
// 비효율적
for (let y = 0; y < 1000; y++) {
  for (let x = 0; x < 1000; x++) {
    const tile = world.getTile(x, y);
  }
}

// 효율적
const tiles = world.getTiles(0, 0, 1000, 1000);
for (const row of tiles) {
  for (const tile of row) {
    // 사용
  }
}
```

---

## 예시 코드

더 많은 예시는 `/src/examples/worldExample.ts`를 참고하세요.

### 기본 예시

```typescript
import { World, BiomeType } from './world';

const world = new World();

// 무작위 위치의 타일 조회
const tile = world.getTile(
  Math.random() * 4000,
  Math.random() * 3000
);

if (tile) {
  console.log(`위치: (${tile.x}, ${tile.y})`);
  console.log(`바이옴: ${tile.biome}`);
  console.log(`온도: ${tile.temperature.toFixed(1)}°C`);
}
```

### 특정 조건 검색

```typescript
// 따뜻한 숲 찾기 (온도 > 15°C, 숲 바이옴)
const warmForests = world.findTiles(
  (tile) =>
    tile.temperature > 15 &&
    (tile.biome === BiomeType.FOREST ||
     tile.biome === BiomeType.RAINFOREST)
);

console.log(`따뜻한 숲 타일: ${warmForests.length}`);
```

### 대기 시뮬레이션

```typescript
const atmosphereManager = world.getAtmosphereManager();

// 매 시간마다
for (let hour = 0; hour < 24; hour++) {
  const atmosphere = atmosphereManager.getAtmosphere();

  // 식물이 산소 생성
  atmosphereManager.addOxygen(0.1);

  // 호흡으로 CO2 증가
  atmosphereManager.addCarbonDioxide(5);

  // 온도 변화
  if (hour < 12) {
    atmosphereManager.changeGlobalTemperature(0.05);
  } else {
    atmosphereManager.changeGlobalTemperature(-0.05);
  }
}
```

---

## 자주 묻는 질문

**Q: 월드가 매번 다르게 생성되나요?**
A: 네. 현재 시간 기반의 난수를 사용하므로 실행할 때마다 다른 월드가 생성됩니다. 씨드(seed) 기능을 추가하면 같은 월드를 재생할 수 있습니다.

**Q: 청크 크기를 바꿀 수 있나요?**
A: `WorldConfig.ts`의 `chunkSize`를 변경하면 됩니다. 작을수록 세밀한 제어가 가능하지만 메모리 사용량이 증가합니다.

**Q: 아주 큰 월드를 만들 수 있나요?**
A: 청크 시스템 덕분에 이론상 무한한 크기의 월드를 만들 수 있습니다. 필요한 부분만 로드하면 됩니다.

**Q: 바이옴 분포를 조정할 수 있나요?**
A: `TerrainGenerator.ts`의 `determineBiome()` 함수에서 바이옴 판정 기준을 수정하면 됩니다.

---

## 다음 단계

- 강/호수 생성 추가
- 생물 군락 시스템 통합
- 계절 변화 시스템
- 기상 시스템 (바람, 강우)
- 대륙과 섬 생성 강화

---

**작성**: 2024년 11월
**버전**: 1.0.0
