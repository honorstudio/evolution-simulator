# 렌더링 시스템 가이드

Evolution Simulator의 렌더링 시스템은 PixiJS v8을 사용하여 대규모 시뮬레이션을 효율적으로 렌더링합니다.

## 구조

```
src/renderer/
├── Renderer.ts          # 메인 렌더러 (PixiJS 애플리케이션 관리)
├── Camera.ts            # 카메라 시스템 (줌, 팬, 좌표 변환)
├── InputHandler.ts      # 입력 처리 (마우스, 터치)
├── TerrainRenderer.ts   # 지형 렌더링 (타일맵, 청크)
├── colors.ts            # 색상 팔레트 및 유틸리티
└── index.ts             # Export 통합
```

## 주요 기능

### 1. PixiJS v8 초기화

```typescript
const renderer = new Renderer();
await renderer.init(canvas); // async 초기화
```

- WebGL 렌더링 (WebGPU 준비)
- 고해상도 디스플레이 지원 (Retina)
- 자동 리사이징

### 2. 카메라 시스템

```typescript
const camera = renderer.getCamera();

// 이동
camera.moveTo(x, y);

// 줌
camera.zoomIn();
camera.zoomOut();
camera.setZoom(1.5);

// 좌표 변환
const worldPos = camera.screenToWorld(mouseX, mouseY);
const screenPos = camera.worldToScreen(entityX, entityY);
```

**기능:**
- 부드러운 줌 보간
- 드래그로 이동
- 마우스 휠 줌 (커서 위치 고정)
- 뷰포트 컬링 지원

### 3. LOD (Level of Detail) 시스템

줌 레벨에 따라 렌더링 디테일 자동 조절:

| 줌 레벨 | LOD | 설명 |
|---------|-----|------|
| < 0.1   | DOT | 점으로만 표시 |
| 0.1-0.3 | SIMPLE | 단순 도형 |
| 0.3-0.7 | MEDIUM | 기본 외형 + 고도 |
| > 0.7   | DETAILED | 상세 외형 + 디테일 |

```typescript
const lod = camera.getLODLevel();
if (lod === LODLevel.DETAILED) {
  // 상세 렌더링
}
```

### 4. 지형 렌더링

**청크 기반 시스템:**
- 16x16 셀 청크로 분할
- 뷰포트 컬링 (보이는 청크만 렌더링)
- 바이옴별 색상 자동 적용

```typescript
const terrainRenderer = new TerrainRenderer(camera);

// 청크 렌더링
terrainRenderer.renderChunk(chunkData);

// 매 프레임 업데이트 (컬링)
terrainRenderer.update();
```

**지원 바이옴:**
- 심해 (DEEP_OCEAN)
- 바다 (OCEAN)
- 해변 (BEACH)
- 사막 (DESERT)
- 초원 (GRASSLAND)
- 숲 (FOREST)
- 열대우림 (RAINFOREST)
- 툰드라 (TUNDRA)
- 눈 (SNOW)
- 산 (MOUNTAIN)

### 5. 입력 처리

**마우스:**
- 좌클릭 드래그: 카메라 이동
- 마우스 휠: 줌 인/아웃
- 클릭: 개체 선택 (예정)

**키보드:**
- `+` / `-`: 줌 조절
- `Home`: 원점으로 리셋

**터치:**
- 단일 터치: 드래그
- 핀치 줌: 예정

### 6. 색상 시스템

자연 다큐멘터리 스타일의 사실적인 색상:

```typescript
import { BIOME_COLORS, hslToHex } from './renderer';

// 바이옴 색상
const grassColor = BIOME_COLORS.GRASSLAND;

// HSL 변환
const customColor = hslToHex(120, 50, 40);
```

## 성능 최적화

### 1. 뷰포트 컬링
화면 밖 개체는 렌더링 스킵:

```typescript
const bounds = camera.getVisibleBounds();
// bounds 안에 있는 개체만 렌더링
```

### 2. LOD 시스템
줌 아웃 시 디테일 자동 감소

### 3. 청크 시스템
- 월드를 청크로 분할
- 보이는 청크만 활성화
- 청크 캐싱으로 재렌더링 최소화

### 4. 인스턴스 렌더링 (예정)
대량 개체는 ParticleContainer 사용:
- 10만개 이상의 개체 렌더링
- 제한된 속성만 변경 가능 (위치, 틴트, 스케일)

## 성능 목표

| 개체 수 | 목표 FPS | 기법 |
|---------|----------|------|
| 1,000 | 60 | 기본 렌더링 |
| 10,000 | 60 | LOD + 컬링 |
| 100,000 | 30+ | ParticleContainer |

## 디버그 기능

**성능 모니터:**
- FPS 표시
- 줌 레벨
- 카메라 위치

**그리드 표시:**
- 100px 간격 그리드
- 원점 표시 (빨간 십자)

## 사용 예제

```typescript
// 1. 렌더러 생성
const renderer = new Renderer();
await renderer.init(canvas);

// 2. 지형 생성 (테스트용)
const terrainRenderer = renderer.getTerrainRenderer();
terrainRenderer.generateTestTerrain();

// 3. 카메라 제어
const camera = renderer.getCamera();
camera.moveTo(500, 500);
camera.setZoom(2);

// 4. 매 프레임 자동 업데이트 (PixiJS ticker)
// 별도 호출 불필요
```

## 다음 단계

- [ ] OrganismRenderer 구현 (생물체 렌더링)
- [ ] ParticleContainer 통합 (대량 개체)
- [ ] 프로시저럴 외형 생성
- [ ] 선택 UI
- [ ] 미니맵
- [ ] 통계 패널

## 참고 자료

- [PixiJS v8 Documentation](https://pixijs.com/)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
