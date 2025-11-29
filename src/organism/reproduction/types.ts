/**
 * 성선택 시스템 타입 정의
 * 유성생식, 짝짓기 선택, 구애 행동 관련 인터페이스
 */

/**
 * 생물학적 성별
 */
export type Sex = 'male' | 'female' | 'hermaphrodite';

/**
 * 디스플레이 특징 타입
 * 구애용 시각적 특징 (공작 깃털, 사슴뿔 등)
 */
export type DisplayFeatureType =
  | 'plumage'      // 깃털
  | 'horn'         // 뿔
  | 'frill'        // 주름장식
  | 'tail'         // 꼬리
  | 'pattern';     // 무늬

/**
 * 색상 유전자
 */
export interface ColorGene {
  hue: number;        // 0-360 색조
  saturation: number; // 0-1 채도
  brightness: number; // 0-1 명도
}

/**
 * 디스플레이 특징
 * 짝짓기 시 과시하는 장식적 특징
 */
export interface DisplayFeature {
  type: DisplayFeatureType;
  size: number;           // 특징의 크기 (0-1)
  color: ColorGene;       // 색상 정보
  complexity: number;     // 복잡도 (0-1)
  energyCost: number;     // 유지 에너지 비용
}

/**
 * 매력도 유전자
 * 짝에게 보이는 외형적 특징
 */
export interface AttractivenessGenes {
  displayFeatures: DisplayFeature[];  // 디스플레이 특징들
  colorIntensity: number;             // 전체 색상 강도 (0-1)
  sizeBonus: number;                  // 크기 보너스 (0-1)
  symmetryQuality: number;            // 대칭성 품질 (0-1)
  healthIndicators: number;           // 건강 지표 (0-1)
}

/**
 * 선호도 유전자
 * 짝을 선택할 때 선호하는 특징
 */
export interface PreferenceGenes {
  preferredColorHue: number;      // 선호 색조 (0-360)
  preferredColorRange: number;    // 색조 허용 범위 (0-180)
  preferredSize: number;          // 선호 크기 (0-1)
  preferredSymmetry: number;      // 선호 대칭성 (0-1)
  preferredDisplaySize: number;   // 선호 디스플레이 크기 (0-1)
  preferredHealth: number;        // 선호 건강도 (0-1)
  selectivity: number;            // 까다로움 정도 (0-1)
}

/**
 * 구애 행동
 * 짝짓기 전 수행하는 구애 행동 패턴
 */
export interface CourtshipBehavior {
  danceComplexity: number;    // 춤 복잡도 (0-1)
  displayDuration: number;    // 과시 지속시간 (초)
  giftGiving: boolean;        // 선물 제공 여부
  territoryDisplay: boolean;  // 영역 과시 여부
  vocalComplexity: number;    // 울음소리 복잡도 (0-1)
  energyCost: number;         // 구애 에너지 비용
}

/**
 * 성적 특성을 가진 생물체
 */
export interface SexualOrganism {
  sex: Sex;                                // 성별
  attractiveness: AttractivenessGenes;     // 매력도 유전자
  preferences: PreferenceGenes;            // 선호도 유전자
  courtshipBehavior: CourtshipBehavior;    // 구애 행동
  reproductiveEnergy: number;              // 번식 에너지 (0-100)
  minReproductiveEnergy: number;           // 최소 번식 에너지
  isReproductivelyActive: boolean;         // 번식 가능 상태
  lastMatingTime: number;                  // 마지막 짝짓기 시간
  matingCooldown: number;                  // 짝짓기 쿨다운 (밀리초)
}

/**
 * 짝짓기 평가 결과
 */
export interface MateEvaluation {
  attractivenessScore: number;  // 매력도 점수 (0-1)
  fitnessScore: number;         // 적합도 점수 (0-1)
  compatibilityScore: number;   // 호환성 점수 (0-1)
  overallScore: number;         // 종합 점수 (0-1)
  visualFeatures: VisualFeatures;
  accepted: boolean;            // 수락 여부
}

/**
 * 시각적 특징 추출 결과
 */
export interface VisualFeatures {
  perceivedSize: number;        // 인지된 크기
  perceivedColor: ColorGene;    // 인지된 색상
  perceivedSymmetry: number;    // 인지된 대칭성
  perceivedHealth: number;      // 인지된 건강도
  displayQuality: number;       // 디스플레이 품질
}

/**
 * 구애 결과
 */
export interface CourtshipResult {
  success: boolean;             // 구애 성공 여부
  performanceScore: number;     // 구애 수행 점수 (0-1)
  energySpent: number;          // 소비된 에너지
  duration: number;             // 구애 지속시간 (밀리초)
  response: 'accepted' | 'rejected' | 'interrupted';
}

/**
 * 번식 결과
 */
export interface ReproductionResult {
  success: boolean;
  offspring?: SexualOrganism;   // 생성된 자식
  energyCost: number;           // 부모가 소비한 에너지
  error?: string;               // 실패 시 에러 메시지
}

/**
 * 교배 옵션
 */
export interface CrossoverOptions {
  mutationRate: number;         // 돌연변이 확률 (0-1)
  uniformCrossover: boolean;    // 균등 교배 사용 여부
  respectDominance: boolean;    // 우성 유전자 고려 여부
}
