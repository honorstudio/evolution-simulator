# 프로시저럴 외형 생성 시스템

유전자 기반으로 생명체의 외형을 자동 생성하는 시스템입니다.

## 구조

```
appearance/
├── AppearanceGenome.ts      # 외형 유전자 타입 정의
├── ProceduralBodyGenerator.ts # 외형 생성기 (PixiJS 그래픽스 생성)
├── AppearanceMutation.ts     # 돌연변이 및 교배 로직
├── utils.ts                  # 유틸리티 (색상 변환, 랜덤 생성 등)
└── index.ts                  # 통합 내보내기
```

## 주요 타입

### AppearanceGenome
외형을 정의하는 전체 유전자 구조:
- **bodyShape**: 몸체 형태 (blob, elongated, spherical, flat, branching)
- **symmetry**: 대칭성 (radial, bilateral, asymmetric)
- **segments**: 몸체 분절 수
- **primaryColor/secondaryColor**: 주/보조 색상
- **pattern**: 패턴 (solid, stripes, spots, gradient, patches)
- **appendages**: 부속물 배열 (limb, tail, horn, fin, wing, antenna, tentacle)
- **texture**: 텍스처 (smooth, rough, scaly, fuzzy, spiky)
- **transparency**: 투명도
- **luminescence**: 발광도

## 사용법

### 1. 기본 외형 생성

```typescript
import { ProceduralBodyGenerator, createDefaultAppearanceGenome } from './appearance';

const generator = new ProceduralBodyGenerator();
const genome = createDefaultAppearanceGenome();

// PixiJS 그래픽스 생성
const body = generator.generateBody(genome, 20); // 크기 20

// 생성된 그래픽스를 컨테이너에 추가
container.addChild(body.graphics);

console.log('복잡도:', body.complexity); // 0~1 값
console.log('크기:', body.bounds); // { width, height }
```

### 2. 랜덤 외형 생성

```typescript
import { randomAppearanceGenome } from './appearance';

const randomGenome = randomAppearanceGenome();
const body = generator.generateBody(randomGenome, 15);
```

### 3. 돌연변이

```typescript
import { mutateAppearanceGenome } from './appearance';

const mutatedGenome = mutateAppearanceGenome(originalGenome, 0.1); // 10% 돌연변이율
const mutatedBody = generator.generateBody(mutatedGenome, 20);
```

### 4. 교배 (성생식)

```typescript
import { crossoverAppearanceGenomes } from './appearance';

const parent1Genome = randomAppearanceGenome();
const parent2Genome = randomAppearanceGenome();

const childGenome = crossoverAppearanceGenomes(parent1Genome, parent2Genome, 0.05);
const childBody = generator.generateBody(childGenome, 12);
```

### 5. 외형 유사도 계산

```typescript
import { calculateAppearanceSimilarity } from './appearance';

const similarity = calculateAppearanceSimilarity(genome1, genome2);
console.log('유사도:', similarity); // 0~1 (1에 가까울수록 비슷함)
```

### 6. 색상 다루기

```typescript
import { hslToHex, colorGeneToHex, varyColor } from './appearance';

// HSL → 16진수 색상
const color = hslToHex(120, 0.6, 0.5); // 0xRRGGBB

// ColorGene → 16진수
const geneColor = colorGeneToHex(genome.primaryColor);

// 색상 변화 적용
const variedColor = varyColor(genome.primaryColor, 0.5); // seed 값
```

## 유전자 커스터마이징 예제

### 빨간색 길쭉한 생명체

```typescript
import { createDefaultAppearanceGenome } from './appearance';

const genome = createDefaultAppearanceGenome();

// 몸체를 길쭉하게
genome.bodyShape.type = 'elongated';
genome.bodyShape.aspectRatio = 2.0;

// 빨간색으로
genome.primaryColor.hue = 0; // 빨강
genome.primaryColor.saturation = 0.8;
genome.primaryColor.lightness = 0.5;

// 줄무늬 패턴
genome.pattern.type = 'stripes';
genome.pattern.scale = 0.5;

const body = generator.generateBody(genome, 20);
```

### 촉수 달린 생명체

```typescript
const genome = createDefaultAppearanceGenome();

// 구형 몸체
genome.bodyShape.type = 'spherical';

// 촉수 6개 추가
genome.appendages.push({
  type: 'tentacle',
  count: 6,
  length: 1.5,
  thickness: 0.3,
  position: 0.8,
  curvature: 0.5,
  joints: 3,
});

const body = generator.generateBody(genome, 15);
```

### 발광하는 생명체

```typescript
const genome = createDefaultAppearanceGenome();

// 발광도 높이기
genome.luminescence = 0.8;

// 밝은 청록색
genome.primaryColor.hue = 180;
genome.primaryColor.saturation = 0.9;
genome.primaryColor.lightness = 0.7;

const body = generator.generateBody(genome, 18);
```

## 성능 고려사항

### 복잡도에 따른 LOD
외형의 `complexity` 값을 사용해 줌 레벨에 따라 렌더링 수준을 조절하세요:

```typescript
const body = generator.generateBody(genome, size);

if (zoom < 0.3 || body.complexity > 0.7) {
  // 간단한 점이나 원으로 대체
  graphics.circle(x, y, size * 0.5);
  graphics.fill(colorGeneToHex(genome.primaryColor));
} else {
  // 전체 외형 렌더링
  container.addChild(body.graphics);
}
```

### 재사용
동일한 유전자는 그래픽스를 캐싱하여 재사용하세요:

```typescript
const cache = new Map<string, PIXI.Graphics>();

function getCachedBody(genomeId: string, genome: AppearanceGenome) {
  if (!cache.has(genomeId)) {
    const body = generator.generateBody(genome, 20);
    cache.set(genomeId, body.graphics);
  }
  return cache.get(genomeId)!.clone();
}
```

## 주의사항

1. **PixiJS 의존성**: 이 시스템은 PixiJS Graphics API를 사용합니다.
2. **성능**: 복잡한 외형 (많은 부속물, 패턴)은 렌더링 비용이 높습니다.
3. **범위 제한**: 모든 수치 값은 적절한 범위로 제한되어 있습니다.
4. **돌연변이율**: 일반적으로 0.05 ~ 0.2 사이가 적절합니다.

## 향후 확장

- [ ] 셰이더 기반 텍스처 효과
- [ ] 애니메이션 (부속물 움직임)
- [ ] 3D 외형 지원
- [ ] 더 다양한 패턴 타입
- [ ] 외형 간 모핑 효과
