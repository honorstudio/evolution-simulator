import { Disaster } from './Disaster';
import {
  DisasterType,
  DisasterConfig,
  DisasterEffect,
  DISASTER_CONFIGS
} from './DisasterTypes';

/**
 * 재앙 관리자 클래스
 *
 * 역할:
 * - 재앙 발생 및 종료 관리
 * - 쿨다운 추적으로 과도한 재앙 방지
 * - 위치별 효과 계산 (O(n) - n은 활성 재앙 수, 보통 1~5개)
 * - 재앙 히스토리 기록
 *
 * 성능 특성:
 * - triggerDisaster: O(1)
 * - update: O(n) - n은 활성 재앙 수
 * - getEffectsAtPosition: O(n) - n은 활성 재앙 수
 * - 메모리: O(h) - h는 히스토리 크기 (제한 가능)
 */
export class DisasterManager {
  private activeDisasters: Map<string, Disaster>;
  private disasterHistory: Disaster[];
  private lastDisasterTimes: Map<DisasterType, number>;
  private maxHistorySize: number;

  // 랜덤 재앙 발생 설정
  private autoDisasterEnabled: boolean;
  private autoDisasterInterval: number;  // 평균 발생 간격 (밀리초)
  private lastAutoDisasterTime: number;

  constructor(
    maxHistorySize: number = 50,
    autoDisasterEnabled: boolean = false,
    autoDisasterInterval: number = 60000  // 기본: 1분
  ) {
    this.activeDisasters = new Map();
    this.disasterHistory = [];
    this.lastDisasterTimes = new Map();
    this.maxHistorySize = maxHistorySize;

    this.autoDisasterEnabled = autoDisasterEnabled;
    this.autoDisasterInterval = autoDisasterInterval;
    this.lastAutoDisasterTime = Date.now();
  }

  /**
   * 특정 타입의 재앙 발생
   *
   * @param type 재앙 타입
   * @param intensity 강도 (0~1, 기본: 랜덤)
   * @param position 국지적 재앙의 위치 (선택)
   * @param radius 영향 반경 (선택)
   * @returns 생성된 재앙 인스턴스 (쿨다운 중이면 null)
   */
  public triggerDisaster(
    type: DisasterType,
    intensity?: number,
    position?: { x: number; y: number },
    radius?: number
  ): Disaster | null {
    // 쿨다운 확인
    if (!this.canTrigger(type)) {
      console.warn(`Disaster ${type} is on cooldown`);
      return null;
    }

    const config = DISASTER_CONFIGS.get(type);
    if (!config) {
      console.error(`Unknown disaster type: ${type}`);
      return null;
    }

    // 강도가 지정되지 않았으면 랜덤 생성 (min~max 범위)
    const finalIntensity = intensity ??
      (config.minIntensity + Math.random() * (config.maxIntensity - config.minIntensity));

    try {
      // 재앙 생성
      const disaster = new Disaster(type, finalIntensity, position, radius);

      // 활성 재앙 목록에 추가
      this.activeDisasters.set(disaster.id, disaster);

      // 쿨다운 기록
      this.lastDisasterTimes.set(type, Date.now());

      console.log(`🌋 Disaster triggered: ${disaster.toString()}`);

      return disaster;
    } catch (error) {
      console.error(`Failed to trigger disaster ${type}:`, error);
      return null;
    }
  }

