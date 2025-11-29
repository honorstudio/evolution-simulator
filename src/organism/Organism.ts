import { Genome, mutateGenome, crossoverGenome } from './Genome';
import { Brain } from './Brain';
import { Food } from './Food';
import type { MulticellularTraits } from './multicellular/types';
import { AIController, type AIControllerConfig } from './ai/AIController';
import type { WorldContext } from './ai/SensorySystem';
import type { BehaviorResult } from './ai/BehaviorExecutor';
import { DiseaseType, DISEASE_CONFIGS } from '../disease/DiseaseTypes';

/**
 * 성별 타입
 */
export type Sex = 'male' | 'female' | 'hermaphrodite';

/**
 * 생명체 클래스
 * 단세포에서 시작하여 다세포 및 유성생식으로 진화 가능
 * 센서로 주변을 감지하고, 뇌로 판단해서 행동
 */
export class Organism {
  id: string;
  genome: Genome;
  brain: Brain;  // 기본 뇌 (호환성 유지)

  // === Phase 2: 고급 AI 시스템 ===
  aiController?: AIController;  // 고급 AI (선택적)
  useAdvancedAI: boolean = false;  // 고급 AI 사용 여부
  lastBehaviorResult?: BehaviorResult;  // 마지막 AI 결정

  // 위치와 움직임
  x: number;
  y: number;
  vx: number = 0;  // 속도 x
  vy: number = 0;  // 속도 y
  angle: number = 0; // 향하는 방향 (라디안)

  // 상태
  energy: number = 100;
  maxEnergy: number = 100;
  age: number = 0;
  isAlive: boolean = true;

  // === Phase 2: 추가 속성 ===
  generation: number = 0;           // 세대 수
  health: number = 100;              // 건강도 (0-100)
  reproductionCooldown: number = 0;  // 번식 쿨다운 (밀리초)

  // === Phase 2: 성선택 관련 ===
  sex: Sex = 'hermaphrodite';        // 성별 (초기: 자웅동체)
  attractiveness: number = 0.5;      // 매력도 (0-1)
  matingDesire: number = 0;          // 짝짓기 욕구 (0-1)

  // === Phase 2: 다세포 시스템 ===
  multicellular?: MulticellularTraits; // 다세포 데이터 (단세포면 undefined)

  // === Phase 6: 질병 시스템 ===
  currentDisease: DiseaseType | null = null;  // 현재 감염된 질병
  diseaseInfectedAt: number = 0;              // 감염된 시점 (틱)
  diseaseIncubating: boolean = false;         // 잠복기 중인지
  diseaseSymptomatic: boolean = false;        // 증상 발현 중인지
  diseaseImmunities: Map<DiseaseType, number> = new Map(); // 면역 (질병 -> 면역 만료 틱)

  // 센서 입력 데이터
  sensorInputs: number[] = [];

  // 행동 출력
  private moveForce: number = 0;
  private turnForce: number = 0;

  private static idCounter = 0;

  constructor(
    x: number,
    y: number,
    genome: Genome,
    brain?: Brain,
    aiController?: AIController,
    useAdvancedAI: boolean = false
  ) {
    this.id = `org_${Organism.idCounter++}`;
    this.x = x;
    this.y = y;
    this.genome = genome;
    this.useAdvancedAI = useAdvancedAI;

    // 기본 뇌 생성 또는 복사 (호환성 유지)
    if (brain) {
      this.brain = brain;
    } else {
      // 새 뇌 생성: 입력 8개, 출력 2개 (이동, 회전)
      this.brain = new Brain(
        8,  // 입력: 음식방향(2) + 음식거리(1) + 다른개체방향(2) + 다른개체거리(1) + 에너지(1) + 속도(1)
        genome.hiddenLayers,
        genome.neuronsPerLayer,
        2   // 출력: 전진력, 회전력
      );
    }

    // Phase 2: 고급 AI 컨트롤러 설정
    if (aiController) {
      this.aiController = aiController;
      this.useAdvancedAI = true;
    } else if (useAdvancedAI) {
      // 고급 AI 컨트롤러 생성
      this.aiController = this.createAIController();
    }

    this.maxEnergy = 100 * genome.size;
    this.energy = this.maxEnergy;

    // Phase 2: 성별 결정 (나이가 성숙기에 도달하면 결정됨)
    this.sex = this.determineSex();

    // Phase 2: 매력도 계산 (외형 기반)
    this.attractiveness = this.calculateAttractiveness();
  }

