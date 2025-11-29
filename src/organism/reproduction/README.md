# 성선택 시스템 (Sexual Selection System)

유성생식, 짝짓기 선택, 구애 행동을 구현한 시스템입니다.

## 개요

이 시스템은 다윈의 성선택 이론을 기반으로 구현되었습니다:

1. **짝짓기 선택**: 개체가 짝을 평가하고 선택
2. **구애 행동**: 짝을 유혹하기 위한 행동 패턴
3. **유성생식**: 두 부모의 유전자를 교배하여 자식 생성

## 주요 컴포넌트

### 1. MateEvaluator (짝 평가자)

상대 개체의 매력도와 적합도를 평가합니다.

```typescript
import { MateEvaluator } from './reproduction';

const evaluator = new MateEvaluator();
const evaluation = evaluator.evaluateMate(female, male);

console.log(evaluation);
// {
//   attractivenessScore: 0.75,  // 매력도 점수
//   fitnessScore: 0.82,          // 적합도 점수
//   compatibilityScore: 0.68,    // 호환성 점수
//   overallScore: 0.75,          // 종합 점수
//   accepted: true               // 수락 여부
// }
```

### 2. CourtshipManager (구애 관리자)

짝짓기 전 구애 행동을 수행하고 평가합니다.

```typescript
import { CourtshipManager } from './reproduction';

const courtship = new CourtshipManager();
const result = courtship.courtship(male, female);

if (result.success) {
  console.log('구애 성공!', result.performanceScore);
} else {
  console.log('구애 실패:', result.response);
}
```

### 3. SexualReproductionManager (유성생식 관리자)

두 부모의 유전자를 교배하여 자식을 생성합니다.

```typescript
import { SexualReproductionManager } from './reproduction';

const reproduction = new SexualReproductionManager();
const result = reproduction.createOffspring(parent1, parent2, {
  mutationRate: 0.1,
  uniformCrossover: true,
  respectDominance: false,
});

if (result.success) {
  console.log('자식 생성 성공!', result.offspring);
}
```

## 전체 프로세스 예제

```typescript
import {
  MateEvaluator,
  CourtshipManager,
  SexualReproductionManager,
  initializeSexualTraits,
} from './reproduction';

// 1. 성적 특성 초기화
const male = {
  ...otherProperties,
  ...initializeSexualTraits('male'),
};

const female = {
  ...otherProperties,
  ...initializeSexualTraits('female'),
};

// 2. 짝 평가
const evaluator = new MateEvaluator();
const evaluation = evaluator.evaluateMate(female, male);

if (!evaluation.accepted) {
  console.log('암컷이 수컷을 거부했습니다.');
  return;
}

// 3. 구애 진행
const courtship = new CourtshipManager();
const courtshipResult = courtship.courtship(male, female);

if (!courtshipResult.success) {
  console.log('구애 실패:', courtshipResult.response);
  return;
}

// 4. 번식
const reproduction = new SexualReproductionManager();
const reproductionResult = reproduction.createOffspring(male, female);

if (reproductionResult.success) {
  console.log('새 생명 탄생!');
  const baby = reproductionResult.offspring;
  console.log('성별:', baby.sex);
  console.log('디스플레이 특징:', baby.attractiveness.displayFeatures);
}
```

## 유전자 구조

### AttractivenessGenes (매력도 유전자)

짝에게 보이는 외형적 특징:

```typescript
interface AttractivenessGenes {
  displayFeatures: DisplayFeature[];  // 깃털, 뿔 등
  colorIntensity: number;             // 색상 강도
  sizeBonus: number;                  // 크기 보너스
  symmetryQuality: number;            // 대칭성
  healthIndicators: number;           // 건강 지표
}
```

### PreferenceGenes (선호도 유전자)

짝을 선택할 때 선호하는 특징:

```typescript
interface PreferenceGenes {
  preferredColorHue: number;      // 선호 색조
  preferredSize: number;          // 선호 크기
  preferredSymmetry: number;      // 선호 대칭성
  preferredDisplaySize: number;   // 선호 디스플레이 크기
  selectivity: number;            // 까다로움 (높을수록 선택적)
}
```

