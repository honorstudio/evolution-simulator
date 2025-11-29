/**
 * Manager 클래스들 확장
 *
 * 저장/불러오기를 위해 필요한 메서드들을 추가합니다.
 */

import { OrganismManager } from '../organism/OrganismManager';
import { TimeManager } from '../simulation/Time';
import { Organism } from '../organism/Organism';
import { Food } from '../organism/Food';

// OrganismManager 확장
declare module '../organism/OrganismManager' {
  interface OrganismManager {
    addOrganism(organism: Organism): void;
    addFood(food: Food): void;
    setGeneration(generation: number): void;
  }
}

/**
 * 생명체 추가
 */
OrganismManager.prototype.addOrganism = function(organism: Organism): void {
  // @ts-ignore - private 필드 접근
  this.organisms.push(organism);
};

/**
 * 음식 추가
 */
OrganismManager.prototype.addFood = function(food: Food): void {
  // @ts-ignore - private 필드 접근
  this.foods.push(food);
};

/**
 * 세대 설정
 */
OrganismManager.prototype.setGeneration = function(generation: number): void {
  // @ts-ignore - private 필드 접근
  this.generation = generation;
};

// TimeManager 확장
declare module '../simulation/Time' {
  interface TimeManager {
    setTick(tick: number): void;
    setElapsedTime(time: number): void;
    getElapsedTime(): number;
  }
}

/**
 * 틱 설정
 */
TimeManager.prototype.setTick = function(tick: number): void {
  // @ts-ignore - private 필드 접근
  this.tickCount = tick;
};

/**
 * 경과 시간 설정
 */
TimeManager.prototype.setElapsedTime = function(time: number): void {
  // @ts-ignore - private 필드 접근
  this.elapsedTime = time;
};

/**
 * 경과 시간 반환
 */
TimeManager.prototype.getElapsedTime = function(): number {
  // @ts-ignore - private 필드 접근
  return this.elapsedTime || 0;
};
