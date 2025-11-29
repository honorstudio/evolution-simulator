/**
 * 짝짓기 평가 시스템
 * 상대 개체의 매력도와 적합도를 평가
 */

import type {
  SexualOrganism,
  MateEvaluation,
  VisualFeatures,
  PreferenceGenes,
  AttractivenessGenes,
  ColorGene,
} from './types';

/**
 * 짝의 매력도를 평가
 */
export class MateEvaluator {
  /**
   * 짝 후보를 종합 평가
   * @param evaluator - 평가하는 개체
   * @param candidate - 평가받는 짝 후보
   * @returns 평가 결과
   */
  public evaluateMate(
    evaluator: SexualOrganism,
    candidate: SexualOrganism
  ): MateEvaluation {
    // 시각적 특징 추출
    const visualFeatures = this.extractVisualFeatures(candidate);

    // 매력도 점수 계산
    const attractivenessScore = this.calculateAttractiveness(
      evaluator.preferences,
      visualFeatures
    );

    // 기본 적합도 계산 (건강, 에너지 등)
    const fitnessScore = this.calculateBasicFitness(candidate);

    // 호환성 점수 계산
    const compatibilityScore = this.calculateCompatibility(
      evaluator,
      candidate
    );

    // 종합 점수 (가중 평균)
    const overallScore =
      attractivenessScore * 0.4 +
      fitnessScore * 0.3 +
      compatibilityScore * 0.3;

    // 선택성에 따른 수락 여부 결정
    const threshold = evaluator.preferences.selectivity;
    const randomFactor = Math.random() * 0.2 - 0.1; // ±10% 무작위성
    const accepted = overallScore + randomFactor > threshold;

    return {
      attractivenessScore,
      fitnessScore,
      compatibilityScore,
      overallScore,
      visualFeatures,
      accepted,
    };
  }

  /**
   * 상대의 시각적 특징 추출
   * @param organism - 관찰 대상 개체
   * @returns 추출된 시각적 특징
   */
  public extractVisualFeatures(organism: SexualOrganism): VisualFeatures {
    const attractiveness = organism.attractiveness;

    // 크기 인지 (sizeBonus + 약간의 노이즈)
    const perceivedSize = Math.min(
      1,
      attractiveness.sizeBonus * (0.9 + Math.random() * 0.2)
    );

    // 색상 인지 (약간의 왜곡 가능)
    const perceivedColor = this.perceiveColor(attractiveness);

    // 대칭성 인지
    const perceivedSymmetry = attractiveness.symmetryQuality;

    // 건강도 인지
    const perceivedHealth = attractiveness.healthIndicators;

    // 디스플레이 품질 계산
    const displayQuality = this.calculateDisplayQuality(attractiveness);

    return {
      perceivedSize,
      perceivedColor,
      perceivedSymmetry,
      perceivedHealth,
      displayQuality,
    };
  }

  /**
   * 기본 적합도 계산
   * 건강, 에너지, 나이 등 생존 능력 평가
   * @param organism - 평가 대상 개체
   * @returns 적합도 점수 (0-1)
   */
  public calculateBasicFitness(organism: SexualOrganism): number {
    // 번식 에너지 비율
    const energyRatio = organism.reproductiveEnergy / 100;

    // 건강 지표
    const healthScore = organism.attractiveness.healthIndicators;

    // 번식 가능 상태
    const activeBonus = organism.isReproductivelyActive ? 0.2 : 0;

    // 가중 합산
    const fitness = energyRatio * 0.4 + healthScore * 0.4 + activeBonus;

    return Math.min(1, Math.max(0, fitness));
  }

  /**
   * 매력도 점수 계산
   * 평가자의 선호도와 후보의 특징을 비교
   */
  private calculateAttractiveness(
    preferences: PreferenceGenes,
    visual: VisualFeatures
  ): number {
    // 색상 선호도 매칭
    const colorScore = this.matchColorPreference(
      preferences.preferredColorHue,
      preferences.preferredColorRange,
      visual.perceivedColor
    );

    // 크기 선호도 매칭
    const sizeScore = 1 - Math.abs(preferences.preferredSize - visual.perceivedSize);

    // 대칭성 선호도 매칭
    const symmetryScore =
      1 - Math.abs(preferences.preferredSymmetry - visual.perceivedSymmetry);

    // 디스플레이 선호도 매칭
    const displayScore =
      1 - Math.abs(preferences.preferredDisplaySize - visual.displayQuality);

    // 건강 선호도 매칭
    const healthScore =
      1 - Math.abs(preferences.preferredHealth - visual.perceivedHealth);

    // 가중 평균
    return (
      colorScore * 0.25 +
      sizeScore * 0.2 +
      symmetryScore * 0.2 +
      displayScore * 0.2 +
      healthScore * 0.15
    );
  }

