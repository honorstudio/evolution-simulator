# Evolution Simulator 개발 일지

이 문서는 프로젝트의 지속적인 업데이트 내용을 기록합니다.

---

## 2025-11-29 - 생태계 진화 시스템 Phase 1

### 목표
1. 서식지 시스템 구현 (물/육지/양서)
2. 바다에서 생명 시작 (물에서만 스폰)
3. 서식지 불일치 시 사망 로직

### 작업 내용

#### 1. Genome에 서식지 속성 추가
**파일**: `src/organism/Genome.ts`

- `HabitatType` 타입 추가: `'water' | 'land' | 'amphibious'`
- `AmphibiousTraits` 인터페이스 추가 (육지 적응 형질)
  - `desiccationResistance`: 건조 저항 (0~1)
  - `lungCapacity`: 폐 호흡 능력 (0~1)
  - `limbDevelopment`: 다리 발달 (0~1)
- `LocomotionType`에 `'floating'` 추가 (플랑크톤용)
- `createRandomGenome()`: 기본값 `habitat: 'water'`
- `mutateAmphibiousTraits()`: 육지 적응 형질 돌연변이
- `calculateLandAdaptation()`: 육지 적응도 계산

#### 2. 타일 서식지 확인 함수
**파일**: `src/world/Tile.ts`

```typescript
// 바이옴 → 서식지 매핑
getBiomeHabitat(biome): 'water' | 'land' | 'amphibious'
  - DEEP_OCEAN, OCEAN → 'water'
  - BEACH → 'amphibious'
  - 나머지 → 'land'

// 서식지 호환성 체크
isHabitatCompatible(organismHabitat, tileHabitat): boolean
```

#### 3. World에 물 타일 관련 메소드 추가
**파일**: `src/world/World.ts`

- `getTileAtPosition(x, y)`: 픽셀 좌표로 타일 반환
- `isWaterAt(x, y)`: 물 타일인지 확인
- `getRandomWaterPosition()`: 랜덤 물 타일 좌표 반환
- `getRandomWaterPositions(count)`: 여러 개 물 타일 좌표 반환

#### 4. 서식지 불일치 시 사망 로직
**파일**: `src/simulation/SimulationEngine.ts`

```typescript
checkHabitatSurvival(): void
  - 물 생물이 육지에 있으면 즉시 사망 (건조)
  - 육지 생물이 물에 있으면 즉시 사망 (익사)
  - 양서류는 물과 해변에서만 생존 가능
```

#### 5. 바다에서만 생명체 스폰
**파일**: `src/simulation/SimulationEngine.ts`, `src/organism/OrganismManager.ts`

- `spawnPrimordialLife()`: World.getRandomWaterPositions() 사용
- `spawnPrimordialOrganismsAtPositions()`: 지정된 물 타일 좌표에 스폰
- 모든 초기 생물의 `habitat: 'water'`, `locomotion: 'floating'`

#### 6. 직렬화 시스템 업데이트
**파일**: `src/storage/types.ts`, `src/storage/serialization.ts`

- `SerializedGenome`에 `habitat`, `amphibiousTraits` 추가
- 이전 버전 호환성 유지 (없으면 기본값 사용)

### 진행 상태

| 작업 | 상태 |
|------|------|
| habitat 속성 Genome에 추가 | ✅ 완료 |
| 지형 타일 서식지 확인 함수 | ✅ 완료 |
| 서식지 불일치 시 사망 로직 | ✅ 완료 |
| 초기 스폰 물 타일에서만 | ✅ 완료 |
| 빌드/테스트 | ✅ 완료 |

### 설계 문서
- [ECOSYSTEM-EVOLUTION.md](./ECOSYSTEM-EVOLUTION.md) - 생태계 진화 시스템 전체 설계

---

## 2025-11-29 - 플랑크톤 시스템 Phase 2

### 목표
1. 식물성 플랑크톤 (Phytoplankton) 시스템 구현
2. 동물성 플랑크톤 (Zooplankton) 시스템 구현
3. 먹이사슬 기반 자동 스폰 시스템

### 작업 내용

#### 1. PlanktonTraits 인터페이스 추가
**파일**: `src/organism/Genome.ts`

```typescript
interface PlanktonTraits {
  isPlankton: boolean;           // 플랑크톤 여부
  planktonType: 'phyto' | 'zoo' | 'none';  // 종류
  buoyancy: number;              // 부력 (0~1)
  oxygenProduction: number;      // 산소 생산률 (식물성)
  filterFeedingEfficiency: number; // 여과 섭식 효율 (동물성)
}
```

