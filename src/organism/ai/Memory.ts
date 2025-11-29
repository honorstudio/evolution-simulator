/**
 * 기억 시스템 (Memory)
 *
 * 기능:
 * - 단기 기억: 최근 본 먹이, 위험, 짝 저장
 * - 장기 기억: 안전 지역, 먹이 위치, 위험 지역 저장
 * - 기억 강화: 반복되면 단기 → 장기 기억 전환
 * - 기억 망각: 오래된 기억 제거
 */

import type { Memory, Position } from './types';

export class MemorySystem {
  private memory: Memory;
  private readonly maxShortTermFood = 10;
  private readonly maxShortTermDanger = 10;
  private readonly maxShortTermMates = 5;
  private readonly maxLongTermFood = 5;
  private readonly maxLongTermDanger = 5;
  // 단기 기억 소멸 시간 - 30초 (게임 시간), 향후 기억 decay 기능에서 사용
  // private readonly shortTermDecayTime = 30000;
  private readonly reinforcementThreshold = 3; // 3번 이상 보면 장기 기억

  constructor(birthPosition: Position) {
    this.memory = {
      shortTerm: {
        recentFood: [],
        recentDanger: [],
        recentMates: [],
        lastUpdateTime: Date.now(),
      },
      longTerm: {
        homeTerritory: null,
        foodSources: [],
        dangerZones: [],
        birthPlace: { ...birthPosition },
      },
    };
  }

  /**
   * 먹이 위치 기억
   */
  public rememberFood(position: Position): void {
    // 중복 체크 (가까운 위치는 같은 것으로 간주)
    const isDuplicate = this.memory.shortTerm.recentFood.some(
      p => this.getDistance(p, position) < 5
    );

    if (!isDuplicate) {
      this.memory.shortTerm.recentFood.push({ ...position });

      // 최대 개수 초과 시 오래된 것 제거
      if (this.memory.shortTerm.recentFood.length > this.maxShortTermFood) {
        this.memory.shortTerm.recentFood.shift();
      }

      // 장기 기억 강화 체크
      this.reinforceFoodMemory(position);
    }
  }

  /**
   * 위험 위치 기억
   */
  public rememberDanger(position: Position): void {
    const isDuplicate = this.memory.shortTerm.recentDanger.some(
      p => this.getDistance(p, position) < 5
    );

    if (!isDuplicate) {
      this.memory.shortTerm.recentDanger.push({ ...position });

      if (this.memory.shortTerm.recentDanger.length > this.maxShortTermDanger) {
        this.memory.shortTerm.recentDanger.shift();
      }

      this.reinforceDangerMemory(position);
    }
  }

  /**
   * 짝 ID 기억
   */
  public rememberMate(mateId: string): void {
    if (!this.memory.shortTerm.recentMates.includes(mateId)) {
      this.memory.shortTerm.recentMates.push(mateId);

      if (this.memory.shortTerm.recentMates.length > this.maxShortTermMates) {
        this.memory.shortTerm.recentMates.shift();
      }
    }
  }

  /**
   * 영역 설정 (처음 한 번만)
   */
  public establishTerritory(position: Position, radius: number): void {
    if (!this.memory.longTerm.homeTerritory) {
      this.memory.longTerm.homeTerritory = {
        x: position.x,
        y: position.y,
        radius,
      };
    }
  }

  /**
   * 먹이 기억 강화 (단기 → 장기)
   */
  private reinforceFoodMemory(position: Position): void {
    // 단기 기억에서 같은 위치가 몇 번 나왔는지 확인
    const count = this.memory.shortTerm.recentFood.filter(
      p => this.getDistance(p, position) < 10
    ).length;

    if (count >= this.reinforcementThreshold) {
      // 장기 기억에 추가
      const isInLongTerm = this.memory.longTerm.foodSources.some(
        p => this.getDistance(p, position) < 10
      );

      if (!isInLongTerm) {
        this.memory.longTerm.foodSources.push({ ...position });

        if (this.memory.longTerm.foodSources.length > this.maxLongTermFood) {
          this.memory.longTerm.foodSources.shift();
        }
      }
    }
  }

