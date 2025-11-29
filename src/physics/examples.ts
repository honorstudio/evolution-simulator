/**
 * 물리 엔진 사용 예시
 *
 * 이 파일은 물리 엔진의 기본 사용법을 보여줍니다.
 */

import { Vector2D, Body, CollisionSystem, SpatialHash, PHYSICS } from './index';

/**
 * 예시 1: 벡터 연산
 */
export function vectorExample() {
  console.log('=== 벡터 연산 예시 ===');

  // 벡터 생성
  const position = new Vector2D(100, 200);
  const velocity = new Vector2D(10, -5);

  console.log('위치:', position.toString());
  console.log('속도:', velocity.toString());

  // 새로운 위치 계산
  const newPosition = position.add(velocity);
  console.log('새 위치:', newPosition.toString());

  // 벡터 크기
  const speed = velocity.magnitude();
  console.log('속력:', speed.toFixed(2));

  // 정규화 (방향만)
  const direction = velocity.normalize();
  console.log('방향:', direction.toString());

  // 각도로부터 벡터 생성
  const upVector = Vector2D.fromAngle(-Math.PI / 2, 5); // 위쪽으로 크기 5
  console.log('위쪽 벡터:', upVector.toString());

  // 랜덤 방향
  const random = Vector2D.random();
  console.log('랜덤 방향:', random.toString());
}

/**
 * 예시 2: 물리 바디 생성 및 업데이트
 */
export function bodyExample() {
  console.log('\n=== 물리 바디 예시 ===');

  // 바디 생성 (x, y, mass, radius)
  const ball = new Body(400, 300, 1, 20);

  console.log('초기 상태:', ball.toString());

  // 힘 적용 (오른쪽으로 밀기)
  const force = new Vector2D(100, 0);
  ball.applyForce(force);

  // 시뮬레이션 (60fps 기준)
  const deltaTime = 16.67; // 밀리초
  ball.update(deltaTime, true);

  console.log('힘 적용 후:', ball.toString());

  // 경계 제한
  ball.constrainToBounds(800, 600);
  console.log('경계 적용 후:', ball.toString());
}

/**
 * 예시 3: 충돌 검사
 */
export function collisionExample() {
  console.log('\n=== 충돌 검사 예시 ===');

  // 두 개의 바디 생성
  const ball1 = new Body(100, 100, 1, 30);
  const ball2 = new Body(150, 100, 1, 30);

  // 속도 설정 (서로 마주보고 이동)
  ball1.setVelocity(5, 0);
  ball2.setVelocity(-5, 0);

  console.log('충돌 전:');
  console.log('  ball1:', ball1.toString());
  console.log('  ball2:', ball2.toString());

  // 충돌 검사
  const isColliding = CollisionSystem.circleCircle(ball1, ball2);
  console.log('충돌 여부:', isColliding);

  if (isColliding) {
    // 충돌 해결
    CollisionSystem.resolveCollision(ball1, ball2);
    console.log('충돌 해결 후:');
    console.log('  ball1:', ball1.toString());
    console.log('  ball2:', ball2.toString());
  }

  // 점-원 충돌
  const mousePosition = new Vector2D(120, 100);
  const isClicked = CollisionSystem.pointInCircle(mousePosition, ball1);
  console.log('마우스 클릭:', isClicked);
}

/**
 * 예시 4: 공간 해시 그리드
 */
export function spatialHashExample() {
  console.log('\n=== 공간 해시 예시 ===');

  // 공간 해시 생성
  const spatialHash = new SpatialHash<Body>(100); // 셀 크기 100

  // 여러 바디 생성
  const bodies: Body[] = [];
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const body = new Body(x, y, 1, 10);
    bodies.push(body);
  }

  console.log('총 바디 수:', bodies.length);

  // 격자에 삽입
  spatialHash.clear();
  for (const body of bodies) {
    spatialHash.insert(body);
  }

  // 통계 확인
  const stats = spatialHash.getStats();
  console.log('격자 통계:', stats);

  // 특정 바디 근처의 객체 찾기
  const testBody = bodies[0];
  const nearby = spatialHash.getNearby(testBody);
  console.log(`바디 0 근처의 객체 수: ${nearby.length}`);

  // 영역 검색
  const inArea = spatialHash.query(400, 300, 150);
  console.log(`중심 (400, 300) 반경 150 내 객체 수: ${inArea.length}`);
}

/**
 * 예시 5: 간단한 시뮬레이션 루프
 */
export function simulationLoopExample() {
  console.log('\n=== 시뮬레이션 루프 예시 ===');

  // 바디들 생성
  const bodies: Body[] = [
    new Body(100, 100, 1, 20),
    new Body(700, 100, 2, 30),
    new Body(400, 500, 1.5, 25),
  ];

  // 초기 속도 설정
  bodies[0].setVelocity(5, 2);
  bodies[1].setVelocity(-3, 1);
  bodies[2].setVelocity(1, -4);

  const spatialHash = new SpatialHash<Body>(100);
  const worldWidth = 800;
  const worldHeight = 600;

  console.log('시뮬레이션 시작...');

  // 10 프레임 시뮬레이션
  for (let frame = 0; frame < 10; frame++) {
    console.log(`\n프레임 ${frame + 1}:`);

    // 1. 공간 해시 초기화
    spatialHash.clear();

    // 2. 모든 바디 삽입
    for (const body of bodies) {
      spatialHash.insert(body);
    }

    // 3. 충돌 검사 및 해결
    const checkedPairs = new Set<string>();

    for (const body of bodies) {
      const nearby = spatialHash.getNearby(body);

      for (const other of nearby) {
        // 중복 검사 방지
        const pairKey =
          body < other
            ? `${bodies.indexOf(body)}-${bodies.indexOf(other)}`
            : `${bodies.indexOf(other)}-${bodies.indexOf(body)}`;

        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        // 충돌 검사
        if (CollisionSystem.circleCircle(body, other)) {
          CollisionSystem.resolveCollision(body, other);
          console.log(`  충돌: ${bodies.indexOf(body)} ↔ ${bodies.indexOf(other)}`);
        }
      }
    }

    // 4. 물리 업데이트
    for (const body of bodies) {
      // 중력 적용
      const gravity = new Vector2D(0, PHYSICS.GRAVITY);
      body.applyForce(gravity.multiply(body.mass));

      // 업데이트
      body.update(16.67, true);

      // 경계 제한
      body.constrainToBounds(worldWidth, worldHeight);
    }

    // 5. 상태 출력 (첫 번째 바디만)
    console.log(`  바디 0: pos(${body[0].position.x.toFixed(1)}, ${bodies[0].position.y.toFixed(1)})`);
  }

  console.log('\n시뮬레이션 종료');
}

/**
 * 모든 예시 실행
 */
export function runAllExamples() {
  vectorExample();
  bodyExample();
  collisionExample();
  spatialHashExample();
  simulationLoopExample();
}

// Node.js 환경에서 직접 실행 가능
if (require.main === module) {
  runAllExamples();
}