  /**
   * 고급 AI 컨트롤러 생성
   */
  private createAIController(): AIController {
    const config: AIControllerConfig = {
      brainConfig: {
        inputSize: 12,
        hiddenSize: 16,
        outputSize: 8,
        hiddenLayers: this.genome.hiddenLayers || 1,
      },
      senseRange: this.genome.sensorRange,
      birthPosition: { x: this.x, y: this.y },
    };
    return new AIController(config);
  }

  /**
   * 고급 AI 활성화
   */
  enableAdvancedAI(): void {
    if (!this.aiController) {
      this.aiController = this.createAIController();
    }
    this.useAdvancedAI = true;
  }

  /**
   * 고급 AI 비활성화 (기본 뇌 사용)
   */
  disableAdvancedAI(): void {
    this.useAdvancedAI = false;
  }

  /**
   * 성별 결정 (유전자 기반)
   */
  private determineSex(): Sex {
    // 초기에는 자웅동체, 진화하면서 분화
    const rand = Math.random();
    if (rand < 0.7) return 'hermaphrodite';
    if (rand < 0.85) return 'male';
    return 'female';
  }

  /**
   * 매력도 계산 (외형 유전자 기반)
   */
  private calculateAttractiveness(): number {
    const app = this.genome.appearance;
    let score = 0.5;

    // 색상 선명도
    score += (this.genome.saturation / 100) * 0.1;

    // 패턴 복잡도
    if (app.pattern !== 'solid') score += 0.1;

    // 부속물 (과시용)
    score += app.spikes * 0.02;
    score += app.tailLength * 0.1;

    // 발광
    score += app.glow * 0.15;

    // displayIntensity 유전자
    score += this.genome.displayIntensity * 0.1;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * 주변 환경 감지 (센서)
   */
  sense(nearbyOrganisms: Organism[], nearbyFood: Food[]): void {
    const inputs: number[] = new Array(8).fill(0);

    // 1-3: 가장 가까운 음식 정보
    const closestFood = this.findClosest(nearbyFood);
    if (closestFood) {
      const dx = closestFood.x - this.x;
      const dy = closestFood.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angleToFood = Math.atan2(dy, dx) - this.angle;

      inputs[0] = Math.cos(angleToFood); // x 방향
      inputs[1] = Math.sin(angleToFood); // y 방향
      inputs[2] = Math.max(0, 1 - distance / this.genome.sensorRange); // 거리 (가까울수록 1)
    }

    // 4-6: 가장 가까운 다른 생명체 정보
    const closestOrganism = this.findClosest(
      nearbyOrganisms.filter(org => org.id !== this.id)
    );
    if (closestOrganism) {
      const dx = closestOrganism.x - this.x;
      const dy = closestOrganism.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angleToOrg = Math.atan2(dy, dx) - this.angle;

      inputs[3] = Math.cos(angleToOrg);
      inputs[4] = Math.sin(angleToOrg);
      inputs[5] = Math.max(0, 1 - distance / this.genome.sensorRange);
    }

    // 7: 에너지 레벨 (0 ~ 1)
    inputs[6] = this.energy / this.maxEnergy;

    // 8: 현재 속도 (0 ~ 1)
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    inputs[7] = Math.min(1, speed / (this.genome.speed * 2));

    this.sensorInputs = inputs;
  }

  /**
   * 가장 가까운 대상 찾기
   */
  private findClosest<T extends { x: number; y: number }>(objects: T[]): T | null {
    if (objects.length === 0) return null;

    let closest: T | null = null;
    let minDistance = Infinity;

    for (const obj of objects) {
      const dx = obj.x - this.x;
      const dy = obj.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance && distance < this.genome.sensorRange) {
        minDistance = distance;
        closest = obj;
      }
    }

    return closest;
  }

