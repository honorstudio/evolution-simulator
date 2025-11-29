import {
  DisasterType,
  DisasterConfig,
  DisasterEffect,
  DISASTER_CONFIGS,
  DISASTER_BASE_EFFECTS
} from './DisasterTypes';

/**
 * 활성화된 재앙 인터페이스
 * 현재 진행 중인 재앙의 상태를 추적합니다
 */
export interface ActiveDisaster {
  id: string;
  type: DisasterType;
  config: DisasterConfig;
  position?: { x: number; y: number };  // 국지적 재앙의 중심 좌표
  radius?: number;  // 영향 범위 (국지적 재앙만 해당)
  intensity: number;  // 강도 (0~1)
  duration: number;  // 총 지속시간 (밀리초)
  startTime: number;  // 시작 시각 (timestamp)
  effects: DisasterEffect[];  // 적용되는 효과 목록
  isActive: boolean;  // 활성 상태
}

/**
 * 재앙 클래스
 * 개별 재앙 인스턴스를 관리하고 효과를 계산합니다
 */
export class Disaster implements ActiveDisaster {
  public readonly id: string;
  public readonly type: DisasterType;
  public readonly config: DisasterConfig;
  public readonly position?: { x: number; y: number };
  public readonly radius?: number;
  public readonly intensity: number;
  public readonly duration: number;
  public readonly startTime: number;
  public readonly effects: DisasterEffect[];
  public isActive: boolean;

  /**
   * 재앙 생성자
   * @param type 재앙 타입
   * @param intensity 강도 (0~1, config의 min/max 범위 내에서 조정됨)
   * @param position 국지적 재앙의 중심 좌표 (선택)
   * @param radius 영향 범위 (선택, 기본값: 강도에 비례)
   */
  constructor(
    type: DisasterType,
    intensity: number,
    position?: { x: number; y: number },
    radius?: number
  ) {
    this.id = `disaster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;

    // 설정 가져오기
    const config = DISASTER_CONFIGS.get(type);
    if (!config) {
      throw new Error(`Unknown disaster type: ${type}`);
    }
    this.config = config;

    // 강도를 설정의 min/max 범위로 클램핑
    this.intensity = Math.max(
      config.minIntensity,
      Math.min(config.maxIntensity, intensity)
    );

    // 지속시간 계산 (강도에 비례하여 min~max 사이)
    this.duration = config.minDuration +
      (config.maxDuration - config.minDuration) * this.intensity;

    this.startTime = Date.now();

    // 국지적 재앙인 경우 위치와 반경 설정
    if (!config.isGlobal) {
      if (!position) {
        throw new Error(`Local disaster ${type} requires position`);
      }
      this.position = { ...position };

      // 반경이 지정되지 않았으면 강도에 비례하여 설정
      // 기본: 100~500 범위
      this.radius = radius ?? (100 + 400 * this.intensity);
    }

    // 기본 효과 가져오기 및 강도 적용
    const baseEffects = DISASTER_BASE_EFFECTS.get(type) || [];
    this.effects = baseEffects.map(effect => ({
      ...effect,
      // 효과 값을 강도에 비례하여 스케일링
      value: this.scaleEffectValue(effect, this.intensity)
    }));

    this.isActive = true;
  }

  /**
   * 효과 값을 강도에 따라 스케일링
   * @param effect 원본 효과
   * @param intensity 강도 (0~1)
   * @returns 스케일링된 효과 값
   */
  private scaleEffectValue(effect: DisasterEffect, intensity: number): number {
    if (effect.operation === 'multiply') {
      // 곱하기 연산: 1에서 멀어지는 정도를 강도로 조절
      // 예: 원본 0.5 (50% 감소), 강도 0.5 -> 0.75 (25% 감소)
      const deviation = effect.value - 1;
      return 1 + deviation * intensity;
    } else {
      // 더하기 연산: 값을 강도에 비례하여 조절
      return effect.value * intensity;
    }
  }

  /**
   * 재앙 시작 후 경과 시간 반환
   * @returns 경과 시간 (밀리초)
   */
  public getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * 재앙 종료까지 남은 시간 반환
   * @returns 남은 시간 (밀리초)
   */
  public getRemainingTime(): number {
    return Math.max(0, this.duration - this.getElapsedTime());
  }

  /**
   * 재앙 진행률 반환
   * @returns 진행률 (0~1)
   */
  public getProgress(): number {
    if (this.duration === 0) return 1;
    return Math.min(1, this.getElapsedTime() / this.duration);
  }

  /**
   * 재앙이 종료되었는지 확인
   * @returns 종료 여부
   */
  public isExpired(): boolean {
    return this.getElapsedTime() >= this.duration;
  }

  /**
   * 특정 위치에서 재앙의 효과 계산
   * 전역 재앙: 전체 효과 반환
   * 국지적 재앙: 거리에 따라 효과 감쇠
   *
   * @param x X 좌표
   * @param y Y 좌표
   * @returns 해당 위치에서의 효과 배열 (거리 감쇠 적용됨)
   */
  public getEffectAtPosition(x: number, y: number): DisasterEffect[] {
    if (!this.isActive) {
      return [];
    }

    // 전역 재앙은 위치와 관계없이 전체 효과 적용
    if (this.config.isGlobal) {
      return this.effects;
    }

    // 국지적 재앙: 거리 계산
    if (!this.position || !this.radius) {
      return [];
    }

    const dx = x - this.position.x;
    const dy = y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 반경 밖이면 효과 없음
    if (distance > this.radius) {
      return [];
    }

    // 거리에 따른 감쇠 계산 (중심에서 멀어질수록 효과 감소)
    // 감쇠 함수: 1 - (distance / radius)^2
    // 중심: 1.0, 경계: 0.0
    const falloff = 1 - Math.pow(distance / this.radius, 2);

    // 효과에 감쇠 적용
    return this.effects.map(effect => ({
      ...effect,
      value: this.applyFalloff(effect, falloff)
    }));
  }

  /**
   * 효과 값에 거리 감쇠 적용
   * @param effect 원본 효과
   * @param falloff 감쇠 계수 (0~1)
   * @returns 감쇠가 적용된 효과 값
   */
  private applyFalloff(effect: DisasterEffect, falloff: number): number {
    if (effect.operation === 'multiply') {
      // 곱하기 연산: 1에서 멀어지는 정도를 감쇠로 조절
      const deviation = effect.value - 1;
      return 1 + deviation * falloff;
    } else {
      // 더하기 연산: 값을 감쇠에 비례하여 조절
      return effect.value * falloff;
    }
  }

  /**
   * 재앙 업데이트
   * 매 프레임마다 호출되어 만료 여부 확인
   * @param _deltaTime 프레임 시간 (현재는 미사용)
   */
  public update(_deltaTime: number): void {
    if (this.isExpired()) {
      this.end();
    }
  }

  /**
   * 재앙 강제 종료
   */
  public end(): void {
    this.isActive = false;
  }

  /**
   * 재앙 정보를 문자열로 반환 (디버깅용)
   */
  public toString(): string {
    const progressPercent = (this.getProgress() * 100).toFixed(1);
    const remainingSec = (this.getRemainingTime() / 1000).toFixed(1);

    let info = `${this.config.icon} ${this.config.name} (${progressPercent}%, ${remainingSec}s)`;

    if (this.position) {
      info += ` @ (${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`;
    }

    return info;
  }
}
