# 물리 엔진

Evolution Simulator의 핵심 물리 시뮬레이션 엔진입니다.

## 구조

```
physics/
├── Vector2D.ts        # 2D 벡터 수학
├── Body.ts            # 물리 바디 (위치, 속도, 가속도)
├── Collision.ts       # 충돌 검사 및 해결
├── SpatialHash.ts     # 공간 해시 그리드 (성능 최적화)
├── constants.ts       # 물리 상수
├── index.ts           # 배럴 export
├── examples.ts        # 사용 예시
└── README.md          # 이 문서
```

## 주요 개념

### 1. 벡터 (Vector2D)

방향과 크기를 가진 수학적 개체입니다.

```typescript
import { Vector2D } from './physics';

// 생성
const position = new Vector2D(100, 200);
const velocity = new Vector2D(5, -3);

// 연산
const newPos = position.add(velocity);      // 덧셈
const difference = position.subtract(velocity);  // 뺄셈
const doubled = velocity.multiply(2);       // 스칼라 곱
const half = velocity.divide(2);            // 스칼라 나눗셈

// 속성
const length = velocity.magnitude();        // 크기
const direction = velocity.normalize();     // 방향 (단위 벡터)
const angle = velocity.angle();             // 각도 (라디안)

// 유틸리티
const random = Vector2D.random();           // 랜덤 방향
const up = Vector2D.fromAngle(-Math.PI/2);  // 각도에서 생성
```

### 2. 물리 바디 (Body)

게임 내 모든 움직이는 객체의 기본 클래스입니다.

```typescript
import { Body, Vector2D } from './physics';

// 생성 (x, y, mass, radius, isStatic)
const organism = new Body(400, 300, 1, 20, false);

// 힘 적용 (뉴턴의 제2법칙: F = ma)
const thrust = new Vector2D(10, 0);
organism.applyForce(thrust);

// 업데이트 (매 프레임)
const deltaTime = 16.67; // 60fps
organism.update(deltaTime, true); // true = 물속

// 경계 제한
organism.constrainToBounds(800, 600);

// 속성 접근
console.log(organism.position);    // Vector2D
console.log(organism.velocity);    // Vector2D
console.log(organism.mass);        // number
```

### 3. 충돌 시스템 (CollisionSystem)

물체 간의 충돌을 감지하고 해결합니다.

```typescript
import { CollisionSystem, Body } from './physics';

const ball1 = new Body(100, 100, 1, 30);
const ball2 = new Body(150, 100, 1, 30);

// 충돌 검사
if (CollisionSystem.circleCircle(ball1, ball2)) {
  // 충돌 해결 (밀어내기 + 속도 조정)
  CollisionSystem.resolveCollision(ball1, ball2);
}

// 점-원 충돌 (마우스 클릭 등)
const mousePos = new Vector2D(120, 100);
if (CollisionSystem.pointInCircle(mousePos, ball1)) {
  console.log('클릭됨!');
}

// 광선 충돌 (시야 검사)
const origin = new Vector2D(0, 0);
const direction = new Vector2D(1, 0).normalize();
const distance = CollisionSystem.raycastCircle(origin, direction, ball1);
if (distance !== null) {
  console.log(`거리: ${distance}`);
}
```

### 4. 공간 해시 그리드 (SpatialHash)

**성능 최적화의 핵심!**

N개의 객체를 모두 비교하면 N²/2 번의 검사가 필요합니다.
- 100개: 4,950번
- 1,000개: 499,500번
- 10,000개: 49,995,000번 ⚠️

공간 해시를 사용하면 근처 객체만 검사하여 **O(n)**으로 줄어듭니다!

```typescript
import { SpatialHash, Body } from './physics';

// 생성 (셀 크기 100픽셀)
const spatialHash = new SpatialHash<Body>(100);

// 매 프레임마다
function update(bodies: Body[]) {
  // 1. 초기화
  spatialHash.clear();

  // 2. 모든 바디 삽입
  for (const body of bodies) {
    spatialHash.insert(body);
  }

  // 3. 충돌 검사 (근처 객체만!)
  for (const body of bodies) {
    const nearby = spatialHash.getNearby(body);

    for (const other of nearby) {
      // 충돌 검사...
    }
  }
}

// 영역 검색 (폭발, 센서 등)
const inRange = spatialHash.query(400, 300, 150); // 중심, 반경
console.log(`범위 내 객체: ${inRange.length}개`);

// 통계 (디버깅)
const stats = spatialHash.getStats();
console.log(stats); // { totalCells, totalObjects, avgObjectsPerCell }
```

## 성능 특성

