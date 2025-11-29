# Phase 2: 진화 시스템 (Evolution)

> 다세포 생물, 프로시저럴 외형, 성선택 구현

## 목표

단세포 생물에서 다세포 생물로의 진화, 식물/동물 분화, 유전자 기반 외형 생성, 성선택을 통한 복잡한 진화 시스템을 구현합니다.

---

## 1. 다세포 생물 진화

### 1.1 세포 협력 시스템

단세포에서 다세포로의 전환 조건:

```typescript
interface CellCluster {
  cells: Cell[];
  bondStrength: number;     // 결합 강도 (0-1)
  cooperation: number;       // 협력 수준 (0-1)
  specialization: number;    // 분화 수준 (0-1)
}

// 다세포 전환 조건
function canBecomeMulticellular(cluster: CellCluster): boolean {
  return (
    cluster.cells.length >= 4 &&
    cluster.bondStrength > 0.7 &&
    cluster.cooperation > 0.6
  );
}
```

### 1.2 세포 분화 (Differentiation)

```typescript
enum CellType {
  // 공통
  STEM,           // 줄기세포 (미분화)

  // 식물형
  PHOTOSYNTHETIC, // 광합성 세포
  ROOT,           // 뿌리 세포 (영양 흡수)
  STRUCTURAL,     // 구조 세포 (줄기, 잎)
  REPRODUCTIVE,   // 생식 세포

  // 동물형
  SENSORY,        // 감각 세포
  NEURAL,         // 신경 세포
  MUSCLE,         // 근육 세포
  DIGESTIVE,      // 소화 세포
  REPRODUCTIVE,   // 생식 세포
}

interface MulticellularOrganism extends Organism {
  cells: DifferentiatedCell[];
  bodyPlan: BodyPlan;
}
```

### 1.3 신체 계획 (Body Plan)

```typescript
interface BodyPlan {
  symmetry: 'radial' | 'bilateral' | 'asymmetric';
  segments: number;           // 체절 수
  layers: number;             // 배엽 수 (1, 2, 3)

  // 동물 전용
  limbs: LimbConfig[];
  sensoryOrgans: SensoryOrgan[];

  // 식물 전용
  branches: number;
  rootDepth: number;
}

interface LimbConfig {
  type: 'leg' | 'arm' | 'wing' | 'fin' | 'tentacle';
  count: number;
  length: number;
  joints: number;
}
```

---

## 2. 식물/동물 분화

### 2.1 생물 분류 체계

```
                    [원시 생명체]
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
        [광합성]      [분해자]     [섭취자]
            │            │            │
         식물계        균류계       동물계
            │                         │
    ┌───────┴───────┐         ┌──────┴──────┐
    │               │         │             │
  고착형          이동형     초식          육식
  (나무)         (조류)     동물          동물
```

### 2.2 식물 시스템

```typescript
interface Plant extends MulticellularOrganism {
  type: 'plant';

  // 광합성
  chlorophyll: number;        // 엽록소량
  leafArea: number;           // 잎 면적
  photosynthesisRate: number; // 광합성 효율

  // 구조
  height: number;             // 키
  rootDepth: number;          // 뿌리 깊이
  stemStrength: number;       // 줄기 강도

  // 번식
  seedProduction: number;     // 씨앗 생산량
  pollinationType: 'wind' | 'self' | 'animal';
}

// 광합성 시뮬레이션
function photosynthesize(plant: Plant, sunlight: number, co2: number): number {
  const efficiency = plant.chlorophyll * plant.photosynthesisRate;
  const energyProduced = sunlight * co2 * plant.leafArea * efficiency;
  return energyProduced;
}
```

### 2.3 동물 시스템

```typescript
interface Animal extends MulticellularOrganism {
  type: 'animal';

  // 이동
  locomotion: 'walk' | 'swim' | 'fly' | 'crawl';
  speed: number;
  stamina: number;

  // 감각
  visionRange: number;
  visionAngle: number;        // 시야각
  hearingRange: number;
  smellRange: number;

  // 식성
  diet: 'herbivore' | 'carnivore' | 'omnivore';
  digestiveEfficiency: number;

  // 공격/방어
  attackPower: number;
  defense: number;
  venom: number;              // 독성
}
```

### 2.4 먹이사슬

