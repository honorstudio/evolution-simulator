/**
 * 유성 생식 시스템
 * 부모 두 개체의 유전자 교배 및 자식 생성
 */

import type {
  SexualOrganism,
  ReproductionResult,
  CrossoverOptions,
  Sex,
  DisplayFeature,
  ColorGene,
  AttractivenessGenes,
  PreferenceGenes,
  CourtshipBehavior,
} from './types';

/**
 * 유성 생식 관리자
 */
export class SexualReproductionManager {
  /**
   * 자식 생성
   * @param parent1 - 첫 번째 부모
   * @param parent2 - 두 번째 부모
   * @param options - 교배 옵션
   * @returns 생식 결과
   */
  public createOffspring(
    parent1: SexualOrganism,
    parent2: SexualOrganism,
    options: CrossoverOptions = {
      mutationRate: 0.1,
      uniformCrossover: true,
      respectDominance: false,
    }
  ): ReproductionResult {
    // 1. 번식 가능 여부 확인
    if (
      !parent1.isReproductivelyActive ||
      !parent2.isReproductivelyActive
    ) {
      return {
        success: false,
        energyCost: 0,
        error: 'Parents not reproductively active',
      };
    }

    // 2. 에너지 비용 계산
    const energyCost = this.calculateReproductionCost(parent1, parent2);

    if (
      parent1.reproductiveEnergy < energyCost ||
      parent2.reproductiveEnergy < energyCost
    ) {
      return {
        success: false,
        energyCost: 0,
        error: 'Insufficient reproductive energy',
      };
    }

    // 3. 성별 결정
    const offspringSex = this.determineSex(parent1.sex, parent2.sex);

    // 4. 유전자 교배
    const offspringAttractiveness = this.crossoverAttractiveness(
      parent1.attractiveness,
      parent2.attractiveness,
      options
    );

    const offspringPreferences = this.crossoverPreferences(
      parent1.preferences,
      parent2.preferences,
      options
    );

    const offspringCourtship = this.crossoverCourtshipBehavior(
      parent1.courtshipBehavior,
      parent2.courtshipBehavior,
      options
    );

    // 5. 자식 개체 생성
    const offspring: SexualOrganism = {
      sex: offspringSex,
      attractiveness: offspringAttractiveness,
      preferences: offspringPreferences,
      courtshipBehavior: offspringCourtship,
      reproductiveEnergy: 50, // 초기 번식 에너지
      minReproductiveEnergy: 30,
      isReproductivelyActive: false, // 성숙하지 않음
      lastMatingTime: 0,
      matingCooldown: 60000, // 1분
    };

    // 6. 부모 에너지 소비
    parent1.reproductiveEnergy -= energyCost;
    parent2.reproductiveEnergy -= energyCost;
    parent1.lastMatingTime = Date.now();
    parent2.lastMatingTime = Date.now();

    return {
      success: true,
      offspring,
      energyCost,
    };
  }

  /**
   * 성별 결정
   * 부모의 성별에 따라 자식의 성별 결정
   */
  public determineSex(parent1Sex: Sex, parent2Sex: Sex): Sex {
    // 자웅동체끼리의 교배
    if (parent1Sex === 'hermaphrodite' && parent2Sex === 'hermaphrodite') {
      const rand = Math.random();
      if (rand < 0.7) return 'hermaphrodite';
      if (rand < 0.85) return 'male';
      return 'female';
    }

    // 한쪽이 자웅동체인 경우
    if (parent1Sex === 'hermaphrodite' || parent2Sex === 'hermaphrodite') {
      const otherSex = parent1Sex === 'hermaphrodite' ? parent2Sex : parent1Sex;
      return Math.random() < 0.5 ? otherSex : 'hermaphrodite';
    }

    // 일반적인 암수 교배 (50:50)
    return Math.random() < 0.5 ? 'male' : 'female';
  }

  /**
   * 번식 비용 계산
   */
  private calculateReproductionCost(
    parent1: SexualOrganism,
    parent2: SexualOrganism
  ): number {
    // 기본 비용
    let cost = 20;

    // 디스플레이 특징 비용
    const avgDisplayCost =
      (this.calculateDisplayCost(parent1.attractiveness) +
        this.calculateDisplayCost(parent2.attractiveness)) /
      2;

    cost += avgDisplayCost * 5;

    // 구애 복잡도 비용
    const avgCourtshipCost =
      (parent1.courtshipBehavior.energyCost +
        parent2.courtshipBehavior.energyCost) /
      2;

    cost += avgCourtshipCost * 0.5;

    return Math.min(50, cost); // 최대 50
  }

