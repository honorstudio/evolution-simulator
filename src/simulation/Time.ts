/**
 * 시간 관리자
 *
 * 게임 속도 조절, 일시정지, 틱(시간 단위) 관리를 담당합니다.
 * 1틱 = 게임 내 1시간으로 가정합니다.
 */

export class TimeManager {
  private tickCount: number = 0; // 총 경과 틱 수
  private speed: number = 1; // 게임 속도 (0.1 ~ 10)
  private isPausedState: boolean = false;
  private deltaTime: number = 0; // 마지막 프레임 시간

  // 속도 제한 상수
  private readonly MIN_SPEED = 0.1; // 최소 10% 속도
  private readonly MAX_SPEED = 10; // 최대 10배속

  // 시간 상수 (게임 내 시간 해석용)
  private readonly TICKS_PER_DAY = 24;
  private readonly TICKS_PER_YEAR = 24 * 365;

  /**
   * 게임 속도 설정
   * @param speed 0.1 ~ 10 사이의 배속 (1 = 정상 속도)
   */
  setSpeed(speed: number): void {
    // 범위 제한
    this.speed = Math.max(
      this.MIN_SPEED,
      Math.min(this.MAX_SPEED, speed)
    );
  }

  /**
   * 게임 일시정지
   */
  pause(): void {
    this.isPausedState = true;
  }

  /**
   * 게임 재개
   */
  resume(): void {
    this.isPausedState = false;
  }

  /**
   * 일시정지 토글
   */
  togglePause(): void {
    this.isPausedState = !this.isPausedState;
  }

  /**
   * 시간 업데이트
   *
   * @param rawDelta 실제 경과한 시간 (밀리초)
   * @returns 게임 속도가 적용된 조정된 delta (밀리초)
   */
  update(rawDelta: number): number {
    // 일시정지 상태면 시간이 흐르지 않음
    if (this.isPausedState) {
      return 0;
    }

    // 게임 속도 적용
    const adjustedDelta = rawDelta * this.speed;
    this.deltaTime = adjustedDelta;

    // 틱 증가 (16.67ms = 1프레임 @ 60fps)
    // 약 60프레임마다 1틱 증가
    const FRAME_TIME = 16.67;
    if (adjustedDelta >= FRAME_TIME) {
      this.tickCount += Math.floor(adjustedDelta / FRAME_TIME);
    }

    return adjustedDelta;
  }

  /**
   * 현재 틱 반환
   */
  getTick(): number {
    return this.tickCount;
  }

  /**
   * 현재 게임 속도 반환
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * 일시정지 상태 확인
   */
  isPaused(): boolean {
    return this.isPausedState;
  }

  /**
   * 마지막 프레임의 delta 시간
   */
  getDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * 시간을 읽기 쉬운 형식으로 변환
   *
   * @returns "년도 1, 일수 120, 시간 15" 형식의 문자열
   */
  formatTime(): string {
    const years = Math.floor(this.tickCount / this.TICKS_PER_YEAR);
    const remainingAfterYears = this.tickCount % this.TICKS_PER_YEAR;
    const days = Math.floor(remainingAfterYears / this.TICKS_PER_DAY);
    const hours = remainingAfterYears % this.TICKS_PER_DAY;

    return `년도 ${years}, 일수 ${days}, 시간 ${hours}`;
  }

  /**
   * 시간을 간단한 형식으로 변환 (UI용)
   */
  formatTimeShort(): string {
    const years = Math.floor(this.tickCount / this.TICKS_PER_YEAR);
    const days =
      Math.floor(this.tickCount % this.TICKS_PER_YEAR) / this.TICKS_PER_DAY;

    if (years > 0) {
      return `${years}년 ${days.toFixed(0)}일`;
    }
    return `${days.toFixed(1)}일`;
  }

  /**
   * 시간 초기화 (새 게임 시작 시 사용)
   */
  reset(): void {
    this.tickCount = 0;
    this.deltaTime = 0;
    this.isPausedState = false;
  }
}