```typescript
interface FoodWeb {
  producers: Species[];       // 생산자 (식물)
  primaryConsumers: Species[];// 1차 소비자 (초식)
  secondaryConsumers: Species[];// 2차 소비자 (육식)
  decomposers: Species[];     // 분해자 (균류)

  // 관계 매트릭스
  preyMatrix: Map<Species, Species[]>;  // 포식 관계
}

// 포식 시도
function attemptPredation(predator: Animal, prey: Organism): boolean {
  const catchChance = calculateCatchChance(predator, prey);
  const escapeChance = calculateEscapeChance(prey, predator);

  return Math.random() < (catchChance - escapeChance);
}
```

---

## 3. 프로시저럴 외형 생성

### 3.1 외형 유전자 구조

```typescript
interface AppearanceGenome {
  // 기본 형태
  bodyShape: BodyShapeGene;
  symmetry: SymmetryGene;
  segments: SegmentGene;

  // 색상
  primaryColor: ColorGene;
  secondaryColor: ColorGene;
  pattern: PatternGene;

  // 부속물
  appendages: AppendageGene[];

  // 텍스처
  texture: TextureGene;
  transparency: number;
  luminescence: number;      // 발광
}

interface BodyShapeGene {
  type: 'blob' | 'elongated' | 'spherical' | 'flat' | 'branching';
  aspectRatio: number;       // 가로세로 비율
  curvature: number;         // 곡률
}

interface ColorGene {
  hue: number;               // 색조 (0-360)
  saturation: number;        // 채도 (0-1)
  lightness: number;         // 명도 (0-1)
  variation: number;         // 변이 정도
}

interface PatternGene {
  type: 'solid' | 'stripes' | 'spots' | 'gradient' | 'patches';
  scale: number;             // 패턴 크기
  contrast: number;          // 대비
  direction: number;         // 방향 (stripes용)
}

interface AppendageGene {
  type: 'limb' | 'tail' | 'horn' | 'fin' | 'wing' | 'antenna' | 'tentacle';
  count: number;
  length: number;
  thickness: number;
  position: number;          // 몸체 위치 (0-1)
  curvature: number;
  joints: number;
}
```

### 3.2 형태 생성 알고리즘

```typescript
class ProceduralBodyGenerator {
  // 기본 몸체 생성
  generateBody(genes: AppearanceGenome): BodyMesh {
    const baseShape = this.createBaseShape(genes.bodyShape);
    const segments = this.applySegmentation(baseShape, genes.segments);
    const symmetrized = this.applySymmetry(segments, genes.symmetry);

    return symmetrized;
  }

  // 부속물 추가
  attachAppendages(body: BodyMesh, appendages: AppendageGene[]): BodyMesh {
    for (const gene of appendages) {
      const limb = this.generateAppendage(gene);
      body = this.attachToBody(body, limb, gene.position);
    }
    return body;
  }

  // 텍스처 및 색상 적용
  applyAppearance(body: BodyMesh, genes: AppearanceGenome): RenderableBody {
    const colorMap = this.generateColorMap(genes.primaryColor, genes.secondaryColor);
    const patternMap = this.generatePattern(genes.pattern);
    const texture = this.combineTextures(colorMap, patternMap);

    return { mesh: body, texture };
  }
}
```

### 3.3 LOD (Level of Detail) 시스템

줌 레벨에 따른 렌더링:

```typescript
enum LODLevel {
  DOT,          // 점 (대륙 뷰)
  SIMPLE,       // 단순 도형 (지역 뷰)
  MEDIUM,       // 기본 형태 + 색상 (마을 뷰)
  DETAILED,     // 전체 디테일 (개체 뷰)
}

function getLODLevel(zoom: number): LODLevel {
  if (zoom < 0.01) return LODLevel.DOT;
  if (zoom < 0.1) return LODLevel.SIMPLE;
  if (zoom < 0.5) return LODLevel.MEDIUM;
  return LODLevel.DETAILED;
}

function renderOrganism(organism: Organism, lod: LODLevel) {
  switch (lod) {
    case LODLevel.DOT:
      return renderAsDot(organism.genome.primaryColor);
    case LODLevel.SIMPLE:
      return renderAsShape(organism.genome.bodyShape);
    case LODLevel.MEDIUM:
      return renderWithColor(organism);
    case LODLevel.DETAILED:
      return renderFullDetail(organism);
  }
}
```

