import { Container, Graphics } from 'pixi.js';
import { Food } from '../organism/Food';

/**
 * 음식 렌더러
 * 모든 음식을 시각적으로 표현합니다.
 */
export class FoodRenderer {
  private container: Container;
  private graphics: Graphics;

  // 음식 색상
  private static readonly FOOD_COLOR = 0x4caf50; // 녹색
  private static readonly FOOD_GLOW = 0x81c784;  // 연한 녹색

  constructor() {
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * 컨테이너 반환
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * 모든 음식 렌더링
   */
  render(foods: Food[]): void {
    this.graphics.clear();

    for (const food of foods) {
      if (food.isConsumed) continue;
      this.drawFood(food);
    }
  }

  /**
   * 개별 음식 그리기
   */
  private drawFood(food: Food): void {
    const radius = food.radius;
    const x = food.x;
    const y = food.y;

    // 외곽 빛 효과
    this.graphics
      .circle(x, y, radius + 2)
      .fill({ color: FoodRenderer.FOOD_GLOW, alpha: 0.3 });

    // 메인 음식
    this.graphics
      .circle(x, y, radius)
      .fill({ color: FoodRenderer.FOOD_COLOR, alpha: 0.9 });

    // 하이라이트 (작은 밝은 점)
    const highlightRadius = Math.max(1, radius * 0.3);
    const highlightX = x - radius * 0.3;
    const highlightY = y - radius * 0.3;
    this.graphics
      .circle(highlightX, highlightY, highlightRadius)
      .fill({ color: 0xffffff, alpha: 0.5 });
  }

  /**
   * 정리
   */
  destroy(): void {
    this.graphics.destroy();
    this.container.destroy();
  }
}