  /**
   * 랜덤 재앙 발생
   * 희귀도(rarity)에 따라 가중치 랜덤 선택
   *
   * @param worldBounds 월드 범위 (국지적 재앙 위치 결정용)
   * @returns 생성된 재앙 (발생하지 않으면 null)
   */
  public triggerRandomDisaster(worldBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }): Disaster | null {
    // 사용 가능한 재앙 목록 (쿨다운 확인)
    const availableDisasters = Array.from(DISASTER_CONFIGS.values())
      .filter(config => this.canTrigger(config.type));

    if (availableDisasters.length === 0) {
      return null;
    }

    // 희귀도 기반 가중치 랜덤 선택
    const totalWeight = availableDisasters.reduce((sum, config) => sum + config.rarity, 0);
    let random = Math.random() * totalWeight;

    let selectedConfig: DisasterConfig | null = null;

    for (const config of availableDisasters) {
      random -= config.rarity;
      if (random <= 0) {
        selectedConfig = config;
        break;
      }
    }

    if (!selectedConfig) {
      // 폴백: 마지막 재앙 선택
      const lastConfig = availableDisasters[availableDisasters.length - 1];
      if (!lastConfig) return null;
      selectedConfig = lastConfig;
    }

    // 국지적 재앙인 경우 랜덤 위치 생성
    let position: { x: number; y: number } | undefined;

    if (!selectedConfig.isGlobal) {
      if (worldBounds) {
        position = {
          x: worldBounds.minX + Math.random() * (worldBounds.maxX - worldBounds.minX),
          y: worldBounds.minY + Math.random() * (worldBounds.maxY - worldBounds.minY)
        };
      } else {
        // 기본 범위: 0~1000
        position = {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        };
      }
    }

    return this.triggerDisaster(selectedConfig.type, undefined, position);
  }

  /**
   * 매 프레임 업데이트
   * - 활성 재앙 업데이트 및 만료된 재앙 제거
   * - 자동 재앙 발생 (활성화된 경우)
   *
   * 성능: O(n) - n은 활성 재앙 수
   *
   * @param deltaTime 프레임 시간 (밀리초)
   * @param worldBounds 월드 범위 (자동 재앙용)
   */
  public update(deltaTime: number, worldBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }): void {
    // 활성 재앙 업데이트
    for (const [id, disaster] of this.activeDisasters) {
      disaster.update(deltaTime);

      // 만료된 재앙 처리
      if (!disaster.isActive) {
        console.log(`✅ Disaster ended: ${disaster.config.name}`);

        // 히스토리에 추가
        this.disasterHistory.push(disaster);

        // 히스토리 크기 제한
        if (this.disasterHistory.length > this.maxHistorySize) {
          this.disasterHistory.shift();
        }

        // 활성 목록에서 제거
        this.activeDisasters.delete(id);
      }
    }

    // 자동 재앙 발생
    if (this.autoDisasterEnabled) {
      const timeSinceLastAuto = Date.now() - this.lastAutoDisasterTime;

      // 포아송 분포 근사: 평균 간격마다 일정 확률로 발생
      // 확률 = deltaTime / interval
      const probability = deltaTime / this.autoDisasterInterval;

      if (Math.random() < probability && timeSinceLastAuto > this.autoDisasterInterval * 0.5) {
        const disaster = this.triggerRandomDisaster(worldBounds);
        if (disaster) {
          this.lastAutoDisasterTime = Date.now();
        }
      }
    }
  }

  /**
   * 특정 위치에서의 모든 재앙 효과 계산
   * 여러 재앙이 동시에 영향을 미칠 수 있음
   *
   * 성능: O(n * m) - n은 활성 재앙 수, m은 평균 효과 수 (보통 2~4개)
   * 실제로는 O(n)으로 취급 가능
   *
   * @param x X 좌표
   * @param y Y 좌표
   * @returns 해당 위치의 모든 효과 배열
   */
  public getEffectsAtPosition(x: number, y: number): DisasterEffect[] {
    const allEffects: DisasterEffect[] = [];

    for (const disaster of this.activeDisasters.values()) {
      const effects = disaster.getEffectAtPosition(x, y);
      allEffects.push(...effects);
    }

    return allEffects;
  }

  /**
   * 전역 효과만 반환
   * 위치와 무관하게 적용되는 효과
   *
   * @returns 전역 효과 배열
   */
  public getGlobalEffects(): DisasterEffect[] {
    const globalEffects: DisasterEffect[] = [];

    for (const disaster of this.activeDisasters.values()) {
      if (disaster.config.isGlobal) {
        globalEffects.push(...disaster.effects);
      }
    }

    return globalEffects;
  }

  /**
   * 효과 배열을 단일 값으로 합산
   * 같은 타입의 여러 효과를 하나로 통합
   *
   * 예: temperature +10, temperature +5 -> temperature +15
   *
   * @param effects 효과 배열
   * @returns 타입별로 합산된 효과 맵
   */
  public combineEffects(effects: DisasterEffect[]): Map<string, DisasterEffect> {
    const combined = new Map<string, DisasterEffect>();

    for (const effect of effects) {
      const existing = combined.get(effect.type);

      if (!existing) {
        combined.set(effect.type, { ...effect });
      } else {
        // 같은 operation끼리만 합산
        if (existing.operation === effect.operation) {
          if (effect.operation === 'multiply') {
            // 곱하기는 연속 적용: (1 + d1) * (1 + d2) = 1 + d1 + d2 + d1*d2
            // 근사: deviation을 더함
            const dev1 = existing.value - 1;
            const dev2 = effect.value - 1;
            existing.value = 1 + dev1 + dev2;
          } else {
            // 더하기는 단순 합산
            existing.value += effect.value;
          }
        } else {
          // operation이 다르면 나중 효과 우선
          combined.set(effect.type, { ...effect });
        }
      }
    }

    return combined;
  }

  /**
   * 활성 재앙 목록 반환
   * @returns 현재 진행 중인 재앙 배열
   */
  public getActiveDisasters(): Disaster[] {
    return Array.from(this.activeDisasters.values());
  }

  /**
   * 재앙 히스토리 반환
   * @returns 종료된 재앙 배열 (최신순)
   */
  public getDisasterHistory(): Disaster[] {
    return [...this.disasterHistory].reverse();
  }

  /**
   * 특정 타입의 재앙 발생 가능 여부 확인
   * 쿨다운 시간이 지났는지 검사
   *
   * @param type 재앙 타입
   * @returns 발생 가능 여부
   */
  public canTrigger(type: DisasterType): boolean {
    const config = DISASTER_CONFIGS.get(type);
    if (!config) return false;

    const lastTime = this.lastDisasterTimes.get(type);
    if (!lastTime) return true;

    const elapsed = Date.now() - lastTime;
    return elapsed >= config.cooldown;
  }

  /**
   * 특정 타입의 남은 쿨다운 시간 반환
   * @param type 재앙 타입
   * @returns 남은 쿨다운 (밀리초, 쿨다운 없으면 0)
   */
  public getRemainingCooldown(type: DisasterType): number {
    const config = DISASTER_CONFIGS.get(type);
    if (!config) return 0;

    const lastTime = this.lastDisasterTimes.get(type);
    if (!lastTime) return 0;

    const elapsed = Date.now() - lastTime;
    return Math.max(0, config.cooldown - elapsed);
  }

  /**
   * 자동 재앙 발생 활성화/비활성화
   * @param enabled 활성화 여부
   */
  public setAutoDisasterEnabled(enabled: boolean): void {
    this.autoDisasterEnabled = enabled;
    if (enabled) {
      this.lastAutoDisasterTime = Date.now();
    }
  }

  /**
   * 자동 재앙 발생 간격 설정
   * @param interval 평균 발생 간격 (밀리초)
   */
  public setAutoDisasterInterval(interval: number): void {
    this.autoDisasterInterval = Math.max(1000, interval);  // 최소 1초
  }

  /**
   * 모든 재앙 강제 종료
   */
  public clearAllDisasters(): void {
    for (const disaster of this.activeDisasters.values()) {
      disaster.end();
      this.disasterHistory.push(disaster);
    }

    this.activeDisasters.clear();

    // 히스토리 크기 제한
    if (this.disasterHistory.length > this.maxHistorySize) {
      this.disasterHistory = this.disasterHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 쿨다운 초기화 (테스트/디버그용)
   */
  public resetCooldowns(): void {
    this.lastDisasterTimes.clear();
  }

  /**
   * 통계 정보 반환
   */
  public getStats(): {
    activeCount: number;
    historyCount: number;
    totalTriggered: number;
    typeDistribution: Map<DisasterType, number>;
  } {
    const typeDistribution = new Map<DisasterType, number>();

    // 히스토리에서 타입별 집계
    for (const disaster of this.disasterHistory) {
      const count = typeDistribution.get(disaster.type) || 0;
      typeDistribution.set(disaster.type, count + 1);
    }

    // 활성 재앙도 포함
    for (const disaster of this.activeDisasters.values()) {
      const count = typeDistribution.get(disaster.type) || 0;
      typeDistribution.set(disaster.type, count + 1);
    }

    return {
      activeCount: this.activeDisasters.size,
      historyCount: this.disasterHistory.length,
      totalTriggered: this.disasterHistory.length + this.activeDisasters.size,
      typeDistribution
    };
  }

  /**
   * 디버그 정보 출력
   */
  public debugPrint(): void {
    console.log('=== Disaster Manager Debug ===');
    console.log(`Active Disasters: ${this.activeDisasters.size}`);

    for (const disaster of this.activeDisasters.values()) {
      console.log(`  - ${disaster.toString()}`);
    }

    const stats = this.getStats();
    console.log(`Total Triggered: ${stats.totalTriggered}`);
    console.log('Type Distribution:');

    for (const [type, count] of stats.typeDistribution) {
      console.log(`  - ${type}: ${count}`);
    }
  }
}