- DietType에 `'filter_feeder'` 추가 (동물성 플랑크톤용)
- Genome에 `planktonTraits` 속성 추가

#### 2. 플랑크톤 유전자 생성 함수
**파일**: `src/organism/Genome.ts`

- `createPhytoplanktonGenome()`: 식물성 플랑크톤 생성
  - 광합성, 높은 부력, 녹색 계열
  - 산소 생산 특화
- `createZooplanktonGenome()`: 동물성 플랑크톤 생성
  - 여과 섭식, 청록색 계열
  - 편모로 이동

#### 3. 플랑크톤 스폰 시스템
**파일**: `src/organism/OrganismManager.ts`

- `spawnPhytoplankton(positions)`: 식물성 플랑크톤 스폰
- `spawnZooplankton(positions)`: 동물성 플랑크톤 스폰
- `getPhytoplanktonCount()`: 식물성 플랑크톤 수
- `getZooplanktonCount()`: 동물성 플랑크톤 수
- OrganismStats에 플랑크톤 통계 추가

#### 4. 먹이사슬 기반 자동 스폰
**파일**: `src/simulation/SimulationEngine.ts`

```
☀️ 태양
    ↓
🌿 식물성 플랑크톤 (광합성 → 산소 생산)
    ↓
🦐 동물성 플랑크톤 (여과 섭식)
    ↓
🐟 작은 동물 (플랑크톤 포식)
    ↓
🦈 큰 동물 (작은 동물 포식)
```

- 초기 스폰: 식물성 플랑크톤만
- 식물성 5마리당 동물성 1마리 자동 스폰
- 산소 충분해지면 더 큰 동물 등장

#### 5. 광합성 시스템 개선

- 플랑크톤 산소 생산률에 따른 산소 생산량 증가
- 부력이 높을수록 햇빛 접근성 향상 → 에너지 획득 증가
- 동물성 플랑크톤: 여과 섭식으로 에너지 획득

#### 6. 직렬화 시스템 업데이트
**파일**: `src/storage/types.ts`, `src/storage/serialization.ts`

- SerializedGenome에 `planktonTraits` 추가
- 이전 버전 호환성 유지 (없으면 기본값 사용)

### 진행 상태

| 작업 | 상태 |
|------|------|
| PlanktonTraits 인터페이스 | ✅ 완료 |
| 플랑크톤 유전자 생성 함수 | ✅ 완료 |
| 플랑크톤 스폰 메서드 | ✅ 완료 |
| 먹이사슬 기반 자동 스폰 | ✅ 완료 |
| 광합성 시스템 개선 | ✅ 완료 |
| 직렬화 업데이트 | ✅ 완료 |
| 빌드/테스트 | ✅ 완료 |

---

## 2025-11-29 - 원시 지구 시스템 및 생태계 개선

### 목표
1. 클러스터 렌더링 시스템 구현 (성능 최적화)
2. 먹이사슬 시스템 개선 (현실적인 생태계)

### 작업 내용

#### 1. 클러스터 렌더링 시스템
**문제**: 개체 1,000개 이상일 때 축소 시 성능 저하
- 현재: LOD_DOT 레벨에서도 개별 점으로 모든 개체 렌더링
- 1,000개 개체 = 1,000번의 draw call

**해결책**: 공간 해시 기반 클러스터링
- 화면을 그리드로 분할 (예: 100x100 픽셀 셀)
- 각 셀의 개체 수를 계산하여 "덩어리"로 표시
- 1,000개 개체 → 50개 클러스터로 축소

**구현 파일**:
- `src/renderer/ClusterRenderer.ts` (신규)
- `src/renderer/OrganismRenderer.ts` (수정)

---

#### 2. 먹이사슬 시스템 개선
**문제**: 음식이 하늘에서 떨어지는 비현실적 시스템

**해결책**: 실제 생태계처럼 동작
```
☀️ 태양 에너지
    ↓
🦠 광합성 생물 → 스스로 에너지 생산 (음식 필요 없음)
    ↓
🔬 초식 생물 → 광합성 생물을 먹음
    ↓
🦎 육식 생물 → 초식 생물을 먹음
```

**구현 내용**:
- 음식 스폰 시스템 제거
- 광합성 생물: 태양광으로 직접 에너지 획득
- 동물: 다른 생물을 포식해야 생존
- 동물 스폰 조건: 식물 개체수가 일정 이상일 때만

**구현 파일**:
- `src/simulation/SimulationEngine.ts` (수정)
- `src/organism/OrganismManager.ts` (수정)

---

### 진행 상태

