/**
 * 저장/불러오기 시스템 사용 예제
 *
 * StorageManager를 사용하여 게임을 저장하고 불러오는 방법을 보여줍니다.
 */

import { Game } from '../Game';
import {
  StorageManager,
  serializeGame,
  deserializeGame,
  SaveData,
} from '../storage';

/**
 * 저장/불러오기 테스트
 */
export async function testStorage() {
  console.log('=== 저장/불러오기 시스템 테스트 시작 ===\n');

  // 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  document.body.appendChild(canvas);

  // 게임 생성 및 초기화
  const game = new Game(canvas);
  await game.init();

  // 저장 관리자 초기화
  const storage = new StorageManager();
  await storage.init();

  console.log('✓ 게임 및 저장 시스템 초기화 완료\n');

  // 게임 시작
  game.start();

  // 5초 후 저장 테스트
  setTimeout(async () => {
    console.log('--- 저장 테스트 ---');

    try {
      // 슬롯 1에 저장
      const saveData = serializeGame(game, 1, '테스트 저장 1');
      await storage.save(1, saveData);
      console.log('✓ 슬롯 1에 저장 완료');

      // 슬롯 목록 조회
      const slots = await storage.getSlotList();
      console.log('\n현재 저장 슬롯:');
      slots.forEach(slot => {
        if (slot.exists && slot.meta) {
          console.log(`  슬롯 ${slot.slotIndex}: ${slot.meta.name}`);
          console.log(`    저장 시간: ${new Date(slot.meta.updatedAt).toLocaleString()}`);
          console.log(`    생명체 수: ${saveData.organisms.length}`);
          console.log(`    음식 수: ${saveData.foods.length}`);
        }
      });
    } catch (error) {
      console.error('✗ 저장 실패:', error);
    }
  }, 5000);

  // 10초 후 불러오기 테스트
  setTimeout(async () => {
    console.log('\n--- 불러오기 테스트 ---');

    try {
      // 슬롯 1에서 불러오기
      const saveData = await storage.load(1);

      if (saveData) {
        console.log('✓ 슬롯 1에서 데이터 불러옴');
        console.log(`  저장 이름: ${saveData.meta.name}`);
        console.log(`  생명체 수: ${saveData.organisms.length}`);
        console.log(`  음식 수: ${saveData.foods.length}`);
        console.log(`  틱: ${saveData.simulation.tick}`);
        console.log(`  세대: ${saveData.simulation.generation}`);

        // 게임에 복원
        deserializeGame(game, saveData);
        console.log('✓ 게임 상태 복원 완료');
      } else {
        console.log('✗ 저장 데이터 없음');
      }
    } catch (error) {
      console.error('✗ 불러오기 실패:', error);
    }
  }, 10000);

  // 15초 후 자동 저장 테스트
  setTimeout(async () => {
    console.log('\n--- 자동 저장 테스트 ---');

    try {
      const saveData = serializeGame(game, 0, '[자동저장]');
      await storage.autoSave(saveData);
      console.log('✓ 자동 저장 완료 (슬롯 0)');
    } catch (error) {
      console.error('✗ 자동 저장 실패:', error);
    }
  }, 15000);

  // 20초 후 삭제 테스트
  setTimeout(async () => {
    console.log('\n--- 삭제 테스트 ---');

    try {
      await storage.delete(1);
      console.log('✓ 슬롯 1 삭제 완료');

      const slots = await storage.getSlotList();
      const slot1 = slots.find(s => s.slotIndex === 1);
      console.log(`  슬롯 1 존재 여부: ${slot1?.exists ? '있음' : '없음'}`);
    } catch (error) {
      console.error('✗ 삭제 실패:', error);
    }
  }, 20000);

  console.log('\n테스트가 진행 중입니다...');
  console.log('콘솔을 계속 확인하세요.\n');
}

/**
 * UI와 연동된 저장/불러오기 예제
 */
export async function setupStorageUI(game: Game) {
  const storage = new StorageManager();
  await storage.init();

  // 저장 버튼
  const saveBtn = document.getElementById('save-button');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const slotIndex = parseInt(prompt('슬롯 번호 (1~5):') || '1');
      const name = prompt('저장 이름:') || `저장 ${slotIndex}`;

      if (slotIndex >= 1 && slotIndex <= 5) {
        try {
          const saveData = serializeGame(game, slotIndex, name);
          await storage.save(slotIndex, saveData);
          alert('저장 완료!');
        } catch (error) {
          alert('저장 실패: ' + error);
        }
      } else {
        alert('잘못된 슬롯 번호입니다');
      }
    });
  }

  // 불러오기 버튼
  const loadBtn = document.getElementById('load-button');
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      const slotIndex = parseInt(prompt('슬롯 번호 (1~5):') || '1');

      if (slotIndex >= 1 && slotIndex <= 5) {
        try {
          const saveData = await storage.load(slotIndex);

          if (saveData) {
            game.stop();
            deserializeGame(game, saveData);
            game.start();
            alert('불러오기 완료!');
          } else {
            alert('저장 데이터가 없습니다');
          }
        } catch (error) {
          alert('불러오기 실패: ' + error);
        }
      } else {
        alert('잘못된 슬롯 번호입니다');
      }
    });
  }

  // 자동 저장 (30초마다)
  setInterval(async () => {
    try {
      const saveData = serializeGame(game, 0, '[자동저장]');
      await storage.autoSave(saveData);
      console.log('자동 저장 완료:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('자동 저장 실패:', error);
    }
  }, 30000);
}

// 브라우저 콘솔에서 직접 테스트
if (typeof window !== 'undefined') {
  (window as any).testStorage = testStorage;
  console.log('콘솔에서 testStorage()를 실행하여 테스트할 수 있습니다');
}
