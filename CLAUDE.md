# Evolution Simulator - 프로젝트 가이드


## 프로젝트 개요

이 프로젝트는 웹 브라우저 기반 **AI 생태계 진화 시뮬레이션 게임**입니다.
빈 원시 세계에서 시작하여 생명이 스스로 탄생하고 진화하는 과정을 관찰합니다.

### 핵심 특징
- 신경망 기반 AI 생명체
- 프로시저럴 외형 생성 (유전자 기반)
- 성선택을 포함한 진화 시스템
- 대륙 규모 시뮬레이션
- 사용자는 관찰 + 재앙만 가능

## 기술 스택

```
Frontend:   React 18 + TypeScript + Vite 5
상태관리:   Zustand + Immer
렌더링:     PixiJS v8 (WebGL/WebGPU)
AI:         커스텀 신경망 또는 TensorFlow.js
병렬처리:   Web Workers
저장소:     IndexedDB (Dexie.js)
테스트:     Vitest + Playwright
```

## 프로젝트 구조

```
evolution-simulator/
├── src/
│   ├── core/           # 핵심 엔진 (게임 루프, 이벤트 버스)
│   ├── systems/        # 시스템 모듈
│   │   ├── environment/  # 환경 시스템
│   │   ├── organism/     # 생명체 시스템
│   │   ├── ai/           # AI/신경망
│   │   ├── physics/      # 물리 엔진
│   │   └── disaster/     # 재앙 시스템
│   ├── world/          # 세계/청크 관리
│   ├── rendering/      # 렌더링 시스템
│   ├── ui/             # React UI
│   │   ├── components/   # 재사용 컴포넌트
│   │   └── panels/       # 패널 (관찰, 통계 등)
│   ├── storage/        # 저장/불러오기
│   ├── workers/        # Web Worker
│   ├── utils/          # 유틸리티
│   └── types/          # 타입 정의
├── docs/               # 프로젝트 문서
├── tests/              # 테스트
└── public/             # 정적 파일
```

## 개발 규칙

### TypeScript
- strict 모드 사용
- any 타입 금지
- 인터페이스 정의 필수
- Enum 대신 const 객체 + as const 선호

### React
- 함수형 컴포넌트만 사용
- Props 인터페이스 명시
- 커스텀 훅으로 로직 분리

### 성능
- 60fps 유지 목표
- 객체 풀링 필수
- 루프 내 객체 생성 금지
- Web Worker 적극 활용

### 파일 규칙
- 한 파일 300줄 이하
- 한 함수 50줄 이하
- 컴포넌트당 하나의 파일

## 서브에이전트 사용 가이드

### 사용 가능한 에이전트

| 에이전트 | 모델 | 용도 |
|---------|------|------|
| `architect` | Sonnet | 설계, 구조 검토 |
| `implementer` | Sonnet | 범용 코드 구현 |
| `simulation-engine` | Sonnet | 시뮬레이션 로직 |
| `neural-network` | Sonnet | AI/신경망/진화 |
| `renderer` | Sonnet | 그래픽/렌더링 |
| `world-generator` | Haiku | 지형/환경 생성 |
| `reviewer` | Haiku | 코드 리뷰 |
| `tester` | Haiku | 테스트 작성 |
| `debugger` | Haiku | 버그 분석 |
| `optimizer` | Sonnet | 성능 최적화 |
| `explorer` | Haiku | 코드베이스 탐색 |

### 에이전트 호출 예시
```
"simulation-engine 에이전트를 사용해서 공간 해시 그리드 구현해줘"
"reviewer 에이전트로 OrganismManager.ts 리뷰해줘"
"neural-network 에이전트를 사용해서 유전자 교배 시스템 만들어줘"
```

## 개발 페이즈

### Phase 1: 기초 시스템 ✅ 완료
- [x] 세계 생성 (지형, 물, 대기) ✅
- [x] 단세포 생물 + 기본 AI ✅
- [x] 무성 번식 + 돌연변이 ✅
- [x] 시간 조절 ✅
- [x] 기본 UI ✅
- [x] 저장/불러오기 ✅
- [x] 개체 클릭 선택 ✅

### Phase 2: 진화 시스템 ✅ 완료
- [x] 다세포 진화 ✅
- [x] 식물/동물 분화 ✅
- [x] 프로시저럴 외형 ✅
- [x] 성선택 시스템 ✅

### Phase 3: 생태계 확장 ✅ 완료
- [x] 대륙 규모 청크 시스템 ✅
- [x] 재앙 시스템 ✅
- [x] 상세 관찰 도구 ✅

### Phase 4: 완성 ✅ 완료
- [x] UI/UX 개선 ✅
- [x] 성능 최적화 ✅
- [x] 최종 테스트 ✅

## 핵심 인터페이스

### Organism (생명체)
```typescript
interface Organism {
  id: string;
  position: Vector2D;
  energy: number;
  genome: Genome;
  brain: NeuralNetwork;
  isAlive: boolean;
}
```

### Genome (유전자)
```typescript
interface Genome {
  body: BodyGenome;      // 크기, 속도, 대사율 등
  brain: BrainGenome;    // 신경망 구조
  appearance: AppearanceGenome; // 외형
  mutationRate: number;
}
```

