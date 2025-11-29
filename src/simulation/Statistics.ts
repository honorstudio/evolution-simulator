/**
 * 시뮬레이션 통계
 *
 * 매 프레임/틱마다 수집되는 게임 데이터입니다.
 * 차트나 UI에 표시되어 플레이어에게 정보를 제공합니다.
 */

export interface SimulationStats {
  // 현재 시간
  tick: number;

  // 개체 수
  organismCount: number;
  foodCount: number;

  // 평균 상태
  averageEnergy: number;
  averageAge: number;
  averageSpeed: number; // 평균 이동 속도

  // 이벤트 카운트 (틱당)
  births: number; // 출생 수
  deaths: number; // 사망 수

  // 역대 기록
  peakPopulation: number; // 최대 개체 수
  oldestEverAge: number; // 최고령 기록

  // 추가 통계
  totalBirths: number; // 누적 출생 수
  totalDeaths: number; // 누적 사망 수
}

/**
 * 통계 추적기
 *
 * 시뮬레이션 통계를 기록하고 히스토리를 관리합니다.
 */
export class StatisticsTracker {
  private history: SimulationStats[] = [];
  private currentStats: SimulationStats;

  // 히스토리 최대 크기 (메모리 관리용)
  private readonly MAX_HISTORY_SIZE = 1000;

  // 샘플링 간격 (매 N틱마다 기록)
  private readonly SAMPLE_INTERVAL = 10;
  private lastSampleTick = 0;

  constructor() {
    this.currentStats = this.createEmptyStats();
  }

  /**
   * 빈 통계 객체 생성
   */
  private createEmptyStats(): SimulationStats {
    return {
      tick: 0,
      organismCount: 0,
      foodCount: 0,
      averageEnergy: 0,
      averageAge: 0,
      averageSpeed: 0,
      births: 0,
      deaths: 0,
      peakPopulation: 0,
      oldestEverAge: 0,
      totalBirths: 0,
      totalDeaths: 0,
    };
  }

  /**
   * 통계 기록
   *
   * @param stats 현재 프레임의 통계
   */
  record(stats: SimulationStats): void {
    this.currentStats = { ...stats };

    // 역대 기록 업데이트
    if (stats.organismCount > this.currentStats.peakPopulation) {
      this.currentStats.peakPopulation = stats.organismCount;
    }

    if (stats.averageAge > this.currentStats.oldestEverAge) {
      this.currentStats.oldestEverAge = stats.averageAge;
    }

    // 샘플링 - 모든 틱을 저장하면 메모리 낭비
    if (stats.tick - this.lastSampleTick >= this.SAMPLE_INTERVAL) {
      this.addToHistory(stats);
      this.lastSampleTick = stats.tick;
    }
  }

  /**
   * 히스토리에 추가 (메모리 제한 적용)
   */
  private addToHistory(stats: SimulationStats): void {
    this.history.push({ ...stats });

    // 오래된 데이터 제거
    if (this.history.length > this.MAX_HISTORY_SIZE) {
      this.history.shift();
    }
  }

  /**
   * 전체 히스토리 반환
   */
  getHistory(): SimulationStats[] {
    return [...this.history];
  }

  /**
   * 현재 통계 반환
   */
  getCurrentStats(): SimulationStats {
    return { ...this.currentStats };
  }

  /**
   * 최근 N개의 통계 반환
   */
  getRecentHistory(count: number): SimulationStats[] {
    const start = Math.max(0, this.history.length - count);
    return this.history.slice(start);
  }

  /**
   * 특정 범위의 통계 반환 (차트용)
   */
  getHistoryRange(
    startTick: number,
    endTick: number
  ): SimulationStats[] {
    return this.history.filter(
      (stat) => stat.tick >= startTick && stat.tick <= endTick
    );
  }

  /**
   * 개체 수 추이 반환 (간단한 차트용)
   */
  getPopulationTrend(): number[] {
    return this.history.map((stat) => stat.organismCount);
  }

  /**
   * 평균 에너지 추이 반환
   */
  getEnergyTrend(): number[] {
    return this.history.map((stat) => stat.averageEnergy);
  }

  /**
   * 통계 초기화 (새 게임 시작 시)
   */
  reset(): void {
    this.history = [];
    this.currentStats = this.createEmptyStats();
    this.lastSampleTick = 0;
  }

  /**
   * 통계 요약 정보 반환 (UI 패널용)
   */
  getSummary(): {
    current: SimulationStats;
    peak: number;
    oldest: number;
    survivalRate: number;
  } {
    const survivalRate =
      this.currentStats.totalBirths > 0
        ? ((this.currentStats.totalBirths -
            this.currentStats.totalDeaths) /
            this.currentStats.totalBirths) *
          100
        : 0;

    return {
      current: this.currentStats,
      peak: this.currentStats.peakPopulation,
      oldest: this.currentStats.oldestEverAge,
      survivalRate: Math.max(0, survivalRate),
    };
  }
}