| 기능 | 시간 복잡도 | 설명 |
|-----|-----------|------|
| Vector2D 연산 | O(1) | 모든 벡터 연산은 상수 시간 |
| Body 업데이트 | O(1) | 단일 바디 업데이트 |
| 충돌 검사 (원시) | O(n²) | 모든 쌍 비교 |
| SpatialHash 삽입 | O(1) | 평균적으로 상수 시간 |
| SpatialHash 조회 | O(k) | k = 근처 객체 수 (보통 10 미만) |
| 충돌 검사 (최적화) | O(n) | 공간 해시 사용 시 |

## 사용 예시

### 기본 시뮬레이션 루프

```typescript
import { Body, CollisionSystem, SpatialHash, PHYSICS, Vector2D } from './physics';

class PhysicsWorld {
  private bodies: Body[] = [];
  private spatialHash = new SpatialHash<Body>(100);

  constructor(
    private width: number,
    private height: number
  ) {}

  addBody(body: Body): void {
    this.bodies.push(body);
  }

  update(deltaTime: number): void {
    // 1. 공간 해시 초기화
    this.spatialHash.clear();
    for (const body of this.bodies) {
      this.spatialHash.insert(body);
    }

    // 2. 충돌 검사 및 해결
    const checked = new Set<string>();

    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      const nearby = this.spatialHash.getNearby(body);

      for (const other of nearby) {
        const j = this.bodies.indexOf(other);
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;

        if (checked.has(key)) continue;
        checked.add(key);

        if (CollisionSystem.circleCircle(body, other)) {
          CollisionSystem.resolveCollision(body, other);
        }
      }
    }

    // 3. 물리 업데이트
    for (const body of this.bodies) {
      // 중력 적용
      const gravity = new Vector2D(0, PHYSICS.GRAVITY * body.mass);
      body.applyForce(gravity);

      // 업데이트
      body.update(deltaTime, true);

      // 경계 제한
      body.constrainToBounds(this.width, this.height);
    }
  }
}

// 사용
const world = new PhysicsWorld(800, 600);

for (let i = 0; i < 100; i++) {
  const x = Math.random() * 800;
  const y = Math.random() * 600;
  const body = new Body(x, y, 1, 10);
  world.addBody(body);
}

// 게임 루프
function gameLoop() {
  world.update(16.67); // 60fps
  requestAnimationFrame(gameLoop);
}

gameLoop();
```

### 생물체에 힘 적용

```typescript
class Organism extends Body {
  moveToward(target: Vector2D, strength: number): void {
    // 목표까지의 방향 계산
    const desired = target.subtract(this.position);
    const direction = desired.normalize();

    // 힘 적용
    const force = direction.multiply(strength);
    this.applyForce(force);
  }

  flee(threat: Vector2D, strength: number): void {
    // 반대 방향으로 도망
    const desired = this.position.subtract(threat);
    const direction = desired.normalize();

    const force = direction.multiply(strength);
    this.applyForce(force);
  }
}
```

## 물리 상수 조정

`constants.ts`의 값을 변경하여 시뮬레이션의 느낌을 조정할 수 있습니다:

```typescript
export const PHYSICS = {
  GRAVITY: 0.1,          // ↑ 증가: 빨리 떨어짐
  WATER_DRAG: 0.98,      // ↓ 감소: 빨리 멈춤
  AIR_DRAG: 0.99,        // ↓ 감소: 공기 저항 증가
  FRICTION: 0.95,        // ↓ 감소: 바닥에서 빨리 멈춤
  MAX_VELOCITY: 10,      // ↑ 증가: 더 빠르게 움직임
  BOUNCE: 0.5,           // ↑ 증가: 더 많이 튕김
};
```

## 디버깅 팁

1. **벡터 시각화**: 화살표로 그리기
2. **충돌 영역 표시**: 원을 빨간색으로
3. **공간 해시 그리드 표시**: `getDebugData()` 사용
4. **속도 벡터 표시**: 이동 방향 확인

```typescript
// 디버그 렌더링 예시
function debugRender(ctx: CanvasRenderingContext2D, body: Body) {
  // 바디
  ctx.beginPath();
  ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
  ctx.stroke();

  // 속도 벡터
  const endPos = body.position.add(body.velocity.multiply(5));
  ctx.beginPath();
  ctx.moveTo(body.position.x, body.position.y);
  ctx.lineTo(endPos.x, endPos.y);
  ctx.strokeStyle = 'red';
  ctx.stroke();
}
```

## 다음 단계

1. **유전자 시스템 연동**: 물리 속성을 유전자로 제어
2. **센서 추가**: Raycast 기반 시야 구현
3. **환경 영향**: 물 흐름, 온도 등
4. **에너지 시스템**: 이동에 따른 에너지 소비

## 참고 자료

- [Game Physics 101](https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics)
- [Spatial Hashing](https://www.gamedev.net/articles/programming/general-and-gameplay-programming/spatial-hashing-r2697/)
- [The Nature of Code](https://natureofcode.com/) - 물리 시뮬레이션 바이블