  /**
   * 뇌로 생각하고 행동 결정 (기본 뇌 사용)
   */
  think(): void {
    if (!this.isAlive) return;

    const outputs = this.brain.forward(this.sensorInputs);

    // 출력: [-1, 1] 범위
    this.moveForce = outputs[0] ?? 0;  // 전진/후진
    this.turnForce = outputs[1] ?? 0;  // 좌/우 회전
  }

  /**
   * 고급 AI로 생각하고 행동 결정
   * WorldContext를 받아서 더 정교한 판단을 수행
   */
  thinkAdvanced(world: WorldContext, currentTime: number): BehaviorResult | null {
    if (!this.isAlive || !this.aiController) return null;

    const result = this.aiController.update(
      this.id,
      { x: this.x, y: this.y },
      world,
      {
        energy: this.energy,
        maxEnergy: this.maxEnergy,
        health: this.health,
        reproductionReady: this.canReproduce(),
        age: this.age,
        maxAge: 10000, // 최대 수명 (임시값)
      },
      currentTime
    );

    this.lastBehaviorResult = result;

    // 행동 결과에 따른 moveForce/turnForce 설정
    if (result.movement) {
      // 방향을 각도로 변환
      const targetAngle = Math.atan2(result.movement.direction.y, result.movement.direction.x);
      const angleDiff = this.normalizeAngle(targetAngle - this.angle);

      // 이동력과 회전력 설정
      this.moveForce = result.movement.speed;
      this.turnForce = Math.sign(angleDiff) * Math.min(1, Math.abs(angleDiff) / Math.PI);
    } else if (result.action === 'REST') {
      this.moveForce = 0;
      this.turnForce = 0;
    }

    return result;
  }

  /**
   * 각도 정규화 (-PI ~ PI)
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  /**
   * 현재 행동 가져오기
   */
  getCurrentAction(): string {
    if (this.lastBehaviorResult) {
      return this.lastBehaviorResult.action;
    }
    return 'UNKNOWN';
  }