### World (세계)
```typescript
interface World {
  chunks: Map<string, WorldChunk>;
  atmosphere: Atmosphere;
  time: TimeSystem;
}
```

## 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 테스트
npm run test

# 린트
npm run lint
```

## 참고 문서

- [Phase 1 상세](./docs/PHASE1-FOUNDATION.md)
- [Phase 2 상세](./docs/PHASE2-EVOLUTION.md)
- [Phase 3 상세](./docs/PHASE3-ECOSYSTEM.md)
- [Phase 4 상세](./docs/PHASE4-COMPLETION.md)
- [기술 스택](./docs/TECH-STACK.md)
- [시스템 설계](./docs/SYSTEM-DESIGN.md)

## 주의사항

1. **성능 우선**: 항상 대량 개체 처리를 고려
2. **모듈화**: 시스템 간 낮은 결합도 유지
3. **테스트**: 핵심 로직은 반드시 테스트
4. **문서화**: 복잡한 알고리즘은 주석 필수
5. **점진적 개발**: Phase 순서대로 진행
6. **진행 기록**: docs/PHASE1-FOUNDATION.md 하단에 개발 로그 작성

---

## 📌 현재 상태 요약

**마지막 작업**: 2025-11-29
**현재 Phase**: Phase 4 완료 ✅
**진행률**: 전체 프로젝트 완료 100%

### ✅ Phase 1 완료
- 세계 생성 시스템 (src/world/)
- 물리 엔진 (src/physics/)
- 렌더링 시스템 (src/renderer/)
- 생명체 시스템 (src/organism/)
- 시뮬레이션 엔진 (src/simulation/)
- 게임 루프 (src/Game.ts)
- UI 시스템 (src/ui/)
- 저장/불러오기 (src/storage/)
- 개체 클릭 선택 기능

### ✅ Phase 2 완료
- 다세포 생물 시스템 (src/organism/multicellular/)
  - 세포 분화 (CellDifferentiation.ts)
  - 신체 계획 (BodyPlan.ts)
  - 9가지 세포 타입 (줄기, 감각, 신경, 근육, 소화, 구조, 광합성, 생식, 저장)
- 식물/동물 분화 (src/organism/species/)
  - 식물 시스템 (Plant.ts) - 광합성, 성장
  - 동물 시스템 (Animal.ts) - 포식, 이동
  - 먹이사슬 (FoodWeb.ts)
- 프로시저럴 외형 (src/organism/appearance/)
  - 유전자 기반 외형 생성 (AppearanceGenome.ts)
  - 7가지 몸체 형태 (circle, oval, blob, star, triangle, diamond, crescent)
  - 5가지 패턴 (solid, stripes, spots, gradient, rings, patches)
  - 부속물 (spikes, tail, flagella)
- 성선택 시스템 (src/organism/reproduction/)
  - 짝 평가 (MateEvaluator.ts)
  - 구애 행동 (Courtship.ts)
  - 유성 생식 (SexualReproduction.ts)
- 확장된 AI (src/organism/ai/)
  - 고급 신경망 (AdvancedBrain.ts)
  - 기억 시스템 (MemorySystem.ts)
  - 감각 시스템 (SensorySystem.ts)
- LOD 렌더링 (src/renderer/)
  - 4단계 LOD (DOT, SIMPLE, MEDIUM, DETAILED)
  - 프로시저럴 렌더러 (ProceduralRenderer.ts)
  - 스프라이트 캐시 (OrganismSpriteCache.ts)

### ✅ Phase 3 완료
- 청크 시스템 (src/world/)
  - ChunkManager.ts - 청크 관리 (로딩/언로딩)
  - Biome.ts - 바이옴 정의
- 재앙 시스템 (src/disaster/)
  - DisasterTypes.ts - 12가지 재앙 타입 정의
  - Disaster.ts - 재앙 인스턴스
  - DisasterManager.ts - 재앙 발생/관리
  - 효과: 온도, 사망률, 음식 생성률, 돌연변이 등
- UI 재앙 패널 (src/ui/panels/)
  - DisasterPanel.tsx - 재앙 발생 UI
  - 카테고리: 지질, 기후, 생물, 우주
  - 쿨다운 표시, 활성 재앙 모니터링
- 상세 관찰 도구
  - BrainViewer.tsx - 신경망 시각화
  - 감각 입력/행동 출력 바
  - Canvas 기반 신경망 그래프
  - 이동 방향 화살표

### ✅ Phase 4 완료
- UI/UX 개선
  - 시작 화면 애니메이션 (그라데이션 텍스트, 파티클, 글로우 버튼)
  - 모바일 반응형 CSS (768px 브레이크포인트)
  - MobileControls 하단 컨트롤 바
- 성능 최적화
  - esbuild 미니파이 적용
  - 청크 분리 (vendor, pixi, state)
- 최종 테스트
  - 16개 테스트 모두 통과
  - 빌드 성공

### 📖 상세 로그
→ [docs/PHASE1-FOUNDATION.md](./docs/PHASE1-FOUNDATION.md) Phase 1 로그
→ [docs/PHASE2-EVOLUTION.md](./docs/PHASE2-EVOLUTION.md) Phase 2 로그
→ [docs/PHASE3-ECOSYSTEM.md](./docs/PHASE3-ECOSYSTEM.md) Phase 3 로그
