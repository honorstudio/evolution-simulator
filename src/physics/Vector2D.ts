/**
 * 2차원 벡터 클래스
 *
 * 게임 개발에서 위치, 속도, 가속도, 힘 등을 표현하는 기본 단위입니다.
 * 벡터는 방향과 크기를 가지고 있어서 물리 계산에 필수적입니다.
 */
export class Vector2D {
  /**
   * @param x - X 좌표 (가로)
   * @param y - Y 좌표 (세로)
   */
  constructor(public x: number = 0, public y: number = 0) {}

  /**
   * 두 벡터를 더합니다 (덧셈)
   * 예: 위치 + 속도 = 새로운 위치
   */
  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  /**
   * 두 벡터를 뺍니다 (뺄셈)
   * 예: 목표 위치 - 현재 위치 = 이동 방향
   */
  subtract(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  /**
   * 벡터에 스칼라(숫자)를 곱합니다
   * 예: 속도 * 2 = 두 배 빠른 속도
   */
  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * 벡터를 스칼라(숫자)로 나눕니다
   * 예: 속도 / 2 = 절반 느린 속도
   */
  divide(scalar: number): Vector2D {
    if (scalar === 0) {
      console.warn('0으로 나눌 수 없습니다');
      return new Vector2D(this.x, this.y);
    }
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  /**
   * 벡터의 크기(길이)를 계산합니다
   * 피타고라스 정리 사용: √(x² + y²)
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 벡터를 정규화합니다 (크기를 1로 만듦)
   * 방향은 유지하면서 크기만 1로 만들 때 사용
   * 예: 이동 방향만 알고 싶을 때
   */
  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) {
      return new Vector2D(0, 0);
    }
    return this.divide(mag);
  }

  /**
   * 내적(Dot Product)을 계산합니다
   * 두 벡터가 얼마나 같은 방향인지 알 수 있습니다
   * 결과가 양수면 같은 방향, 음수면 반대 방향
   */
  dot(v: Vector2D): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * 두 점 사이의 거리를 계산합니다
   */
  distance(v: Vector2D): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 벡터의 각도를 라디안으로 반환합니다
   * 0도 = 오른쪽, 90도 = 위쪽
   */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * 벡터를 특정 각도만큼 회전시킵니다
   * @param angle - 회전 각도 (라디안)
   */
  rotate(angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /**
   * 벡터를 복제합니다
   * 원본을 수정하지 않고 새로운 벡터를 만들 때 사용
   */
  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  /**
   * 각도에서 벡터를 생성합니다 (정적 메서드)
   * @param angle - 각도 (라디안)
   * @param magnitude - 벡터의 크기 (기본값: 1)
   */
  static fromAngle(angle: number, magnitude: number = 1): Vector2D {
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  /**
   * 무작위 방향의 단위 벡터를 생성합니다 (정적 메서드)
   * 크기가 1인 랜덤 방향 벡터
   */
  static random(): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    return Vector2D.fromAngle(angle);
  }

  /**
   * 문자열로 변환 (디버깅용)
   */
  toString(): string {
    return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