  /**
   * 행동 실행
   * @param delta 게임 속도가 적용된 시간 (밀리초)
   */
  act(delta: number = 16.67): void {
    if (!this.isAlive) return;

    // delta를 정규화 (기준: 60fps = 16.67ms)
    const timeScale = delta / 16.67;

    // 고착성 생물(식물)은 움직이지 않음
    if (this.genome.locomotion === 'sessile' || this.genome.kingdom === 'plant') {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // 회전 (delta 적용)
    const turnSpeed = 0.1 * this.genome.speed * timeScale;
    this.angle += this.turnForce * turnSpeed;

    // 이동 방식에 따른 속도 보정
    let speedMultiplier = 1.0;
    switch (this.genome.locomotion) {
      case 'crawl': speedMultiplier = 0.5; break;
      case 'swim': speedMultiplier = 1.0; break;
      case 'walk': speedMultiplier = 0.8; break;
      case 'fly': speedMultiplier = 1.5; break;
    }

    // Phase 6: 질병으로 인한 속도 감소
    const diseaseSpeedPenalty = this.getDiseaseSpeedPenalty();
    speedMultiplier *= (1 - diseaseSpeedPenalty);

    // 이동 (delta 적용)
    const acceleration = 0.5 * this.genome.speed * speedMultiplier * timeScale;
    const ax = Math.cos(this.angle) * this.moveForce * acceleration;
    const ay = Math.sin(this.angle) * this.moveForce * acceleration;

    this.vx += ax;
    this.vy += ay;

    // 마찰 (속도 감소) - delta 적용하여 프레임 독립적으로
    const friction = Math.pow(0.95, timeScale);
    this.vx *= friction;
    this.vy *= friction;

    // 최대 속도 제한
    const maxSpeed = 3 * this.genome.speed * speedMultiplier;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // 위치 업데이트 (delta 적용)
    this.x += this.vx * timeScale;
    this.y += this.vy * timeScale;
  }

  /**
   * 에너지 소비 (kingdom에 따라 다름)
   */
  consumeEnergy(delta: number): void {
    if (!this.isAlive) return;

    // delta를 초 단위로 변환 (delta는 밀리초)
    const deltaSeconds = delta / 1000;

    // 식물인 경우 광합성으로 에너지 생성
    if (this.genome.kingdom === 'plant' || this.genome.diet === 'photosynthetic') {
      const photosynthesisGain = this.performPhotosynthesis(deltaSeconds);
      this.energy += photosynthesisGain;
    }

    // 기본 대사 에너지 (식물은 낮음, 동물은 높음)
    let metabolismMultiplier = 1.0;
    if (this.genome.kingdom === 'plant') {
      metabolismMultiplier = 0.3; // 식물은 대사 비용이 낮음
    } else if (this.genome.kingdom === 'animal') {
      metabolismMultiplier = 1.2; // 동물은 대사 비용이 높음
    }

    const metabolismCost = 1.0 * this.genome.metabolism * metabolismMultiplier * deltaSeconds;

    // 이동 에너지 (식물은 움직이지 않음)
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    let movementCost = 0.3 * speed * this.genome.size * deltaSeconds;

    // 고착성 생물(식물)은 이동 비용 없음
    if (this.genome.locomotion === 'sessile') {
      movementCost = 0;
    }

    // 크기에 비례한 유지 비용
    const sizeCost = 0.5 * this.genome.size * deltaSeconds;

    // Phase 2: 다세포 생물은 대사 효율 보너스
    const efficiencyBonus = this.getMetabolicEfficiency();

    this.energy -= (metabolismCost + movementCost + sizeCost) * efficiencyBonus;

    // 에너지 고갈시 사망
    if (this.energy <= 0) {
      this.energy = 0;
      this.isAlive = false;
    }

    // 에너지 상한
    if (this.energy > this.maxEnergy) {
      this.energy = this.maxEnergy;
    }
  }

  /**
   * 광합성 (식물용)
   */
  private performPhotosynthesis(deltaSeconds: number): number {
    // 기본 광합성 속도 (낮시간 가정, 향후 환경과 연동)
    const sunlight = 0.7; // 햇빛 강도 (0-1)
    const chlorophyll = this.genome.appearance.glow > 0 ? 1.0 : 0.7; // 발광 = 엽록소 대용

    // 크기가 클수록 광합성 더 많이
    const leafArea = this.genome.size * 10;

    // 광합성 효율 (낮춤)
    const efficiency = sunlight * chlorophyll * 0.15;

    // 생성 에너지
    return leafArea * efficiency * deltaSeconds;
  }

  /**
   * 음식 먹기
   */
  eat(food: Food): boolean {
    if (!this.isAlive || food.isConsumed) return false;

    // 음식과의 거리 확인
    const dx = food.x - this.x;
    const dy = food.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const eatRange = this.getRadius() + food.radius;

    if (distance < eatRange) {
      const gainedEnergy = food.consume();
      this.energy += gainedEnergy;

      if (this.energy > this.maxEnergy) {
        this.energy = this.maxEnergy;
      }

      return true;
    }

    return false;
  }

  /**
   * 번식 가능 여부
   */
  canReproduce(): boolean {
    return this.isAlive &&
           this.energy > this.maxEnergy * 0.7 &&  // 에너지 70% 이상
           this.age > 500 &&  // 최소 나이
           this.reproductionCooldown <= 0 &&  // 쿨다운 완료
           !this.isDiseaseBlockingReproduction();  // Phase 6: 질병으로 인한 번식 불가 체크
  }

  /**
   * 무성생식 (복제 + 돌연변이)
   */
  reproduce(): Organism | null {
    if (!this.canReproduce()) return null;

    // 에너지 절반 소비
    const reproductionCost = this.maxEnergy * 0.4;
    this.energy -= reproductionCost;

    // 유전자 복제 및 돌연변이
    const childGenome = mutateGenome(this.genome);

    // 🧬 진화 로그: Diet 변화 감지
    if (childGenome.diet !== this.genome.diet) {
      console.log(`🧬 진화 발생! ${this.genome.diet} → ${childGenome.diet} (세대: ${this.generation + 1})`);
    }

    // 뇌 복제 및 돌연변이
    const childBrain = this.brain.clone();
    childBrain.mutate(childGenome.mutationRate);

    // 자식 생성 (부모 근처에 배치)
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 40;
    const childX = this.x + offsetX;
    const childY = this.y + offsetY;

    // 고급 AI도 복제 (사용 중이면)
    let childAIController: AIController | undefined;
    if (this.useAdvancedAI && this.aiController) {
      childAIController = this.aiController.clone({ x: childX, y: childY });
    }

    const child = new Organism(
      childX,
      childY,
      childGenome,
      childBrain,
      childAIController,
      this.useAdvancedAI
    );

    // 자식에게 초기 에너지 제공
    child.energy = reproductionCost;

    // Phase 2: 세대 증가 및 쿨다운 설정
    child.generation = this.generation + 1;
    this.reproductionCooldown = 5000; // 5초 쿨다운

    return child;
  }

  /**
   * 유성생식 (두 부모의 유전자 교배)
   */
  reproduceWith(partner: Organism): Organism | null {
    // 둘 다 번식 가능해야 함
    if (!this.canReproduce() || !partner.canReproduce()) return null;

    // 호환성 체크 (같은 종끼리만)
    if (!this.isCompatibleWith(partner)) return null;

    // 짝 선택 (매력도 기반)
    if (!this.acceptsMate(partner)) return null;

    // 에너지 절반씩 소비
    const reproductionCost = this.maxEnergy * 0.3;
    this.energy -= reproductionCost;
    partner.energy -= reproductionCost;

    // 유전자 교배
    const childGenome = crossoverGenome(this.genome, partner.genome);

    // 추가 돌연변이 적용
    const mutatedGenome = mutateGenome(childGenome);

    // 🧬 진화 로그: Diet 변화 감지 (유성생식)
    if (mutatedGenome.diet !== this.genome.diet && mutatedGenome.diet !== partner.genome.diet) {
      console.log(`🧬 진화 발생! ${this.genome.diet}/${partner.genome.diet} → ${mutatedGenome.diet} (세대: ${Math.max(this.generation, partner.generation) + 1})`);
    }

    // 뇌 교배 (가중치 혼합)
    const childBrain = this.brain.clone();
    childBrain.crossoverWith(partner.brain);
    childBrain.mutate(mutatedGenome.mutationRate);

    // 자식 생성 (부모들 중간 위치)
    const childX = (this.x + partner.x) / 2 + (Math.random() - 0.5) * 30;
    const childY = (this.y + partner.y) / 2 + (Math.random() - 0.5) * 30;

    // 고급 AI 교배 (둘 다 사용 중이면)
    let childAIController: AIController | undefined;
    const useAdvanced = this.useAdvancedAI || partner.useAdvancedAI;
    if (useAdvanced && this.aiController && partner.aiController) {
      childAIController = this.aiController.reproduce(
        partner.aiController,
        { x: childX, y: childY }
      );
    } else if (this.useAdvancedAI && this.aiController) {
      childAIController = this.aiController.clone({ x: childX, y: childY });
    } else if (partner.useAdvancedAI && partner.aiController) {
      childAIController = partner.aiController.clone({ x: childX, y: childY });
    }

    const child = new Organism(
      childX,
      childY,
      mutatedGenome,
      childBrain,
      childAIController,
      useAdvanced
    );
    child.energy = reproductionCost * 2; // 부모들의 투자 에너지
    child.generation = Math.max(this.generation, partner.generation) + 1;

    // 쿨다운 설정
    this.reproductionCooldown = 8000;  // 유성생식은 더 긴 쿨다운
    partner.reproductionCooldown = 8000;

    return child;
  }

  /**
   * 짝 호환성 체크
   */
  isCompatibleWith(partner: Organism): boolean {
    // 자기 자신과는 번식 불가
    if (this.id === partner.id) return false;

    // 같은 kingdom이어야 함 (undetermined는 모두와 호환)
    if (this.genome.kingdom !== 'undetermined' &&
        partner.genome.kingdom !== 'undetermined' &&
        this.genome.kingdom !== partner.genome.kingdom) {
      return false;
    }

    // 성별 호환 (자웅동체는 모두와 호환)
    if (this.sex === 'male' && partner.sex === 'male') return false;
    if (this.sex === 'female' && partner.sex === 'female') return false;

    return true;
  }

  /**
   * 짝 수락 여부 (매력도 기반 확률)
   */
  acceptsMate(partner: Organism): boolean {
    // 기본 수락 확률
    let acceptChance = 0.3;

    // 상대방 매력도에 따른 보너스
    acceptChance += partner.attractiveness * 0.4;

    // 자신의 선호 강도에 따른 까다로움
    acceptChance -= this.genome.preferenceStrength * 0.2;

    // 번식 욕구가 높으면 수락률 증가
    acceptChance += this.matingDesire * 0.3;

    return Math.random() < acceptChance;
  }

  /**
   * 짝짓기 욕구 업데이트
   */
  updateMatingDesire(delta: number): void {
    if (!this.isAlive) return;

    // 성숙기 이후에만
    if (this.age < this.genome.sexualMaturity) {
      this.matingDesire = 0;
      return;
    }

    // 에너지가 충분하면 욕구 증가
    if (this.energy > this.maxEnergy * 0.6) {
      this.matingDesire = Math.min(1, this.matingDesire + 0.0001 * delta);
    } else {
      this.matingDesire = Math.max(0, this.matingDesire - 0.0002 * delta);
    }

    // 번식 후에는 욕구 감소
    if (this.reproductionCooldown > 0) {
      this.matingDesire *= 0.5;
    }
  }

  /**
   * 매 프레임 업데이트
   */
  update(delta: number): void {
    if (!this.isAlive) return;

    this.age += delta;
    this.consumeEnergy(delta);

    // Phase 2: 번식 쿨다운 감소
    if (this.reproductionCooldown > 0) {
      this.reproductionCooldown -= delta;
    }

    // Phase 2: 건강도 자연 회복 (에너지가 충분할 때)
    if (this.health < 100 && this.energy > this.maxEnergy * 0.5) {
      this.health = Math.min(100, this.health + 0.01 * (delta / 1000));
    }

    // Phase 2: 짝짓기 욕구 업데이트
    this.updateMatingDesire(delta);

    // 노화로 인한 사망 (선택사항)
    // if (this.age > 5000) {
    //   this.isAlive = false;
    // }
  }

  /**
   * 생명체 크기 (반지름)
   * 다세포 생물은 세포 수에 따라 크기 보너스
   */
  getRadius(): number {
    let sizeMultiplier = 5;
    if (this.multicellular) {
      sizeMultiplier = 5 + (this.multicellular.cellCount * 0.5);
    }
    return sizeMultiplier * this.genome.size;
  }

  /**
   * HSL 색상 문자열 반환
   */
  getColor(): string {
    return `hsl(${this.genome.hue}, ${this.genome.saturation}%, ${this.genome.lightness}%)`;
  }

  // === Phase 2: 추가 메서드 ===

  /**
   * 건강도 반환
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * 피해 받기
   */
  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
    }
  }

  /**
   * 치유
   */
  heal(amount: number): void {
    this.health = Math.min(100, this.health + amount);
  }

  /**
   * 세대 반환
   */
  getGeneration(): number {
    return this.generation;
  }

  // === Phase 2: 다세포 관련 메서드 ===

  /**
   * 다세포 생물 여부 확인
   */
  isMulticellular(): boolean {
    return this.multicellular !== undefined;
  }

  /**
   * 다세포 세포 수 반환 (단세포는 1)
   */
  getCellCount(): number {
    return this.multicellular?.cellCount ?? 1;
  }

  /**
   * 다세포 특성 설정
   */
  setMulticellularTraits(traits: MulticellularTraits): void {
    this.multicellular = traits;
  }

  /**
   * 대사 효율 (다세포 보너스 포함)
   */
  getMetabolicEfficiency(): number {
    if (this.multicellular) {
      return 1.0 - (this.multicellular.metabolicEfficiency * 0.3);
    }
    return 1.0;
  }

  // === Phase 6: 질병 시스템 메서드 ===

  /**
   * 질병 감염 시도
   * @param disease 질병 타입
   * @param currentTick 현재 틱
   * @returns 감염 성공 여부
   */
  tryInfect(disease: DiseaseType, currentTick: number): boolean {
    // 이미 감염된 상태면 실패
    if (this.currentDisease !== null) return false;

    // 면역이 있으면 실패
    const immunityExpiry = this.diseaseImmunities.get(disease);
    if (immunityExpiry !== undefined && immunityExpiry > currentTick) {
      return false;
    }

    const config = DISEASE_CONFIGS.get(disease);
    if (!config) return false;

    // 감염 확률 계산 (면역력과 기본 저항력 고려)
    const resistance = this.genome.immunity * 0.5 + config.baseResistance * 0.5;
    const infectionChance = config.transmissionRate * (1 - resistance);

    if (Math.random() < infectionChance) {
      this.currentDisease = disease;
      this.diseaseInfectedAt = currentTick;
      this.diseaseIncubating = true;
      this.diseaseSymptomatic = false;
      return true;
    }

    return false;
  }

  /**
   * 질병 상태 업데이트
   * @param currentTick 현재 틱
   * @param delta 경과 시간
   */
  updateDisease(currentTick: number, delta: number): void {
    if (!this.isAlive || this.currentDisease === null) return;

    const config = DISEASE_CONFIGS.get(this.currentDisease);
    if (!config) return;

    const diseaseDuration = currentTick - this.diseaseInfectedAt;

    // 잠복기 체크
    if (this.diseaseIncubating) {
      if (diseaseDuration >= config.incubationTime) {
        this.diseaseIncubating = false;
        this.diseaseSymptomatic = true;
      }
      return; // 잠복기 중에는 증상 없음
    }

    // 증상 발현 중
    if (this.diseaseSymptomatic) {
      const symptoms = config.symptoms;

      // 사망률 체크 (틱당)
      if (symptoms.mortalityRate > 0) {
        const deathChance = symptoms.mortalityRate * (1 - this.genome.diseaseResistance * 0.5);
        if (Math.random() < deathChance) {
          this.isAlive = false;
          return;
        }
      }

      // 에너지 추가 소모
      const extraEnergyDrain = (symptoms.energyDrainRate - 1) * 0.1 * (delta / 16.67);
      this.energy -= extraEnergyDrain;

      // 건강도 감소
      this.health -= 0.01 * (delta / 16.67);
      if (this.health < 0) this.health = 0;
    }

    // 질병 종료 체크
    if (diseaseDuration >= config.incubationTime + config.duration) {
      this.recoverFromDisease(currentTick, config.immunityAfterRecovery);
    }
  }

  /**
   * 질병에서 회복
   */
  recoverFromDisease(currentTick: number, immunityDuration: number): void {
    if (this.currentDisease === null) return;

    // 면역 획득
    if (immunityDuration > 0) {
      this.diseaseImmunities.set(this.currentDisease, currentTick + immunityDuration);
    }

    this.currentDisease = null;
    this.diseaseInfectedAt = 0;
    this.diseaseIncubating = false;
    this.diseaseSymptomatic = false;
  }

  /**
   * 현재 이동 속도 감소율 반환 (질병 영향)
   */
  getDiseaseSpeedPenalty(): number {
    if (this.currentDisease === null || !this.diseaseSymptomatic) return 0;

    const config = DISEASE_CONFIGS.get(this.currentDisease);
    if (!config) return 0;

    return config.symptoms.speedReduction;
  }

  /**
   * 질병으로 인한 번식 불가 여부
   */
  isDiseaseBlockingReproduction(): boolean {
    if (this.currentDisease === null || !this.diseaseSymptomatic) return false;

    const config = DISEASE_CONFIGS.get(this.currentDisease);
    if (!config) return false;

    return config.symptoms.reproductionBlock;
  }

  /**
   * 현재 질병이 전염성인지 확인
   */
  isContagious(): boolean {
    if (this.currentDisease === null || !this.diseaseSymptomatic) return false;

    const config = DISEASE_CONFIGS.get(this.currentDisease);
    if (!config) return false;

    return config.symptoms.contagious;
  }

  /**
   * 만료된 면역 정리
   */
  cleanupExpiredImmunities(currentTick: number): void {
    for (const [disease, expiry] of this.diseaseImmunities.entries()) {
      if (expiry <= currentTick) {
        this.diseaseImmunities.delete(disease);
      }
    }
  }

  /**
   * 특정 질병에 면역인지 확인
   */
  isImmuneToDisease(disease: DiseaseType, currentTick: number): boolean {
    const expiry = this.diseaseImmunities.get(disease);
    return expiry !== undefined && expiry > currentTick;
  }
}