  /**
   * 위험 기억 강화
   */
  private reinforceDangerMemory(position: Position): void {
    const count = this.memory.shortTerm.recentDanger.filter(
      p => this.getDistance(p, position) < 10
    ).length;

    if (count >= this.reinforcementThreshold) {
      const isInLongTerm = this.memory.longTerm.dangerZones.some(
        p => this.getDistance(p, position) < 10
      );

      if (!isInLongTerm) {
        this.memory.longTerm.dangerZones.push({ ...position });

        if (this.memory.longTerm.dangerZones.length > this.maxLongTermDanger) {
          this.memory.longTerm.dangerZones.shift();
        }
      }
    }
  }

  /**
   * 가장 가까운 기억된 먹이 위치 조회
   */
  public getNearestRememberedFood(currentPosition: Position): Position | null {
    let nearest: Position | null = null;
    let minDistance = Infinity;

    // 단기 기억 우선
    for (const food of this.memory.shortTerm.recentFood) {
      const distance = this.getDistance(currentPosition, food);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = food;
      }
    }

    // 장기 기억 확인
    for (const food of this.memory.longTerm.foodSources) {
      const distance = this.getDistance(currentPosition, food);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = food;
      }
    }

    return nearest;
  }

  /**
   * 특정 위치가 위험한지 확인
   */
  public isDangerousArea(position: Position, threshold: number = 20): boolean {
    // 단기 기억 확인
    const isShortTermDanger = this.memory.shortTerm.recentDanger.some(
      p => this.getDistance(p, position) < threshold
    );

    // 장기 기억 확인
    const isLongTermDanger = this.memory.longTerm.dangerZones.some(
      p => this.getDistance(p, position) < threshold
    );

    return isShortTermDanger || isLongTermDanger;
  }

  /**
   * 집 영역으로 돌아가야 하는지 확인
   */
  public shouldReturnHome(currentPosition: Position): boolean {
    const territory = this.memory.longTerm.homeTerritory;
    if (!territory) return false;

    const distance = this.getDistance(currentPosition, territory);
    return distance > territory.radius * 1.5; // 반경의 1.5배를 벗어나면 귀환
  }

  /**
   * 집 방향 벡터
   */
  public getHomeDirection(currentPosition: Position): { x: number; y: number } | null {
    const territory = this.memory.longTerm.homeTerritory;
    if (!territory) return null;

    const dx = territory.x - currentPosition.x;
    const dy = territory.y - currentPosition.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude === 0) return { x: 0, y: 0 };

    return {
      x: dx / magnitude,
      y: dy / magnitude,
    };
  }

  /**
   * 최근 만난 짝인지 확인 (근친 방지)
   */
  public isRecentMate(mateId: string): boolean {
    return this.memory.shortTerm.recentMates.includes(mateId);
  }

  /**
   * 기억 업데이트 (주기적 호출)
   */
  public update(currentTime: number): void {
    this.memory.shortTerm.lastUpdateTime = currentTime;
    // 필요시 오래된 단기 기억 제거 로직 추가 가능
  }

  /**
   * 기억 조회
   */
  public getMemory(): Memory {
    return this.memory;
  }

  /**
   * 기억 복제 (번식용)
   */
  public clone(): MemorySystem {
    const newMemory = new MemorySystem(this.memory.longTerm.birthPlace);
    // 장기 기억만 일부 상속 (먹이 위치, 위험 지역)
    newMemory.memory.longTerm.foodSources = [...this.memory.longTerm.foodSources];
    newMemory.memory.longTerm.dangerZones = [...this.memory.longTerm.dangerZones];
    return newMemory;
  }

  /**
   * 직렬화
   */
  public serialize(): string {
    return JSON.stringify(this.memory);
  }

  /**
   * 역직렬화
   */
  public static deserialize(data: string): MemorySystem {
    const memory = JSON.parse(data);
    const system = new MemorySystem(memory.longTerm.birthPlace);
    system.memory = memory;
    return system;
  }

  /**
   * 거리 계산
   */
  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
