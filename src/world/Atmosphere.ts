/**
 * 대기 시스템
 * 행성의 대기 구성과 환경 조건을 관리합니다
 */

/**
 * 대기 인터페이스
 * 행성 전체의 대기 정보를 나타냅니다
 */
export interface Atmosphere {
  // 산소 농도 (%)
  oxygen: number;

  // 이산화탄소 농도 (ppm - parts per million)
  carbonDioxide: number;

  // 전역 평균 온도 (섭씨)
  globalTemperature: number;

  // 질소 농도 (%)
  nitrogen: number;

  // 아르곤 등 기타 가스 (%)
  other: number;
}

/**
 * 대기 초기값
 * 현재 지구의 대기 조성과 유사하게 설정
 */
export const INITIAL_ATMOSPHERE: Atmosphere = {
  // 산소: 지구 21%
  oxygen: 21,

  // 이산화탄소: 지구 약 415ppm (2024년)
  carbonDioxide: 415,

  // 전역 평균 온도: 현재 지구 약 15°C
  globalTemperature: 15,

  // 질소: 지구 78%
  nitrogen: 78,

  // 기타 가스: 약 1%
  other: 1,
};

/**
 * 대기 관리자 클래스
 * 대기의 상태를 추적하고 업데이트합니다
 */
export class AtmosphereManager {
  private atmosphere: Atmosphere;

  constructor(initialState: Atmosphere = INITIAL_ATMOSPHERE) {
    // 깊은 복사를 통해 초기 상태 설정
    this.atmosphere = { ...initialState };
  }

  /**
   * 현재 대기 상태를 반환합니다
   * @returns 현재 대기 정보
   */
  public getAtmosphere(): Atmosphere {
    return { ...this.atmosphere };
  }

  /**
   * 산소 농도를 설정합니다
   * @param oxygen - 산소 농도 (%)
   */
  public setOxygen(oxygen: number): void {
    // 0~100% 범위로 제한
    this.atmosphere.oxygen = Math.max(0, Math.min(100, oxygen));
  }

  /**
   * 이산화탄소 농도를 설정합니다
   * @param carbonDioxide - CO2 농도 (ppm)
   */
  public setCarbonDioxide(carbonDioxide: number): void {
    // 음수 방지
    this.atmosphere.carbonDioxide = Math.max(0, carbonDioxide);
  }

  /**
   * 전역 온도를 설정합니다
   * @param globalTemperature - 전역 평균 온도 (섭씨)
   */
  public setGlobalTemperature(globalTemperature: number): void {
    this.atmosphere.globalTemperature = globalTemperature;
  }

  /**
   * 산소 농도를 증가시킵니다
   * @param amount - 증가할 양 (%)
   */
  public addOxygen(amount: number): void {
    this.setOxygen(this.atmosphere.oxygen + amount);
  }

  /**
   * 이산화탄소 농도를 증가시킵니다
   * @param amount - 증가할 양 (ppm)
   */
  public addCarbonDioxide(amount: number): void {
    this.setCarbonDioxide(this.atmosphere.carbonDioxide + amount);
  }

  /**
   * 전역 온도를 변화시킵니다
   * @param amount - 변화할 양 (섭씨)
   */
  public changeGlobalTemperature(amount: number): void {
    this.setGlobalTemperature(this.atmosphere.globalTemperature + amount);
  }

  /**
   * 대기 구성이 생명 유지에 적합한지 확인합니다
   * @returns 생명 유지 가능 여부
   */
  public isHabitable(): boolean {
    // 산소가 최소 10% 이상 필요
    if (this.atmosphere.oxygen < 10) return false;

    // 산소가 너무 많으면 위험 (50% 이상)
    if (this.atmosphere.oxygen > 50) return false;

    // 온도가 -50~50°C 범위 내여야 함
    if (
      this.atmosphere.globalTemperature < -50 ||
      this.atmosphere.globalTemperature > 50
    ) {
      return false;
    }

    return true;
  }

  /**
   * 모든 대기 값을 초기값으로 리셋합니다
   */
  public reset(): void {
    this.atmosphere = { ...INITIAL_ATMOSPHERE };
  }
}
