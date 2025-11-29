# 생물 분류 시스템 (Species System)

식물과 동물의 특화된 행동과 생태계 상호작용을 시뮬레이션하는 시스템입니다.

## 개요

이 모듈은 생명체를 **식물(Plant)**과 **동물(Animal)**로 분류하고, 각각의 고유한 특성과 행동을 구현합니다.

### 주요 기능

- **식물**: 광합성, 성장, 씨앗 생산
- **동물**: 이동, 감각, 포식, 도망
- **먹이사슬**: 생산자-소비자 관계, 에너지 흐름

## 파일 구조

```
species/
├── types.ts        # 타입 정의
├── Plant.ts        # 식물 시스템
├── Animal.ts       # 동물 시스템
├── FoodWeb.ts      # 먹이사슬 관리
├── index.ts        # 모듈 내보내기
└── README.md       # 이 파일
```

## 사용 예시

### 1. 식물 생성 및 광합성

```typescript
import { createPlantTraits, performPhotosynthesis } from './species';

// 유전자로부터 식물 특성 생성
const genes = [0.8, 0.6, 0.7, 0.5, 0.4, 0.6, 0.7, 0.3, 0.5, 0.6];
const plantTraits = createPlantTraits(genes);

// 광합성 수행
const energy = performPhotosynthesis(plantTraits, {
  sunlight: 0.8,      // 햇빛 강도
  temperature: 25,    // 온도 (섭씨)
  co2Level: 0.5,      // CO2 농도
  deltaTime: 1.0,     // 시간 델타 (초)
});

console.log(`생성된 에너지: ${energy}`);
```

### 2. 동물 생성 및 이동

```typescript
import { createAnimalTraits, calculateMovementCost } from './species';

// 유전자로부터 동물 특성 생성
const genes = [0.2, 0.7, 0.6, 0.8, 0.5, 0.6, 0.7, 0.4, 0.6, 0.7, 0.5, 0.3, 0.4];
const animalTraits = createAnimalTraits(genes);

// 이동 에너지 소비 계산
const energyCost = calculateMovementCost(
  animalTraits,
  0.8,  // 최대 속도의 80%로 이동
  1.0   // 1초 동안
);

console.log(`이동 에너지 소비: ${energyCost}`);
console.log(`이동 방식: ${animalTraits.locomotion}`);
```

### 3. 포식 시뮬레이션

```typescript
import { simulatePredation, createAnimalTraits } from './species';

const predator = createAnimalTraits([...]); // 육식동물
const prey = createAnimalTraits([...]);     // 초식동물

const result = simulatePredation(
  predator,
  prey,
  100, // 포식자 에너지
  80   // 피식자 에너지
);

if (result.success) {
  console.log(`포식 성공! 획득 에너지: ${result.energyGained}`);
  console.log(`포식자 피해: ${result.damageToAttacker}`);
  console.log(`피식자 피해: ${result.damageToDefender}`);
} else {
  console.log('포식 실패');
}
```

### 4. 감각 시스템

```typescript
import { detectObject } from './species';

const detection = detectObject(
  animalTraits,
  { x: 100, y: 100 },  // 자신의 위치
  { x: 150, y: 120 },  // 먹이의 위치
  'food'               // 대상 타입
);

if (detection) {
  console.log(`먹이 발견! 거리: ${detection.distance}, 각도: ${detection.angle}`);
}
```

### 5. 생태계 균형 평가

```typescript
import { calculateEcosystemBalance, evaluateEcosystemHealth } from './species';

// 모든 생물의 특성 배열
const organisms = [plantTraits1, animalTraits1, animalTraits2, ...];

// 영양 단계별 개체 수 계산
const balance = calculateEcosystemBalance(organisms);
console.log('생산자:', balance.producer);
console.log('1차 소비자:', balance.primary);
console.log('2차 소비자:', balance.secondary);

// 생태계 건강도 평가 (0-1)
const health = evaluateEcosystemHealth(balance);
console.log(`생태계 건강도: ${(health * 100).toFixed(1)}%`);
```

## 핵심 개념

### 영양 단계 (Trophic Level)

```
생산자 (Producer)           → 식물, 광합성 생물
  ↓
1차 소비자 (Primary)        → 초식동물
  ↓
2차 소비자 (Secondary)      → 육식동물
  ↓
3차 소비자 (Tertiary)       → 최상위 포식자
```

### 에너지 흐름

- 광합성: 빛 → 화학 에너지 (100%)
- 식물 → 초식동물: 10% 전달
- 초식동물 → 육식동물: 10% 전달
- 육식동물 → 최상위 포식자: 10% 전달

### 식성 (Diet)

- **초식 (Herbivore)**: 식물만 섭취
- **육식 (Carnivore)**: 동물만 섭취
- **잡식 (Omnivore)**: 식물과 동물 모두 섭취

## 성능 특성

### 시간 복잡도

- `performPhotosynthesis`: **O(1)** - 상수 시간
- `calculateMovementCost`: **O(1)** - 상수 시간
- `detectObject`: **O(1)** - 거리 계산만
- `simulatePredation`: **O(1)** - 확률 계산
- `calculateEcosystemBalance`: **O(n)** - 모든 생물 순회

### 공간 복잡도

- 모든 함수: **O(1)** - 고정 크기 데이터 구조만 사용

## 확장 가능성

### 미래 추가 가능 항목

1. **균류 시스템** (Fungus.ts)
   - 분해자 역할
   - 공생 관계 (균근)

2. **공생 관계** (Symbiosis.ts)
   - 상리공생
   - 기생
   - 편리공생

3. **질병 시스템** (Disease.ts)
   - 전염병 확산
   - 면역 체계

4. **계절 적응** (SeasonalAdaptation.ts)
   - 동면
   - 철새 이동

## 주의사항

### 유전자 배열 요구사항

- **식물**: 최소 10개의 유전자 (0-1 범위)
- **동물**: 최소 13개의 유전자 (0-1 범위)

### 균형 조정

생태계가 불안정해지면:

1. 생산자(식물) 수를 늘리기
2. 최상위 포식자 수를 제한
3. 에너지 전달 효율 조정 (`ENERGY_TRANSFER_EFFICIENCY`)

## 디버깅 팁

### 식물이 성장하지 않을 때

```typescript
// 광합성 효율 확인
const tempFactor = calculateTemperatureFactor(temperature);
console.log('온도 계수:', tempFactor);

// 스트레스 확인
const stress = calculatePlantStress(traits, temperature, moisture, wind);
console.log('스트레스 수준:', stress);
```

### 동물이 먹이를 못 찾을 때

```typescript
// 감각 범위 확인
console.log('시각 범위:', animalTraits.visionRange);
console.log('후각 범위:', animalTraits.smellRange);

// 거리 계산
const distance = Math.sqrt((target.x - pos.x)**2 + (target.y - pos.y)**2);
console.log('먹이까지 거리:', distance);
```

## 참고 자료

- [생태 피라미드 (Ecological Pyramid)](https://en.wikipedia.org/wiki/Ecological_pyramid)
- [에너지 흐름 (Energy Flow)](https://en.wikipedia.org/wiki/Energy_flow_(ecology))
- [영양 단계 (Trophic Level)](https://en.wikipedia.org/wiki/Trophic_level)