  /**
   * 디스플레이 비용 계산
   */
  private calculateDisplayCost(attractiveness: AttractivenessGenes): number {
    return attractiveness.displayFeatures.reduce(
      (sum, feature) => sum + feature.energyCost,
      0
    );
  }

  /**
   * 매력도 유전자 교배
   */
  private crossoverAttractiveness(
    parent1: AttractivenessGenes,
    parent2: AttractivenessGenes,
    options: CrossoverOptions
  ): AttractivenessGenes {
    const offspring: AttractivenessGenes = {
      displayFeatures: this.crossoverDisplayFeatures(
        parent1.displayFeatures,
        parent2.displayFeatures,
        options
      ),
      colorIntensity: this.crossoverValue(
        parent1.colorIntensity,
        parent2.colorIntensity,
        options
      ),
      sizeBonus: this.crossoverValue(
        parent1.sizeBonus,
        parent2.sizeBonus,
        options
      ),
      symmetryQuality: this.crossoverValue(
        parent1.symmetryQuality,
        parent2.symmetryQuality,
        options
      ),
      healthIndicators: this.crossoverValue(
        parent1.healthIndicators,
        parent2.healthIndicators,
        options
      ),
    };

    return offspring;
  }

  /**
   * 선호도 유전자 교배
   */
  private crossoverPreferences(
    parent1: PreferenceGenes,
    parent2: PreferenceGenes,
    options: CrossoverOptions
  ): PreferenceGenes {
    return {
      preferredColorHue: this.crossoverValue(
        parent1.preferredColorHue,
        parent2.preferredColorHue,
        options,
        0,
        360
      ),
      preferredColorRange: this.crossoverValue(
        parent1.preferredColorRange,
        parent2.preferredColorRange,
        options
      ),
      preferredSize: this.crossoverValue(
        parent1.preferredSize,
        parent2.preferredSize,
        options
      ),
      preferredSymmetry: this.crossoverValue(
        parent1.preferredSymmetry,
        parent2.preferredSymmetry,
        options
      ),
      preferredDisplaySize: this.crossoverValue(
        parent1.preferredDisplaySize,
        parent2.preferredDisplaySize,
        options
      ),
      preferredHealth: this.crossoverValue(
        parent1.preferredHealth,
        parent2.preferredHealth,
        options
      ),
      selectivity: this.crossoverValue(
        parent1.selectivity,
        parent2.selectivity,
        options
      ),
    };
  }

  /**
   * 구애 행동 교배
   */
  private crossoverCourtshipBehavior(
    parent1: CourtshipBehavior,
    parent2: CourtshipBehavior,
    options: CrossoverOptions
  ): CourtshipBehavior {
    return {
      danceComplexity: this.crossoverValue(
        parent1.danceComplexity,
        parent2.danceComplexity,
        options
      ),
      displayDuration: this.crossoverValue(
        parent1.displayDuration,
        parent2.displayDuration,
        options,
        0,
        10
      ),
      giftGiving: Math.random() < 0.5 ? parent1.giftGiving : parent2.giftGiving,
      territoryDisplay:
        Math.random() < 0.5 ? parent1.territoryDisplay : parent2.territoryDisplay,
      vocalComplexity: this.crossoverValue(
        parent1.vocalComplexity,
        parent2.vocalComplexity,
        options
      ),
      energyCost: this.crossoverValue(
        parent1.energyCost,
        parent2.energyCost,
        options,
        5,
        50
      ),
    };
  }