  /**
   * 호환성 점수 계산
   * 유전적 다양성, 에너지 균형 등
   */
  private calculateCompatibility(
    evaluator: SexualOrganism,
    candidate: SexualOrganism
  ): number {
    // 색상 다양성 (너무 비슷하면 감점)
    const colorDiversity = this.calculateColorDiversity(
      evaluator.attractiveness,
      candidate.attractiveness
    );

    // 에너지 균형 (둘 다 충분한 에너지가 있는지)
    const energyBalance = Math.min(
      evaluator.reproductiveEnergy / 100,
      candidate.reproductiveEnergy / 100
    );

    // 구애 비용 고려 (너무 비싸면 감점)
    const courtshipAffordability =
      1 - candidate.courtshipBehavior.energyCost / 50;

    return (
      colorDiversity * 0.3 +
      energyBalance * 0.5 +
      courtshipAffordability * 0.2
    );
  }

  /**
   * 색상 인지 (약간의 왜곡 추가)
   */
  private perceiveColor(attractiveness: AttractivenessGenes): ColorGene {
    // 디스플레이 특징에서 평균 색상 계산
    const features = attractiveness.displayFeatures;

    if (features.length === 0) {
      return { hue: 0, saturation: 0, brightness: 0.5 };
    }

    const avgHue =
      features.reduce((sum, f) => sum + f.color.hue, 0) / features.length;
    const avgSat =
      features.reduce((sum, f) => sum + f.color.saturation, 0) / features.length;
    const avgBright =
      features.reduce((sum, f) => sum + f.color.brightness, 0) / features.length;

    // 색상 강도 적용
    const intensity = attractiveness.colorIntensity;

    return {
      hue: avgHue,
      saturation: avgSat * intensity,
      brightness: avgBright,
    };
  }

  /**
   * 디스플레이 품질 계산
   */
  private calculateDisplayQuality(attractiveness: AttractivenessGenes): number {
    const features = attractiveness.displayFeatures;

    if (features.length === 0) return 0;

    // 평균 크기와 복잡도
    const avgSize =
      features.reduce((sum, f) => sum + f.size, 0) / features.length;
    const avgComplexity =
      features.reduce((sum, f) => sum + f.complexity, 0) / features.length;

    // 특징 개수 보너스 (최대 3개까지)
    const varietyBonus = Math.min(features.length / 3, 1) * 0.2;

    return (avgSize * 0.4 + avgComplexity * 0.4 + varietyBonus) * 1.0;
  }

  /**
   * 색상 선호도 매칭
   * 원형 색상환에서 거리 계산 (0-360도)
   */
  private matchColorPreference(
    preferredHue: number,
    range: number,
    actualColor: ColorGene
  ): number {
    // 색상환에서 최단 거리 계산
    let distance = Math.abs(preferredHue - actualColor.hue);
    if (distance > 180) {
      distance = 360 - distance;
    }

    // 허용 범위 내에 있는지 확인
    if (distance <= range) {
      // 범위 내면 높은 점수
      return 1 - distance / range * 0.5;
    } else {
      // 범위 밖이면 낮은 점수
      return Math.max(0, 1 - distance / 180);
    }
  }

  /**
   * 색상 다양성 계산
   * 유전적 다양성을 위해 너무 비슷하지 않은 것을 선호
   */
  private calculateColorDiversity(
    attractiveness1: AttractivenessGenes,
    attractiveness2: AttractivenessGenes
  ): number {
    if (
      attractiveness1.displayFeatures.length === 0 ||
      attractiveness2.displayFeatures.length === 0
    ) {
      return 0.5; // 중립
    }

    // 평균 색조 계산
    const avgHue1 =
      attractiveness1.displayFeatures.reduce((sum, f) => sum + f.color.hue, 0) /
      attractiveness1.displayFeatures.length;
    const avgHue2 =
      attractiveness2.displayFeatures.reduce((sum, f) => sum + f.color.hue, 0) /
      attractiveness2.displayFeatures.length;

    // 색조 차이
    let hueDiff = Math.abs(avgHue1 - avgHue2);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;

    // 적당한 차이 (60-120도)가 이상적
    if (hueDiff >= 60 && hueDiff <= 120) {
      return 1.0;
    } else if (hueDiff < 60) {
      return hueDiff / 60; // 너무 비슷하면 감점
    } else {
      return 1 - (hueDiff - 120) / 180; // 너무 다르면 약간 감점
    }
  }
}
