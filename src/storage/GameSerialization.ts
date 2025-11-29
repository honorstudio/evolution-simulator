/**
 * Game 클래스 직렬화/역직렬화
 *
 * 게임 상태를 저장하고 복원하는 기능을 제공합니다.
 */

import { Game } from '../Game';
import { SaveData, SaveMeta, SAVE_VERSION } from './types';
import {
  serializeOrganism,
  serializeFood,
  deserializeOrganism,
  deserializeFood,
} from './serialization';

// 확장 메서드 사용을 위한 import
import './ManagerExtensions';

/**
 * 게임 상태를 SaveData로 직렬화
 *
 * @param game 현재 게임 인스턴스
 * @param slotIndex 저장 슬롯 번호
 * @param name 저장 이름
 */
export function serializeGame(
  game: Game,
  slotIndex: number,
  name: string
): SaveData {
  const simulation = game.getSimulation();
  const organismManager = simulation.getOrganismManager();
  const timeManager = simulation.getTimeManager();
  const statistics = simulation.getStatistics();
  const config = simulation.getConfig();

  if (!organismManager) {
    throw new Error('OrganismManager가 초기화되지 않았습니다');
  }

  // 메타 정보
  const meta: SaveMeta = {
    version: SAVE_VERSION,
    slotIndex,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    playTime: timeManager.getElapsedTime(),
  };

  // 모든 생명체와 음식 직렬화
  const organisms = organismManager
    .getOrganisms()
    .map(serializeOrganism);

  const foods = organismManager
    .getFoods()
    .map(serializeFood);

  // 저장 데이터 생성
  const saveData: SaveData = {
    meta,
    simulation: {
      tick: timeManager.getTick(),
      speed: timeManager.getSpeed(),
      worldWidth: config.worldWidth,
      worldHeight: config.worldHeight,
      generation: organismManager.getStatistics().generation,
    },
    organisms,
    foods,
    statistics: {
      totalBorn: statistics.totalBirths,
      totalDied: statistics.totalDeaths,
      maxPopulation: statistics.peakPopulation,
      oldestAge: statistics.oldestEverAge,
    },
  };

  console.log('게임 직렬화 완료:', {
    organisms: organisms.length,
    foods: foods.length,
    tick: saveData.simulation.tick,
  });

  return saveData;
}

/**
 * SaveData에서 게임 상태 복원
 *
 * @param game 게임 인스턴스
 * @param saveData 저장된 데이터
 */
export function deserializeGame(game: Game, saveData: SaveData): void {
  const simulation = game.getSimulation();
  const organismManager = simulation.getOrganismManager();
  const timeManager = simulation.getTimeManager();

  if (!organismManager) {
    throw new Error('OrganismManager가 초기화되지 않았습니다');
  }

  // 기존 데이터 클리어
  organismManager.clear();

  // 생명체 복원 (확장 메서드 사용)
  const organisms = saveData.organisms.map(deserializeOrganism);
  organisms.forEach(org => {
    organismManager.addOrganism(org);
  });

  // 음식 복원 (확장 메서드 사용)
  const foods = saveData.foods.map(deserializeFood);
  foods.forEach(food => {
    organismManager.addFood(food);
  });

  // 시간 관리자 복원 (확장 메서드 사용)
  timeManager.setSpeed(saveData.simulation.speed);
  timeManager.setTick(saveData.simulation.tick);
  timeManager.setElapsedTime(saveData.meta.playTime);

  // 세대 정보 복원 (확장 메서드 사용)
  organismManager.setGeneration(saveData.simulation.generation);

  console.log('게임 역직렬화 완료:', {
    organisms: organisms.length,
    foods: foods.length,
    tick: saveData.simulation.tick,
    generation: saveData.simulation.generation,
  });
}
