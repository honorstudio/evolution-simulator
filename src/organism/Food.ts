/**
 * 음식 - 생명체가 먹을 수 있는 에너지 공급원
 */
export class Food {
  id: string;
  x: number;
  y: number;
  energy: number;      // 제공하는 에너지량
  radius: number;      // 크기
  isConsumed: boolean; // 먹혔는지 여부

  private static idCounter = 0;

  constructor(x: number, y: number, energy: number = 30) {
    this.id = `food_${Food.idCounter++}`;
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.radius = 3 + energy / 10; // 에너지에 비례한 크기
    this.isConsumed = false;
  }

  /**
   * 음식 소비
   */
  consume(): number {
    if (this.isConsumed) {
      return 0;
    }

    this.isConsumed = true;
    return this.energy;
  }

  /**
   * 특정 위치와의 거리 계산
   */
  distanceTo(x: number, y: number): number {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * 랜덤한 위치에 음식 생성
 */
export function spawnFood(x: number, y: number, energy?: number): Food {
  return new Food(x, y, energy);
}

/**
 * 여러 개의 음식을 랜덤 위치에 생성
 */
export function spawnFoodRandom(
  count: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  energyRange: [number, number] = [20, 40]
): Food[] {
  const foods: Food[] = [];

  for (let i = 0; i < count; i++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    const energy = energyRange[0] + Math.random() * (energyRange[1] - energyRange[0]);

    foods.push(new Food(x, y, energy));
  }

  return foods;
}