| 작업 | 상태 |
|------|------|
| 클러스터 렌더링 구현 | ✅ 완료 |
| 음식 스폰 제거 | ✅ 완료 |
| 광합성 에너지 직접 생산 | ✅ 완료 |
| 동물 포식 시스템 | ✅ 기존 구현 확인 |
| 식물 기반 동물 스폰 조건 | ✅ 완료 |
| 빌드/테스트 | ✅ 완료 |

### 상세 변경 사항

#### ClusterRenderer.ts (신규)
```typescript
// 공간 해시 기반 클러스터링
// 100x100 픽셀 그리드로 개체들을 묶어서 렌더링
// 식물 우세 = 녹색, 동물 우세 = 주황색
```

#### SimulationEngine.ts (수정)
```typescript
// spawnFood() - 비활성화 (음식 스폰 제거)
// processPhotosynthesis() - 광합성 에너지 획득 강화
// checkAndSpawnHerbivores() - 식물 10마리당 동물 1마리 비율로 자동 스폰
```

#### OrganismRenderer.ts (수정)
```typescript
// LOD_DOT 레벨에서 ClusterRenderer 사용
// renderDot() → clusterRenderer.render() 호출
```

---

### 이전 완료 작업 (같은 날)

#### 원시 지구 환경 시스템 구현
- `src/world/PrimordialEarth.ts` - AI 기반 자연 진화 시스템
- 광합성 생물이 실제로 산소 생산 → 대기 산소 축적
- 산소 농도에 따른 시대 자동 결정 (하드코딩 없음)
- 진화 조건: 산소 10%+ = 동물 가능, 산소 5%+ = 다세포 가능

#### UI 환경 정보 표시
- `src/ui/panels/StatsPanel.tsx` - 환경 정보 섹션 추가
- 현재 시대, 산소 농도 바, 온도, CO₂ 표시
- 동물/다세포 진화 가능 상태 배지

---

## 2025-11-29 - UI 확장 (좌측/하단 패널 추가)

### 목표
1. 좌측 사이드바 추가 (생태계 정보)
2. 하단 패널 추가 (진화 마일스톤)
3. 플랑크톤 통계 UI 연동

### 작업 내용

#### 1. EcosystemPanel (좌측 사이드바)
**파일**: `src/ui/panels/EcosystemPanel.tsx`

- 생태계 건강도 바
- 플랑크톤 통계 (식물성/동물성)
- 플랑크톤 비율 시각화
- 먹이사슬 다이어그램
- 서식지 정보 (물/해변/육지)
- 시간 정보 (년/일/틱/FPS)

#### 2. BottomPanel (하단 패널)
**파일**: `src/ui/panels/BottomPanel.tsx`

- 진화 진행률 바
- 8가지 진화 마일스톤:
  - 최초의 생명
  - 광합성 시작
  - 산소 축적 (1%)
  - 다세포 진화
  - 동물 등장
  - 포식자 등장
  - 산소 풍부 (10%)
  - 생태계 다양화
- 환경 미니 정보 (시대, 산소, 온도, 개체수, FPS)

#### 3. useStats 플랑크톤 통계 연동
**파일**: `src/ui/hooks/useStats.ts`

- `phytoplanktonCount` 추가
- `zooplanktonCount` 추가
- OrganismManager 통계와 연동

#### 4. 레이아웃 수정
**파일**: `src/App.tsx`, `src/styles/global.css`

- 3열 레이아웃: 좌측 사이드바 + 캔버스 + 우측 사이드바
- 하단 패널 추가
- 반응형 디자인:
  - 768px 이하: 사이드바/하단 패널 숨김
  - 1024px 이하: 좌측 사이드바 숨김
  - 1280px 이하: 좌측 사이드바 축소

### 진행 상태

| 작업 | 상태 |
|------|------|
| EcosystemPanel 컴포넌트 | ✅ 완료 |
| BottomPanel 컴포넌트 | ✅ 완료 |
| useStats 플랑크톤 통계 | ✅ 완료 |
| App.tsx 레이아웃 수정 | ✅ 완료 |
| CSS 레이아웃 수정 | ✅ 완료 |
| 빌드/테스트 | ✅ 완료 |

---

## 이전 기록

Phase 1~4 완료 내용은 각각의 문서 참조:
- [PHASE1-FOUNDATION.md](./PHASE1-FOUNDATION.md)
- [PHASE2-EVOLUTION.md](./PHASE2-EVOLUTION.md)
- [PHASE3-ECOSYSTEM.md](./PHASE3-ECOSYSTEM.md)
- [PHASE4-COMPLETION.md](./PHASE4-COMPLETION.md)
