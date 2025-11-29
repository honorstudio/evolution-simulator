/**
 * 기본 시뮬레이션 예제
 * 생명체 시스템의 기본 사용법을 보여줍니다
 */

import { OrganismManager } from '../organism';

// 시뮬레이션 설정
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const INITIAL_ORGANISMS = 20;
const INITIAL_FOOD = 100;

// 매니저 생성
const manager = new OrganismManager(WORLD_WIDTH, WORLD_HEIGHT);

// 초기화
manager.spawnInitialOrganisms(INITIAL_ORGANISMS);
manager.spawnFood(INITIAL_FOOD);

// 음식 자동 생성 설정
manager.setFoodSpawnRate(2); // 초당 2개
manager.setMaxFood(150);

console.log('=== 진화 시뮬레이션 시작 ===\n');

// 시뮬레이션 루프 (예: 60 FPS)
const FPS = 60;
const DELTA = 1; // 1 틱
let ticks = 0;

const simulationLoop = setInterval(() => {
  // 업데이트
  manager.update(DELTA);
  ticks++;

  // 10초마다 통계 출력
  if (ticks % (FPS * 10) === 0) {
    const stats = manager.getStatistics();

    console.log(`\n--- ${Math.floor(ticks / FPS)}초 경과 ---`);
    console.log(`살아있는 생명체: ${stats.aliveOrganisms}`);
    console.log(`총 생성된 세대: ${stats.generation}`);
    console.log(`음식: ${stats.availableFood} / ${stats.totalFood}`);
    console.log(`평균 에너지: ${stats.averageEnergy.toFixed(1)}`);
    console.log(`평균 나이: ${stats.averageAge.toFixed(0)} 틱`);

    // 멸종 체크
    if (stats.aliveOrganisms === 0) {
      console.log('\n🔴 모든 생명체가 멸종했습니다.');
      clearInterval(simulationLoop);
    }
  }

  // 60초 후 종료
  if (ticks >= FPS * 60) {
    console.log('\n✅ 시뮬레이션 종료');

    const finalStats = manager.getStatistics();
    console.log('\n=== 최종 통계 ===');
    console.log(`생존 생명체: ${finalStats.aliveOrganisms}`);
    console.log(`총 세대 수: ${finalStats.generation}`);

    clearInterval(simulationLoop);
  }
}, 1000 / FPS);

// 프로세스 종료시 정리
process.on('SIGINT', () => {
  console.log('\n시뮬레이션 중단');
  clearInterval(simulationLoop);
  process.exit(0);
});