  /**
   * 디스플레이 특징 교배
   */
  private crossoverDisplayFeatures(
    parent1Features: DisplayFeature[],
    parent2Features: DisplayFeature[],
    options: CrossoverOptions
  ): DisplayFeature[] {
    const offspring: DisplayFeature[] = [];

    // 최대 특징 개수 (부모 중 더 많은 쪽 기준)
    const maxFeatures = Math.max(parent1Features.length, parent2Features.length);

    for (let i = 0; i < maxFeatures; i++) {
      const feature1 = parent1Features[i];
      const feature2 = parent2Features[i];

      // 둘 다 있으면 교배
      if (feature1 && feature2) {
        offspring.push(this.crossoverSingleFeature(feature1, feature2, options));
      }
      // 한쪽만 있으면 50% 확률로 상속
      else if (feature1) {
        if (Math.random() < 0.5) {
          offspring.push(this.mutateFeature(feature1, options.mutationRate));
        }
      } else if (feature2) {
        if (Math.random() < 0.5) {
          offspring.push(this.mutateFeature(feature2, options.mutationRate));
        }
      }
    }

    // 새로운 특징 돌연변이 (5% 확률)
    if (Math.random() < 0.05 * options.mutationRate) {
      offspring.push(this.generateRandomFeature());
    }

    return offspring;
  }

  /**
   * 단일 디스플레이 특징 교배
   */
  private crossoverSingleFeature(
    feature1: DisplayFeature,
    feature2: DisplayFeature,
    options: CrossoverOptions
  ): DisplayFeature {
    return {
      type: Math.random() < 0.5 ? feature1.type : feature2.type,
      size: this.crossoverValue(feature1.size, feature2.size, options),
      color: this.crossoverColor(feature1.color, feature2.color, options),
      complexity: this.crossoverValue(
        feature1.complexity,
        feature2.complexity,
        options
      ),
      energyCost: this.crossoverValue(
        feature1.energyCost,
        feature2.energyCost,
        options,
        1,
        10
      ),
    };
  }

  /**
   * 색상 교배
   */
  private crossoverColor(
    color1: ColorGene,
    color2: ColorGene,
    options: CrossoverOptions
  ): ColorGene {
    return {
      hue: this.crossoverValue(color1.hue, color2.hue, options, 0, 360),
      saturation: this.crossoverValue(
        color1.saturation,
        color2.saturation,
        options
      ),
      brightness: this.crossoverValue(
        color1.brightness,
        color2.brightness,
        options
      ),
    };
  }

  /**
   * 수치 값 교배 (핵심 함수)
   * @param value1 - 부모1의 값
   * @param value2 - 부모2의 값
   * @param options - 교배 옵션
   * @param min - 최소값
   * @param max - 최대값
   */
  private crossoverValue(
    value1: number,
    value2: number,
    options: CrossoverOptions,
    min = 0,
    max = 1
  ): number {
    let result: number;

    if (options.uniformCrossover) {
      // 균등 교배: 50% 확률로 선택
      result = Math.random() < 0.5 ? value1 : value2;
    } else {
      // 중간값 교배
      result = (value1 + value2) / 2;
    }

    // 돌연변이 적용
    if (Math.random() < options.mutationRate) {
      const mutationStrength = (max - min) * 0.1; // ±10%
      const mutation = (Math.random() - 0.5) * mutationStrength;
      result += mutation;
    }

    // 범위 제한
    return Math.max(min, Math.min(max, result));
  }

  /**
   * 특징 돌연변이
   */
  private mutateFeature(
    feature: DisplayFeature,
    mutationRate: number
  ): DisplayFeature {
    const mutated = { ...feature };

    if (Math.random() < mutationRate) {
      mutated.size = Math.max(0, Math.min(1, mutated.size + (Math.random() - 0.5) * 0.2));
    }

    if (Math.random() < mutationRate) {
      mutated.complexity = Math.max(
        0,
        Math.min(1, mutated.complexity + (Math.random() - 0.5) * 0.2)
      );
    }

    if (Math.random() < mutationRate) {
      mutated.color.hue = (mutated.color.hue + (Math.random() - 0.5) * 60 + 360) % 360;
    }

    return mutated;
  }

  /**
   * 무작위 특징 생성
   */
  private generateRandomFeature(): DisplayFeature {
    const types: DisplayFeature['type'][] = [
      'plumage',
      'horn',
      'frill',
      'tail',
      'pattern',
    ];

    return {
      type: types[Math.floor(Math.random() * types.length)] ?? 'tail',
      size: Math.random(),
      color: {
        hue: Math.random() * 360,
        saturation: 0.5 + Math.random() * 0.5,
        brightness: 0.5 + Math.random() * 0.5,
      },
      complexity: Math.random(),
      energyCost: 1 + Math.random() * 4,
    };
  }
}
