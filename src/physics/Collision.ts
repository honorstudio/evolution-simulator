import { Vector2D } from './Vector2D';
import { PhysicsBody } from './Body';
import { PHYSICS } from './constants';

/**
 * 충돌 시스템
 *
 * 물체 간의 충돌을 감지하고 해결합니다.
 * 모든 메서드는 static으로 제공되어 인스턴스 생성 없이 사용 가능합니다.
 */
export class CollisionSystem {
  /**
   * 원-원 충돌 검사
   *
   * 두 원의 중심 사이의 거리가 반지름의 합보다 작으면 충돌
   *
   * @param a - 첫 번째 물리 바디
   * @param b - 두 번째 물리 바디
   * @returns 충돌 여부
   */
  static circleCircle(a: PhysicsBody, b: PhysicsBody): boolean {
    // 두 중심점 사이의 거리 계산
    const distance = a.position.distance(b.position);

    // 두 반지름의 합
    const minDistance = a.radius + b.radius;

    // 거리가 반지름의 합보다 작으면 충돌
    return distance < minDistance;
  }

  /**
   * 충돌 해결 (밀어내기 + 속도 조정)
   *
   * 1. 물체들을 겹치지 않게 밀어냅니다
   * 2. 속도를 조정하여 탄성 충돌을 시뮬레이션합니다
   *
   * @param a - 첫 번째 물리 바디
   * @param b - 두 번째 물리 바디
   */
  static resolveCollision(a: PhysicsBody, b: PhysicsBody): void {
    // 정적 객체끼리는 충돌 해결 불필요
    if (a.isStatic && b.isStatic) return;

    // === 1단계: 위치 보정 (겹침 해소) ===

    // 충돌 방향 벡터 (a에서 b로 향하는 방향)
    const collisionNormal = b.position.subtract(a.position);
    const distance = collisionNormal.magnitude();

    // 거리가 0이면 같은 위치 (처리 불가)
    if (distance === 0) return;

    // 정규화된 충돌 방향
    const normal = collisionNormal.normalize();

    // 겹침 깊이
    const overlap = (a.radius + b.radius) - distance;

    // 겹침이 없으면 종료
    if (overlap <= 0) return;

    // 질량 비율 계산 (무거운 물체는 덜 밀림)
    const totalMass = a.mass + b.mass;
    const aRatio = a.isStatic ? 0 : b.mass / totalMass;
    const bRatio = b.isStatic ? 0 : a.mass / totalMass;

    // 겹침 해소 (무거운 물체는 덜 밀리고, 가벼운 물체는 많이 밀림)
    if (!a.isStatic) {
      const separation = normal.multiply(-overlap * aRatio);
      a.position = a.position.add(separation);
    }

    if (!b.isStatic) {
      const separation = normal.multiply(overlap * bRatio);
      b.position = b.position.add(separation);
    }

    // === 2단계: 속도 조정 (탄성 충돌) ===

    // 상대 속도
    const relativeVelocity = b.velocity.subtract(a.velocity);

    // 상대 속도의 충돌 방향 성분
    const velocityAlongNormal = relativeVelocity.dot(normal);

    // 이미 서로 멀어지고 있으면 속도 조정 불필요
    if (velocityAlongNormal > 0) return;

    // 반발 계수 적용
    const restitution = PHYSICS.BOUNCE;

    // 충격량 계산
    // j = -(1 + e) * vₙ / (1/mₐ + 1/mᵦ)
    let impulseScalar = -(1 + restitution) * velocityAlongNormal;

    if (a.isStatic) {
      impulseScalar /= 1 / b.mass;
    } else if (b.isStatic) {
      impulseScalar /= 1 / a.mass;
    } else {
      impulseScalar /= 1 / a.mass + 1 / b.mass;
    }

    // 충격량 벡터
    const impulse = normal.multiply(impulseScalar);

    // 속도 조정 (충격량 적용)
    if (!a.isStatic) {
      a.velocity = a.velocity.subtract(impulse.divide(a.mass));
    }

    if (!b.isStatic) {
      b.velocity = b.velocity.add(impulse.divide(b.mass));
    }
  }

  /**
   * 점이 원 안에 있는지 검사
   *
   * 마우스 클릭 등의 UI 상호작용에 사용
   *
   * @param point - 검사할 점
   * @param circle - 원 형태의 물리 바디
   * @returns 점이 원 안에 있는지 여부
   */
  static pointInCircle(point: Vector2D, circle: PhysicsBody): boolean {
    const distance = point.distance(circle.position);
    return distance <= circle.radius;
  }

  /**
   * 광선-원 교차 검사 (Raycast)
   *
   * 시야(line of sight) 검사나 발사체 충돌 검사에 사용
   *
   * @param origin - 광선 시작점
   * @param direction - 광선 방향 (정규화된 벡터)
   * @param circle - 원 형태의 물리 바디
   * @param maxDistance - 최대 검사 거리
   * @returns 교차하는 경우 거리 반환, 아니면 null
   */
  static raycastCircle(
    origin: Vector2D,
    direction: Vector2D,
    circle: PhysicsBody,
    maxDistance: number = Infinity
  ): number | null {
    // 원의 중심으로 향하는 벡터
    const toCircle = circle.position.subtract(origin);

    // 광선 방향에 대한 투영 길이
    const projection = toCircle.dot(direction);

    // 원이 광선의 뒤쪽에 있으면 교차하지 않음
    if (projection < 0) return null;

    // 최대 거리를 벗어나면 교차하지 않음
    if (projection > maxDistance) return null;

    // 원의 중심에서 광선까지의 최단 거리
    const closestPoint = origin.add(direction.multiply(projection));
    const distanceToRay = circle.position.distance(closestPoint);

    // 최단 거리가 반지름보다 크면 교차하지 않음
    if (distanceToRay > circle.radius) return null;

    // 교차점까지의 거리 계산
    const offset = Math.sqrt(circle.radius * circle.radius - distanceToRay * distanceToRay);
    const intersectionDistance = projection - offset;

    return intersectionDistance >= 0 ? intersectionDistance : null;
  }

  /**
   * AABB (Axis-Aligned Bounding Box) 충돌 검사
   *
   * 사각형 영역 충돌 검사 (최적화용)
   *
   * @param a - 첫 번째 물리 바디
   * @param b - 두 번째 물리 바디
   * @returns 충돌 여부
   */
  static aabbCheck(a: PhysicsBody, b: PhysicsBody): boolean {
    return (
      Math.abs(a.position.x - b.position.x) < a.radius + b.radius &&
      Math.abs(a.position.y - b.position.y) < a.radius + b.radius
    );
  }
}
