/**
 * 구애 시스템
 * 짝짓기 전 구애 행동 수행 및 평가
 */

import type {
  SexualOrganism,
  CourtshipResult,
} from './types';
import { MateEvaluator } from './MateEvaluation';

/**
 * 구애 행동 관리자
 */
export class CourtshipManager {
  private mateEvaluator: MateEvaluator;

  constructor() {
    this.mateEvaluator = new MateEvaluator();
  }

  /**
   * 구애 과정 전체 진행
   * @param suitor - 구애하는 개체
   * @param target - 구애받는 개체
   * @returns 구애 결과
   */
  public courtship(
    suitor: SexualOrganism,
    target: SexualOrganism
  ): CourtshipResult {
    // 1. 기본 조건 확인
    if (!this.checkCourtshipConditions(suitor, target)) {
      return {
        success: false,
        performanceScore: 0,
        energySpent: 0,
        duration: 0,
        response: 'rejected',
      };
    }

    // 2. 구애 행동 수행
    const performance = this.performCourtship(suitor);

    // 3. 상대의 평가
    const evaluation = this.mateEvaluator.evaluateMate(target, suitor);

    // 4. 구애 성능과 평가 점수 결합
    const combinedScore = (performance.score + evaluation.overallScore) / 2;

    // 5. 수락 여부 결정 (평가 결과 + 구애 성능)
    const accepted = evaluation.accepted && combinedScore > 0.5;

    // 6. 에너지 소비
    const energySpent = performance.energyCost;
    suitor.reproductiveEnergy = Math.max(
      0,
      suitor.reproductiveEnergy - energySpent
    );

    return {
      success: accepted,
      performanceScore: combinedScore,
      energySpent,
      duration: performance.duration,
      response: accepted ? 'accepted' : 'rejected',
    };
  }

  /**
   * 구애 행동 수행
   * 개체의 구애 행동 패턴에 따라 수행
   * @param organism - 구애를 수행하는 개체
   * @returns 구애 수행 결과
   */
  public performCourtship(organism: SexualOrganism): {
    score: number;
    energyCost: number;
    duration: number;
  } {
    const behavior = organism.courtshipBehavior;
    let totalScore = 0;
    let componentCount = 0;

    // 1. 춤 수행
    if (behavior.danceComplexity > 0) {
      const danceScore = this.performDance(behavior.danceComplexity);
      totalScore += danceScore;
      componentCount++;
    }

    // 2. 시각적 과시
    if (behavior.displayDuration > 0) {
      const displayScore = this.performDisplay(behavior.displayDuration);
      totalScore += displayScore;
      componentCount++;
    }

    // 3. 선물 제공
    if (behavior.giftGiving) {
      const giftScore = this.performGiftGiving();
      totalScore += giftScore;
      componentCount++;
    }

    // 4. 영역 과시
    if (behavior.territoryDisplay) {
      const territoryScore = this.performTerritoryDisplay();
      totalScore += territoryScore;
      componentCount++;
    }

    // 5. 울음소리
    if (behavior.vocalComplexity > 0) {
      const vocalScore = this.performVocalization(behavior.vocalComplexity);
      totalScore += vocalScore;
      componentCount++;
    }

    // 평균 점수 계산
    const averageScore = componentCount > 0 ? totalScore / componentCount : 0;

    // 에너지 비용과 지속시간 계산
    const energyCost = behavior.energyCost;
    const duration = behavior.displayDuration * 1000; // 초 -> 밀리초

    return {
      score: averageScore,
      energyCost,
      duration,
    };
  }

  /**
   * 구애 가능 조건 확인
   */
  private checkCourtshipConditions(
    suitor: SexualOrganism,
    target: SexualOrganism
  ): boolean {
    // 1. 둘 다 번식 가능 상태인지
    if (!suitor.isReproductivelyActive || !target.isReproductivelyActive) {
      return false;
    }

    // 2. 충분한 번식 에너지가 있는지
    if (
      suitor.reproductiveEnergy < suitor.minReproductiveEnergy ||
      target.reproductiveEnergy < target.minReproductiveEnergy
    ) {
      return false;
    }

    // 3. 쿨다운 시간이 지났는지
    const now = Date.now();
    if (
      now - suitor.lastMatingTime < suitor.matingCooldown ||
      now - target.lastMatingTime < target.matingCooldown
    ) {
      return false;
    }

    // 4. 성별 확인 (자웅동체가 아닌 경우 다른 성별이어야 함)
    if (
      suitor.sex !== 'hermaphrodite' &&
      target.sex !== 'hermaphrodite' &&
      suitor.sex === target.sex
    ) {
      return false;
    }

    return true;
  }

  /**
   * 춤 수행
   * 복잡도에 따라 성공 확률 계산
   */
  private performDance(complexity: number): number {
    // 복잡한 춤일수록 실패 확률 증가
    const baseSuccess = 0.7;
    const complexityPenalty = complexity * 0.3;
    const successChance = baseSuccess - complexityPenalty;

    // 무작위 성공 여부
    const success = Math.random() < successChance;

    if (success) {
      // 성공 시 복잡도에 비례한 점수
      return 0.5 + complexity * 0.5;
    } else {
      // 실패 시 낮은 점수
      return 0.2;
    }
  }

  /**
   * 시각적 과시 수행
   * 지속시간에 따라 점수 계산
   */
  private performDisplay(duration: number): number {
    // 적정 지속시간 (3-7초)
    const optimalMin = 3;
    const optimalMax = 7;

    if (duration >= optimalMin && duration <= optimalMax) {
      return 0.9; // 최적 시간
    } else if (duration < optimalMin) {
      // 너무 짧으면 감점
      return 0.4 + (duration / optimalMin) * 0.5;
    } else {
      // 너무 길어도 감점 (지루함)
      const excess = duration - optimalMax;
      return Math.max(0.3, 0.9 - excess * 0.1);
    }
  }

  /**
   * 선물 제공
   * 무작위 성공/실패
   */
  private performGiftGiving(): number {
    // 70% 성공 확률
    const success = Math.random() < 0.7;
    return success ? 0.8 : 0.3;
  }

  /**
   * 영역 과시
   * 무작위 품질
   */
  private performTerritoryDisplay(): number {
    // 영역 품질 (0.5-1.0)
    return 0.5 + Math.random() * 0.5;
  }

  /**
   * 울음소리 수행
   * 복잡도에 따라 점수 계산
   */
  private performVocalization(complexity: number): number {
    // 복잡한 울음소리일수록 높은 점수 (하지만 실패 확률도 증가)
    const successChance = 0.8 - complexity * 0.2;
    const success = Math.random() < successChance;

    if (success) {
      return 0.6 + complexity * 0.4;
    } else {
      return 0.3;
    }
  }

  /**
   * 구애 중단 체크
   * 환경 변화, 포식자 출현 등으로 중단될 수 있음
   */
  public checkInterruption(
    suitor: SexualOrganism,
    target: SexualOrganism,
    environmentDanger: number
  ): boolean {
    // 위험도가 높으면 중단 확률 증가
    const interruptionChance = environmentDanger * 0.5;

    // 에너지가 너무 낮아도 중단
    if (
      suitor.reproductiveEnergy < 10 ||
      target.reproductiveEnergy < 10
    ) {
      return true;
    }

    return Math.random() < interruptionChance;
  }
}
