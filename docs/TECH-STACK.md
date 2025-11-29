# 기술 스택 (Tech Stack)

> 진화 시뮬레이터 개발에 사용되는 기술 상세

---

## 1. 프론트엔드 프레임워크

### 1.1 React + TypeScript

```bash
# 프로젝트 생성
npm create vite@latest evolution-simulator -- --template react-ts
```

**선택 이유:**
- 컴포넌트 기반 UI 구조
- TypeScript로 타입 안정성 확보
- 풍부한 생태계와 라이브러리

**주요 라이브러리:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",        // 상태 관리
    "immer": "^10.0.0",          // 불변성 관리
    "@tanstack/react-query": "^5.0.0"  // 비동기 상태
  }
}
```

### 1.2 빌드 도구: Vite

**선택 이유:**
- 빠른 개발 서버 (HMR)
- ESBuild 기반 빠른 빌드
- 최신 JavaScript 지원

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          simulation: ['./src/core/simulation.ts'],
          rendering: ['./src/core/renderer.ts']
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
});
```

---

## 2. 렌더링 시스템

### 2.1 Canvas 2D + WebGL 하이브리드

**Phase 1-2: Canvas 2D**
```typescript
// 간단한 2D 렌더링
class Canvas2DRenderer {
  private ctx: CanvasRenderingContext2D;

  render(organisms: Organism[]) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (const org of organisms) {
      this.ctx.fillStyle = `rgb(${org.color.r}, ${org.color.g}, ${org.color.b})`;
      this.ctx.beginPath();
      this.ctx.arc(org.x, org.y, org.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
```

**Phase 3-4: WebGL/WebGPU**
```typescript
// 고성능 GPU 렌더링
class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private instancedShader: Shader;

  // 인스턴스 렌더링으로 수만 개체 처리
  renderInstanced(organisms: Organism[]) {
    // 인스턴스 데이터를 GPU 버퍼로 전송
    this.updateInstanceBuffer(organisms);

    // 한 번의 드로우 콜로 모든 개체 렌더링
    this.gl.drawArraysInstanced(
      this.gl.TRIANGLE_STRIP,
      0,
      4,
      organisms.length
    );
  }
}
```

### 2.2 렌더링 라이브러리 옵션

| 라이브러리 | 용도 | 장점 |
|-----------|------|------|
| **PixiJS** | 2D 렌더링 | 쉬운 사용, 좋은 성능 |
| **Three.js** | 3D 렌더링 | 풍부한 기능 (2D도 가능) |
| **Raw WebGL** | 커스텀 | 최대 성능, 완전한 제어 |
| **WebGPU** | 차세대 | 최신 성능 (지원 브라우저 제한) |

**추천: PixiJS (Phase 1-2) → Raw WebGL (Phase 3-4)**

```bash
npm install pixi.js
```

```typescript
import * as PIXI from 'pixi.js';

class PixiRenderer {
  private app: PIXI.Application;
  private organismSprites: Map<string, PIXI.Sprite> = new Map();

  async init(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application();
    await this.app.init({
      canvas,
      width: 1920,
      height: 1080,
      antialias: true,
      backgroundColor: 0x1a1a2e
    });
  }

  addOrganism(organism: Organism) {
    const sprite = new PIXI.Sprite(this.getTexture(organism));
    sprite.position.set(organism.x, organism.y);
    sprite.scale.set(organism.size / 10);
    this.app.stage.addChild(sprite);
    this.organismSprites.set(organism.id, sprite);
  }
}
```

---

## 3. AI/신경망 시스템

### 3.1 TensorFlow.js

**선택 이유:**
- 브라우저 내 GPU 가속
- 다양한 신경망 구조 지원
- WebGL/WebGPU 백엔드

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgl
```

```typescript
import * as tf from '@tensorflow/tfjs';

class OrganismBrain {
  private model: tf.LayersModel;

  constructor(inputSize: number, hiddenSize: number, outputSize: number) {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: hiddenSize,
          activation: 'relu',
          inputShape: [inputSize]
        }),
        tf.layers.dense({
          units: hiddenSize,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: outputSize,
          activation: 'tanh'
        })
      ]
    });
  }

  // 추론 (의사결정)
  decide(inputs: number[]): number[] {
    return tf.tidy(() => {
      const inputTensor = tf.tensor2d([inputs]);
      const output = this.model.predict(inputTensor) as tf.Tensor;
      return Array.from(output.dataSync());
    });
  }

  // 가중치 추출 (저장/복제용)
  getWeights(): Float32Array[] {
    return this.model.getWeights().map(w => w.dataSync() as Float32Array);
  }

  // 가중치 설정 (로드/상속용)
  setWeights(weights: Float32Array[]) {
    const tensors = weights.map(w => tf.tensor(w));
    this.model.setWeights(tensors);
  }
}
```

### 3.2 커스텀 경량 신경망 (대안)

TensorFlow.js가 너무 무거우면 직접 구현:

```typescript
class LightweightNeuralNetwork {
  private weights: Float32Array[];
  private biases: Float32Array[];