---

## 4. 성선택 시스템

### 4.1 유성 생식 도입

```typescript
interface SexualOrganism extends MulticellularOrganism {
  sex: 'male' | 'female' | 'hermaphrodite';

  // 매력도 관련 유전자
  attractiveness: AttractivenessGenes;

  // 선호도 관련 유전자 (이성 평가 기준)
  preferences: PreferenceGenes;

  // 구애 행동
  courtshipBehavior: CourtshipGene;
}

interface AttractivenessGenes {
  displayFeatures: DisplayFeature[];  // 과시용 특징
  colorIntensity: number;             // 색상 강렬함
  sizeBonus: number;                  // 크기 보너스
  symmetryQuality: number;            // 대칭성
}

interface DisplayFeature {
  type: 'plumage' | 'horn' | 'frill' | 'tail' | 'pattern';
  size: number;
  color: ColorGene;
  complexity: number;
}
```

### 4.2 짝짓기 선호도 신경망

```typescript
interface MatePreferenceNetwork {
  // 입력: 상대방의 외형 특징들
  // 출력: 매력도 점수 (0-1)

  evaluate(candidate: SexualOrganism): number;
}

// 상대 평가
function evaluateMate(evaluator: SexualOrganism, candidate: SexualOrganism): number {
  // 1. 시각적 특징 추출
  const visualFeatures = extractVisualFeatures(candidate);

  // 2. 선호도 신경망으로 평가
  const attractivenessScore = evaluator.matePreferenceNetwork.evaluate(visualFeatures);

  // 3. 기본 조건 (같은 종, 건강 상태 등)
  const basicFitness = calculateBasicFitness(candidate);

  return attractivenessScore * basicFitness;
}
```

### 4.3 구애 행동

```typescript
interface CourtshipBehavior {
  danceComplexity: number;    // 춤 복잡도
  displayDuration: number;    // 과시 시간
  giftGiving: boolean;        // 선물 제공 여부
  territoryDisplay: boolean;  // 영역 과시
  vocalComplexity: number;    // 울음소리 복잡도
}

// 구애 과정
function courtship(male: SexualOrganism, female: SexualOrganism): boolean {
  // 1. 수컷의 구애 행동
  const courtshipQuality = performCourtship(male);

  // 2. 암컷의 평가
  const attractiveness = evaluateMate(female, male);

  // 3. 수락 확률
  const acceptChance = attractiveness * courtshipQuality;

  return Math.random() < acceptChance;
}
```

### 4.4 유전자 교배 (교차)

```typescript
function crossover(parent1: Genome, parent2: Genome): Genome {
  const child: Genome = {};

  for (const gene of Object.keys(parent1)) {
    // 50% 확률로 각 부모에서 유전
    if (Math.random() < 0.5) {
      child[gene] = parent1[gene];
    } else {
      child[gene] = parent2[gene];
    }

    // 돌연변이 체크
    if (Math.random() < mutationRate) {
      child[gene] = mutate(child[gene]);
    }
  }

  return child;
}

// 신경망도 교배
function crossoverBrains(brain1: NeuralNetwork, brain2: NeuralNetwork): NeuralNetwork {
  const childBrain = new NeuralNetwork(brain1.structure);

  for (let i = 0; i < brain1.weights.length; i++) {
    // 가중치별로 랜덤 선택
    childBrain.weights[i] = Math.random() < 0.5
      ? brain1.weights[i]
      : brain2.weights[i];
  }

  return childBrain;
}
```

---

## 5. 확장된 AI 시스템

### 5.1 복잡한 신경망 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    다세포 생물 신경망                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  입력층 (12)           은닉층 (16)          출력층 (8)      │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
│  │ 시각 정보│         │          │         │ 이동 방향│    │
│  │  - 먹이  │         │  ○ ○ ○  │         │ 이동 속도│    │
│  │  - 포식자│  ────▶  │  ○ ○ ○  │  ────▶  │ 공격     │    │
│  │  - 동료  │         │  ○ ○ ○  │         │ 도망     │    │
│  │  - 짝    │         │  ○ ○ ○  │         │ 먹기     │    │
│  │ 청각 정보│         │          │         │ 구애     │    │
│  │ 후각 정보│         │          │         │ 번식     │    │
│  │ 내부 상태│         │          │         │ 휴식     │    │
│  │  - 에너지│         │          │         │          │    │
│  │  - 체력  │         │          │         │          │    │
│  │  - 번식욕│         │          │         │          │    │
│  └──────────┘         └──────────┘         └──────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 기억 시스템 (선택적)

