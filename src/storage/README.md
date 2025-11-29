# 저장/불러오기 시스템

IndexedDB 기반 게임 저장/불러오기 시스템입니다.

## 특징

- **IndexedDB 사용**: 브라우저 로컬 스토리지에 대용량 데이터 저장
- **5개 저장 슬롯**: 슬롯 0 (자동저장) + 슬롯 1~5 (수동 저장)
- **완전한 게임 상태 저장**: 모든 생명체, 음식, 통계 데이터
- **버전 관리**: 호환성 체크 및 마이그레이션 지원

## 사용 방법

### 1. 초기화

```typescript
import { StorageManager } from './storage';

const storage = new StorageManager();
await storage.init();
```

### 2. 게임 저장

```typescript
import { serializeGame, StorageManager } from './storage';

const storage = new StorageManager();
await storage.init();

// 게임 상태 직렬화
const saveData = serializeGame(game, 1, '세대 100 도달');

// 슬롯 1에 저장
await storage.save(1, saveData);
```

### 3. 게임 불러오기

```typescript
import { deserializeGame, StorageManager } from './storage';

const storage = new StorageManager();
await storage.init();

// 슬롯 1에서 불러오기
const saveData = await storage.load(1);

if (saveData) {
  // 게임에 적용
  deserializeGame(game, saveData);
}
```

### 4. 자동 저장

```typescript
// 자동 저장 (슬롯 0)
const saveData = serializeGame(game, 0, '[자동저장]');
await storage.autoSave(saveData);
```

### 5. 저장 슬롯 목록 조회

```typescript
const slots = await storage.getSlotList();

slots.forEach(slot => {
  if (slot.exists && slot.meta) {
    console.log(`슬롯 ${slot.slotIndex}:`, slot.meta.name);
    console.log('  저장 시간:', new Date(slot.meta.updatedAt));
    console.log('  플레이 시간:', slot.meta.playTime);
  }
});
```

### 6. 저장 데이터 삭제

```typescript
// 슬롯 3 삭제
await storage.delete(3);

// 모든 저장 데이터 삭제
await storage.clearAll();
```

## 전체 예제

```typescript
import { Game } from './Game';
import {
  StorageManager,
  serializeGame,
  deserializeGame,
} from './storage';

// 게임 및 저장 관리자 생성
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const game = new Game(canvas);
const storage = new StorageManager();

async function setupGame() {
  // 게임 초기화
  await game.init();

  // 저장 시스템 초기화
  await storage.init();

  // 게임 시작
  game.start();

  // 자동 저장 (10초마다)
  setInterval(async () => {
    const saveData = serializeGame(game, 0, '[자동저장]');
    await storage.autoSave(saveData);
    console.log('자동 저장 완료');
  }, 10000);
}

// 수동 저장 함수
async function saveGame(slotIndex: number, name: string) {
  try {
    const saveData = serializeGame(game, slotIndex, name);
    await storage.save(slotIndex, saveData);
    alert(`슬롯 ${slotIndex}에 저장되었습니다`);
  } catch (error) {
    console.error('저장 실패:', error);
    alert('저장에 실패했습니다');
  }
}

// 불러오기 함수
async function loadGame(slotIndex: number) {
  try {
    const saveData = await storage.load(slotIndex);

    if (!saveData) {
      alert('저장 데이터가 없습니다');
      return;
    }

    // 게임 정지
    game.stop();

    // 데이터 복원
    deserializeGame(game, saveData);

    // 게임 재시작
    game.start();

    alert(`슬롯 ${slotIndex}에서 불러왔습니다`);
  } catch (error) {
    console.error('불러오기 실패:', error);
    alert('불러오기에 실패했습니다');
  }
}

// 실행
setupGame();

// UI 버튼 이벤트 예제
document.getElementById('save-btn')?.addEventListener('click', () => {
  const name = prompt('저장 이름을 입력하세요');
  if (name) {
    saveGame(1, name);
  }
});

document.getElementById('load-btn')?.addEventListener('click', () => {
  loadGame(1);
});
```

## 저장 데이터 구조

```typescript
interface SaveData {
  meta: {
    version: string;          // 게임 버전
    slotIndex: number;        // 슬롯 번호
    name: string;             // 저장 이름
    createdAt: number;        // 생성 시간
    updatedAt: number;        // 업데이트 시간
    playTime: number;         // 플레이 시간 (ms)
  };
  simulation: {
    tick: number;             // 현재 틱
    speed: number;            // 게임 속도
    worldWidth: number;       // 월드 크기
    worldHeight: number;
    generation: number;       // 세대
  };
  organisms: SerializedOrganism[];  // 모든 생명체
  foods: SerializedFood[];          // 모든 음식
  statistics: {
    totalBorn: number;        // 누적 출생 수
    totalDied: number;        // 누적 사망 수
    maxPopulation: number;    // 최대 개체 수
    oldestAge: number;        // 최고령 기록
  };
}
```

## 주의사항

1. **IndexedDB 초기화**: 사용 전 반드시 `await storage.init()` 호출
2. **비동기 처리**: 모든 저장/불러오기 메서드는 `async/await` 사용
3. **브라우저 호환성**: 최신 브라우저에서만 작동 (IE 미지원)
4. **용량 제한**: 브라우저별로 IndexedDB 용량 제한이 있음 (일반적으로 50MB+)
5. **데이터 손실 주의**: 브라우저 캐시 삭제 시 데이터 손실 가능

## 트러블슈팅

### "StorageManager가 초기화되지 않았습니다" 에러

```typescript
// 잘못된 예
const storage = new StorageManager();
await storage.save(1, data); // ❌ 초기화 안 됨

// 올바른 예
const storage = new StorageManager();
await storage.init(); // ✅ 먼저 초기화
await storage.save(1, data);
```

### "OrganismManager가 초기화되지 않았습니다" 에러

```typescript
// 게임을 먼저 초기화해야 함
await game.init();
game.newGame(); // 새 게임 시작

// 이제 저장 가능
const saveData = serializeGame(game, 1, '저장 1');
```

### 버전 불일치 경고

저장된 데이터의 버전과 현재 게임 버전이 다를 때 발생합니다.
필요시 마이그레이션 로직을 추가하세요.

## 향후 개선 사항

- [ ] 썸네일 이미지 저장 (캔버스 스크린샷)
- [ ] 압축 기능 (LZ-string 등)
- [ ] 클라우드 동기화
- [ ] 저장 슬롯 개수 확장
- [ ] 데이터 마이그레이션 자동화