  constructor(layerSizes: number[]) {
    this.weights = [];
    this.biases = [];

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const inputSize = layerSizes[i];
      const outputSize = layerSizes[i + 1];

      // Xavier 초기화
      const scale = Math.sqrt(2 / (inputSize + outputSize));
      this.weights.push(
        new Float32Array(inputSize * outputSize).map(() =>
          (Math.random() - 0.5) * 2 * scale
        )
      );
      this.biases.push(new Float32Array(outputSize).fill(0));
    }
  }

  forward(input: Float32Array): Float32Array {
    let activation = input;

    for (let i = 0; i < this.weights.length; i++) {
      activation = this.layerForward(
        activation,
        this.weights[i],
        this.biases[i],
        i === this.weights.length - 1 ? 'tanh' : 'relu'
      );
    }

    return activation;
  }

  private layerForward(
    input: Float32Array,
    weights: Float32Array,
    biases: Float32Array,
    activation: 'relu' | 'tanh'
  ): Float32Array {
    const outputSize = biases.length;
    const inputSize = input.length;
    const output = new Float32Array(outputSize);

    for (let o = 0; o < outputSize; o++) {
      let sum = biases[o];
      for (let i = 0; i < inputSize; i++) {
        sum += input[i] * weights[o * inputSize + i];
      }
      output[o] = activation === 'relu'
        ? Math.max(0, sum)
        : Math.tanh(sum);
    }

    return output;
  }
}
```

---

## 4. 병렬 처리

### 4.1 Web Workers

**구조:**
```
Main Thread (UI/렌더링)
    │
    ├── Simulation Worker (시뮬레이션 로직)
    │
    ├── AI Worker Pool (신경망 연산)
    │   ├── Worker 1
    │   ├── Worker 2
    │   └── Worker N
    │
    └── Environment Worker (환경 업데이트)
```

```typescript
// workers/simulationWorker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case 'UPDATE_ORGANISMS':
      const updated = updateOrganisms(data.organisms, data.deltaTime);
      self.postMessage({ type: 'ORGANISMS_UPDATED', data: updated });
      break;

    case 'SPAWN_OFFSPRING':
      const offspring = processReproduction(data.parents);
      self.postMessage({ type: 'OFFSPRING_SPAWNED', data: offspring });
      break;
  }
};

// 메인 스레드에서 사용
class WorkerManager {
  private simulationWorker: Worker;
  private aiWorkerPool: Worker[];