```typescript
interface Memory {
  // 단기 기억
  shortTerm: {
    recentFood: Position[];     // 최근 먹이 위치
    recentDanger: Position[];   // 최근 위험 위치
    recentMates: Organism[];    // 최근 만난 짝
  };

  // 장기 기억 (유전되지 않음)
  longTerm: {
    homeTerritory: Rectangle;   // 서식지
    foodSources: Position[];    // 먹이 출처
    dangerZones: Position[];    // 위험 지역
  };
}
```

---

## 6. Phase 2 완료 기준

### 필수 기능 체크리스트

- [x] 다세포 생물 진화 ✅
- [x] 세포 분화 시스템 ✅
- [x] 식물/동물 분화 ✅
- [x] 먹이사슬 구현 ✅
- [x] 프로시저럴 외형 생성기 ✅
- [x] LOD 렌더링 시스템 ✅
- [x] 성선택 시스템 ✅
- [x] 유성 생식 (유전자 교배) ✅
- [x] 확장된 신경망 AI ✅

### 성공 지표

1. 최소 10개의 구별 가능한 종이 자연 발생
2. 눈에 띄는 외형 다양성 관찰 가능
3. 성선택으로 인한 과시 특징 진화 관찰
4. 안정적인 먹이사슬 형성

---

## 8. Phase 2 개발 로그

### 2024-11-29: Phase 2 완료

#### 구현된 모듈

**다세포 시스템** (`src/organism/multicellular/`)
- `types.ts` - 다세포 관련 타입 정의
- `CellDifferentiation.ts` - 세포 분화 로직
- `BodyPlan.ts` - 신체 계획 시스템
- 9가지 세포 타입: STEM, SENSORY, NEURAL, MUSCLE, DIGESTIVE, STRUCTURAL, PHOTOSYNTHETIC, REPRODUCTIVE, STORAGE

**식물/동물 분화** (`src/organism/species/`)
- `Plant.ts` - 식물 특성 및 광합성
- `Animal.ts` - 동물 특성 및 포식
- `FoodWeb.ts` - 먹이사슬 관계
- `TrophicLevel.ts` - 영양 단계 시스템

**프로시저럴 외형** (`src/organism/appearance/`)
- `AppearanceGenome.ts` - 외형 유전자 구조
- `ProceduralBodyGenerator.ts` - 몸체 생성기
- 7가지 몸체 형태, 5가지 패턴, 부속물 시스템

**성선택/번식** (`src/organism/reproduction/`)
- `MateEvaluator.ts` - 짝 평가 시스템
- `Courtship.ts` - 구애 행동
- `SexualReproduction.ts` - 유성 생식

**확장 AI** (`src/organism/ai/`)
- `AdvancedBrain.ts` - 고급 신경망
- `MemorySystem.ts` - 기억 시스템
- `SensorySystem.ts` - 감각 시스템
- `BehaviorExecutor.ts` - 행동 실행기
- `AIController.ts` - AI 컨트롤러

**LOD 렌더링** (`src/renderer/`)
- `LODRenderer.ts` - 레벨 오브 디테일 렌더링
- `ProceduralRenderer.ts` - 프로시저럴 그래픽
- `OrganismSpriteCache.ts` - 스프라이트 캐싱

#### TypeScript 에러 수정
- 배열 접근 undefined 체크 (`?? defaultValue` 패턴)
- 미사용 매개변수 처리 (`_` 접두사)
- export type 분리
- Genome 필드 추가 (Phase 2 신규 필드)
- BodyShape 타입 매칭

#### 빌드 결과
- 753 모듈 변환 완료
- 2.54초 빌드 성공

---

## 7. 다음 단계 (Phase 3 예고)

Phase 2 완료 후:
- 대륙 규모 확장
- 재앙 시스템
- 상세 관찰 도구
- 환경 상호작용 고도화