### CourtshipBehavior (구애 행동)

짝짓기 전 수행하는 행동:

```typescript
interface CourtshipBehavior {
  danceComplexity: number;    // 춤 복잡도
  displayDuration: number;    // 과시 시간
  giftGiving: boolean;        // 선물 제공
  territoryDisplay: boolean;  // 영역 과시
  vocalComplexity: number;    // 울음소리 복잡도
  energyCost: number;         // 에너지 비용
}
```

## 성별 시스템

3가지 성별을 지원합니다:

- **male**: 수컷 (화려한 외형, 복잡한 구애)
- **female**: 암컷 (선택적, 높은 기준)
- **hermaphrodite**: 자웅동체 (모든 성별과 호환)

## 진화 메커니즘

### 1. 성선택 (Sexual Selection)

- 피셔의 폭주 선택 (Fisherian Runaway): 화려한 특징이 계속 과장됨
- 좋은 유전자 가설: 건강한 개체만 화려한 특징을 유지 가능

### 2. 유전자 교배

- **균등 교배**: 각 유전자를 50% 확률로 선택
- **중간값 교배**: 두 부모의 평균값 사용
- **돌연변이**: 일정 확률로 무작위 변화

### 3. 색상 다양성

- 너무 비슷한 색상끼리는 호환성 감점
- 유전적 다양성 유지

## 성능 고려사항

### 에너지 시스템

- 번식 에너지: 번식에 필요한 에너지 (0-100)
- 최소 에너지: 번식 가능 최소값 (기본 30)
- 구애 비용: 구애 행동에 드는 에너지

### 쿨다운 시스템

- 짝짓기 후 일정 시간 대기 (기본 60초)
- 과도한 번식 방지

### 성숙 시스템

```typescript
import { updateReproductiveStatus } from './reproduction/helpers';

// 매 프레임 호출
updateReproductiveStatus(organism, age, health);

// 성숙 조건:
// - 나이 100틱 이상
// - 건강도 70% 이상
// - 번식 에너지 30 이상
```

## 헬퍼 함수

### initializeSexualTraits()

새 생명체에게 성적 특성 부여:

```typescript
const traits = initializeSexualTraits('male', 1.0);
// randomness: 0-1 (높을수록 다양한 특성)
```

### colorToHex()

색상 유전자를 렌더링용 16진수로 변환:

```typescript
const hexColor = colorToHex(organism.attractiveness.displayFeatures[0].color);
// "#FF5733"
```

### areSexesCompatible()

성별 호환성 확인:

```typescript
if (areSexesCompatible(org1.sex, org2.sex)) {
  // 짝짓기 가능
}
```

## 통합 예제

OrganismManager에 통합하는 예제:

```typescript
class OrganismManager {
  private mateEvaluator = new MateEvaluator();
  private courtship = new CourtshipManager();
  private reproduction = new SexualReproductionManager();

  update(deltaTime: number) {
    // 짝짓기 가능한 개체 찾기
    for (const org of this.organisms) {
      if (!org.isReproductivelyActive) continue;

      const nearby = this.findNearbyMates(org, 50);

      for (const mate of nearby) {
        // 평가
        const evaluation = this.mateEvaluator.evaluateMate(org, mate);
        if (!evaluation.accepted) continue;

        // 구애
        const courtshipResult = this.courtship.courtship(mate, org);
        if (!courtshipResult.success) continue;

        // 번식
        const result = this.reproduction.createOffspring(org, mate);
        if (result.success) {
          this.addOrganism(result.offspring);
        }
      }
    }
  }
}
```

## 참고

- [성선택 이론 (위키백과)](https://ko.wikipedia.org/wiki/성선택)
- [피셔의 폭주 선택](https://en.wikipedia.org/wiki/Fisherian_runaway)
- 다윈, "인간의 유래와 성선택" (1871)
