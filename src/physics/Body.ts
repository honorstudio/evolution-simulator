import { Vector2D } from './Vector2D';
import { PHYSICS } from './constants';

/**
 * 물리 바디 인터페이스
 *
 * 게임 내 모든 물리적 객체가 가져야 할 속성을 정의합니다.
 */
export interface PhysicsBody {
  /** 현재 위치 */
  position: Vector2D;

  /** 속도 (velocity = 방향 + 크기) */
  velocity: Vector2D;

  /** 가속도 (힘을 받으면 속도가 변함) */
  acceleration: Vector2D;

  /** 질량 (무게, 클수록 움직이기 어려움) */
  mass: number;

  /** 충돌 반경 (원 모양으로 가정) */
  radius: number;

  /** 정적 객체 여부 (true면 움직이지 않음, 예: 바위) */
  isStatic: boolean;
}

/**
 * 물리 바디 클래스
 *
 * 뉴턴의 운동 법칙을 구현합니다:
 * - F = ma (힘 = 질량 × 가속도)
 * - v = v0 + at (속도 = 초기속도 + 가속도 × 시간)
 * - s = s0 + vt (위치 = 초기위치 + 속도 × 시간)
 */
export class Body implements PhysicsBody {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  radius: number;
  isStatic: boolean;

  constructor(
    x: number = 0,
    y: number = 0,
    mass: number = 1,
    radius: number = 10,
    isStatic: boolean = false
  ) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.acceleration = new Vector2D(0, 0);
    this.mass = mass;
    this.radius = radius;
    this.isStatic = isStatic;
  }

  /**
   * 힘을 적용합니다
   *
   * 뉴턴의 제2법칙: F = ma → a = F/m
   * 질량이 클수록 같은 힘으로 덜 가속됩니다
   *
   * @param force - 적용할 힘 벡터
   */
  applyForce(force: Vector2D): void {
    // 정적 객체는 힘을 받아도 움직이지 않음
    if (this.isStatic) return;

    // 가속도 = 힘 / 질량
    const acceleration = force.divide(this.mass);
    this.acceleration = this.acceleration.add(acceleration);
  }

  /**
   * 물리 상태를 업데이트합니다
   *
   * @param delta - 경과 시간 (밀리초)
   * @param inWater - 물속에 있는지 여부
   */
  update(delta: number, inWater: boolean = true): void {
    // 정적 객체는 업데이트하지 않음
    if (this.isStatic) return;

    // 시간을 초 단위로 변환 (delta는 밀리초)
    const dt = delta / 1000;

    // 1. 속도 업데이트: v = v + a * dt
    this.velocity = this.velocity.add(this.acceleration.multiply(dt));

    // 2. 저항 적용 (물 또는 공기)
    const drag = inWater ? PHYSICS.WATER_DRAG : PHYSICS.AIR_DRAG;
    this.velocity = this.velocity.multiply(drag);

    // 3. 최대 속도 제한
    const speed = this.velocity.magnitude();
    if (speed > PHYSICS.MAX_VELOCITY) {
      this.velocity = this.velocity.normalize().multiply(PHYSICS.MAX_VELOCITY);
    }

    // 4. 위치 업데이트: p = p + v * dt
    this.position = this.position.add(this.velocity.multiply(dt * 60)); // 60fps 기준

    // 5. 가속도 초기화 (매 프레임마다 힘을 다시 계산해야 함)
    this.acceleration = new Vector2D(0, 0);
  }

  /**
   * 경계 내부로 제한합니다
   *
   * 화면 밖으로 나가지 않도록 처리
   *
   * @param width - 화면 너비
   * @param height - 화면 높이
   */
  constrainToBounds(width: number, height: number): void {
    if (this.isStatic) return;

    // 왼쪽 경계
    if (this.position.x - this.radius < 0) {
      this.position.x = this.radius;
      this.velocity.x *= -PHYSICS.BOUNCE; // 반대 방향으로 튕김
    }

    // 오른쪽 경계
    if (this.position.x + this.radius > width) {
      this.position.x = width - this.radius;
      this.velocity.x *= -PHYSICS.BOUNCE;
    }

    // 위쪽 경계
    if (this.position.y - this.radius < 0) {
      this.position.y = this.radius;
      this.velocity.y *= -PHYSICS.BOUNCE;
    }

    // 아래쪽 경계
    if (this.position.y + this.radius > height) {
      this.position.y = height - this.radius;
      this.velocity.y *= -PHYSICS.BOUNCE;
      // 바닥에 닿으면 마찰 적용
      this.velocity.x *= PHYSICS.FRICTION;
    }
  }

  /**
   * 특정 위치로 순간 이동
   */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * 속도를 직접 설정
   */
  setVelocity(vx: number, vy: number): void {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }

  /**
   * 디버깅용 문자열 출력
   */
  toString(): string {
    return `Body(pos: ${this.position.toString()}, vel: ${this.velocity.toString()}, mass: ${this.mass})`;
  }
}