  constructor() {
    this.simulationWorker = new Worker(
      new URL('./workers/simulationWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.aiWorkerPool = Array(navigator.hardwareConcurrency - 2)
      .fill(null)
      .map(() => new Worker(
        new URL('./workers/aiWorker.ts', import.meta.url),
        { type: 'module' }
      ));
  }

  async updateOrganisms(organisms: Organism[], deltaTime: number) {
    return new Promise((resolve) => {
      this.simulationWorker.onmessage = (e) => {
        if (e.data.type === 'ORGANISMS_UPDATED') {
          resolve(e.data.data);
        }
      };
      this.simulationWorker.postMessage({
        type: 'UPDATE_ORGANISMS',
        data: { organisms, deltaTime }
      });
    });
  }
}
```

### 4.2 SharedArrayBuffer (고성능 데이터 공유)

```typescript
// 공유 메모리 버퍼
const sharedBuffer = new SharedArrayBuffer(
  MAX_ORGANISMS * ORGANISM_DATA_SIZE
);

// TypedArray 뷰
const positionX = new Float32Array(sharedBuffer, 0, MAX_ORGANISMS);
const positionY = new Float32Array(sharedBuffer, MAX_ORGANISMS * 4, MAX_ORGANISMS);
const energy = new Float32Array(sharedBuffer, MAX_ORGANISMS * 8, MAX_ORGANISMS);

// 워커에서 직접 접근
// 메인 스레드와 워커가 같은 메모리 공유
```

---

## 5. 상태 관리

### 5.1 Zustand

```bash
npm install zustand immer
```

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface GameState {
  // 시뮬레이션 상태
  isRunning: boolean;
  speed: number;
  currentTick: number;

  // 세계 데이터
  world: World | null;
  organisms: Map<string, Organism>;

  // 선택 상태
  selectedOrganism: string | null;
  trackedSpecies: string[];

  // 액션
  start: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  selectOrganism: (id: string | null) => void;
  updateOrganism: (id: string, updates: Partial<Organism>) => void;
}

export const useGameStore = create<GameState>()(
  immer((set) => ({
    isRunning: false,
    speed: 1,
    currentTick: 0,
    world: null,
    organisms: new Map(),
    selectedOrganism: null,
    trackedSpecies: [],

    start: () => set({ isRunning: true }),
    pause: () => set({ isRunning: false }),
    setSpeed: (speed) => set({ speed }),

    selectOrganism: (id) => set({ selectedOrganism: id }),

    updateOrganism: (id, updates) =>
      set((state) => {
        const org = state.organisms.get(id);
        if (org) {
          Object.assign(org, updates);
        }
      }),
  }))
);
```

---

## 6. 저장소

### 6.1 IndexedDB (Dexie.js)

```bash
npm install dexie
```

```typescript
import Dexie, { Table } from 'dexie';

interface SaveGame {
  id?: number;
  name: string;
  createdAt: Date;
  worldData: Blob;
  thumbnail: Blob;
}

class GameDatabase extends Dexie {
  saves!: Table<SaveGame>;

  constructor() {
    super('EvolutionSimulator');
    this.version(1).stores({
      saves: '++id, name, createdAt'
    });
  }
}

const db = new GameDatabase();

// 저장
async function saveGame(name: string, worldData: any) {
  const compressed = await compressData(worldData);
  const thumbnail = await captureScreenshot();

  await db.saves.add({
    name,
    createdAt: new Date(),
    worldData: compressed,
    thumbnail
  });
}

// 불러오기
async function loadGame(id: number) {
  const save = await db.saves.get(id);
  if (save) {
    const worldData = await decompressData(save.worldData);
    return worldData;
  }
}
```

---

## 7. 노이즈 및 절차적 생성

### 7.1 SimplexNoise

```bash
npm install simplex-noise
```

```typescript
import { createNoise2D, createNoise3D } from 'simplex-noise';

class WorldGenerator {
  private elevationNoise = createNoise2D();
  private moistureNoise = createNoise2D();
  private temperatureNoise = createNoise2D();

  generateTerrain(width: number, height: number): Cell[][] {
    const terrain: Cell[][] = [];

    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        // 다중 옥타브 노이즈
        const elevation = this.octaveNoise(x, y, 6, 0.5, 0.003);
        const moisture = this.octaveNoise(x + 1000, y + 1000, 4, 0.5, 0.005);
        const temperature = this.calculateTemperature(y, height, elevation);

        terrain[y][x] = {
          x, y,
          elevation,
          moisture,
          temperature,
          terrain: this.determineTerrain(elevation, moisture, temperature)
        };
      }
    }

    return terrain;
  }

  private octaveNoise(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
    scale: number
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.elevationNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return (value / maxValue + 1) / 2; // 0-1 정규화
  }
}
```

---

## 8. 개발 도구

### 8.1 필수 패키지

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "prettier": "^3.1.0"
  }
}
```

### 8.2 VS Code 확장

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- WebGL GLSL Editor
- GitLens

### 8.3 디버깅 도구

```typescript
// 개발 모드 디버그 패널
const DEBUG_CONFIG = {
  showFPS: true,
  showOrganismCount: true,
  showMemoryUsage: true,
  showChunkBorders: true,
  showSenseRanges: false,
  logAIDecisions: false,
  pauseOnError: true
};

// 성능 프로파일러
class Profiler {
  private marks: Map<string, number> = new Map();

  start(label: string) {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const start = this.marks.get(label);
    if (start) {
      return performance.now() - start;
    }
    return 0;
  }
}
```

---

## 9. 전체 의존성 요약

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "immer": "^10.0.0",
    "pixi.js": "^8.0.0",
    "@tensorflow/tfjs": "^4.15.0",
    "simplex-noise": "^4.0.0",
    "dexie": "^3.2.0",
    "lz-string": "^1.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 10. 브라우저 호환성

| 기능 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Canvas 2D | ✅ | ✅ | ✅ | ✅ |
| WebGL 2 | ✅ | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ |
| SharedArrayBuffer | ✅ | ✅ | ✅* | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| WebGPU | ✅ | 🔄 | 🔄 | ✅ |

*Safari는 cross-origin isolation 필요

```typescript
// 기능 감지
const features = {
  webgl2: !!document.createElement('canvas').getContext('webgl2'),
  webgpu: 'gpu' in navigator,
  sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
  offscreenCanvas: typeof OffscreenCanvas !== 'undefined'
};
```
