/**
 * 질병 관리자 클래스
 * Phase 6: 질병 시스템
 *
 * 생명체 간 질병 전파, 환경 조건에 따른 감염, 질병 통계 관리
 */

import { Organism } from '../organism/Organism';
import {
  DiseaseType,
  DISEASE_CONFIGS,
  getEnvironmentalDiseases,
} from './DiseaseTypes';

/**
 * 질병 통계 인터페이스
 */
export interface DiseaseStats {
  totalInfected: number;           // 현재 감염자 수
  totalRecovered: number;          // 회복자 수 (면역 보유)
  deathsByDisease: number;         // 질병으로 인한 사망자 수
  infectionsByType: Map<DiseaseType, number>; // 질병별 감염자 수
}

/**
 * 질병 관리자 클래스
 */
export class DiseaseManager {
  // 통계
  private stats: DiseaseStats = {
    totalInfected: 0,
    totalRecovered: 0,
    deathsByDisease: 0,
    infectionsByType: new Map(),
  };

  // 설정
  private transmissionRadius: number;    // 전염 반경
  private environmentalCheckInterval: number; // 환경 질병 체크 간격 (틱)
  private lastEnvironmentalCheck: number = 0;

  // 현재 환경 온도 (외부에서 설정)
  private currentTemperature: number = 25;

  constructor(
    transmissionRadius: number = 30,
    environmentalCheckInterval: number = 500
  ) {
    this.transmissionRadius = transmissionRadius;
    this.environmentalCheckInterval = environmentalCheckInterval;
  }

  /**
   * 현재 온도 설정 (환경 시스템과 연동)
   */
  setTemperature(temperature: number): void {
    this.currentTemperature = temperature;
  }

  /**
   * 질병 시스템 업데이트
   * 매 틱마다 호출
   */
  update(
    organisms: Organism[],
    currentTick: number,
    delta: number
  ): void {
    // 1. 각 생명체의 질병 상태 업데이트
    this.updateOrganismDiseases(organisms, currentTick, delta);

    // 2. 전염성 질병 전파
    this.spreadContagiousDiseases(organisms, currentTick);

    // 3. 환경 조건에 따른 질병 발생 (주기적으로)
    if (currentTick - this.lastEnvironmentalCheck >= this.environmentalCheckInterval) {
      this.checkEnvironmentalDiseases(organisms, currentTick);
      this.lastEnvironmentalCheck = currentTick;
    }

    // 4. 통계 업데이트
    this.updateStats(organisms, currentTick);
  }

  /**
   * 각 생명체의 질병 상태 업데이트
   */
  private updateOrganismDiseases(
    organisms: Organism[],
    currentTick: number,
    delta: number
  ): void {
    for (const organism of organisms) {
      if (!organism.isAlive) continue;

      // 질병 상태 업데이트
      organism.updateDisease(currentTick, delta);

      // 만료된 면역 정리 (100틱마다)
      if (currentTick % 100 === 0) {
        organism.cleanupExpiredImmunities(currentTick);
      }
    }
  }

  /**
   * 전염성 질병 전파
   */
  private spreadContagiousDiseases(
    organisms: Organism[],
    currentTick: number
  ): void {
    // 감염자 목록 수집
    const contagiousOrganisms = organisms.filter(org =>
      org.isAlive && org.isContagious() && org.currentDisease !== null
    );

    if (contagiousOrganisms.length === 0) return;

    // 전염 시도
    for (const infected of contagiousOrganisms) {
      const disease = infected.currentDisease!;

      // 주변 생명체에게 전염 시도
      for (const target of organisms) {
        if (target.id === infected.id) continue;
        if (!target.isAlive) continue;
        if (target.currentDisease !== null) continue; // 이미 감염된 상태

        // 거리 체크
        const dx = target.x - infected.x;
        const dy = target.y - infected.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.transmissionRadius) continue;

        // 거리에 따른 전염 확률 보정 (가까울수록 확률 높음)
        const distanceFactor = 1 - (distance / this.transmissionRadius);

        // 전염 시도
        if (Math.random() < distanceFactor * 0.1) { // 기본 10% 확률
          target.tryInfect(disease, currentTick);
        }
      }
    }
  }

  /**
   * 환경 조건에 따른 질병 발생 체크
   */
  private checkEnvironmentalDiseases(
    organisms: Organism[],
    currentTick: number
  ): void {
    // 현재 온도에서 발생 가능한 환경 질병
    const environmentalDiseases = getEnvironmentalDiseases(this.currentTemperature);

    if (environmentalDiseases.length === 0) return;

    for (const disease of environmentalDiseases) {
      const config = DISEASE_CONFIGS.get(disease);
      if (!config) continue;

      // 각 생명체에게 환경 질병 감염 시도
      for (const organism of organisms) {
        if (!organism.isAlive) continue;
        if (organism.currentDisease !== null) continue;

        // 환경 질병은 낮은 확률로 자연 발생
        const baseChance = 0.001; // 0.1%
        const resistanceFactor = 1 - organism.genome.immunity * 0.5;

        if (Math.random() < baseChance * resistanceFactor) {
          organism.tryInfect(disease, currentTick);
        }
      }
    }
  }

  /**
   * 통계 업데이트
   */
  private updateStats(organisms: Organism[], currentTick: number): void {
    let infected = 0;
    let recovered = 0;
    const byType = new Map<DiseaseType, number>();

    for (const organism of organisms) {
      if (!organism.isAlive) continue;

      // 감염자 수
      if (organism.currentDisease !== null) {
        infected++;
        const current = byType.get(organism.currentDisease) || 0;
        byType.set(organism.currentDisease, current + 1);
      }

      // 면역 보유자 수 (회복자)
      for (const [, expiry] of organism.diseaseImmunities.entries()) {
        if (expiry > currentTick) {
          recovered++;
          break; // 하나라도 면역이 있으면 카운트
        }
      }
    }

    this.stats.totalInfected = infected;
    this.stats.totalRecovered = recovered;
    this.stats.infectionsByType = byType;
  }

  /**
   * 특정 질병 발생시키기 (재앙/이벤트용)
   */
  triggerOutbreak(
    disease: DiseaseType,
    organisms: Organism[],
    currentTick: number,
    infectionRate: number = 0.1,
    position?: { x: number; y: number },
    radius?: number
  ): number {
    let infectedCount = 0;

    for (const organism of organisms) {
      if (!organism.isAlive) continue;
      if (organism.currentDisease !== null) continue;

      // 위치 기반 필터 (지정된 경우)
      if (position && radius) {
        const dx = organism.x - position.x;
        const dy = organism.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;
      }

      // 감염 확률
      if (Math.random() < infectionRate) {
        if (organism.tryInfect(disease, currentTick)) {
          infectedCount++;
        }
      }
    }

    return infectedCount;
  }

  /**
   * 질병 통계 반환
   */
  getStats(): DiseaseStats {
    return { ...this.stats };
  }

  /**
   * 현재 감염자 수 반환
   */
  getInfectedCount(): number {
    return this.stats.totalInfected;
  }

  /**
   * 특정 질병의 감염자 수 반환
   */
  getInfectedCountByType(disease: DiseaseType): number {
    return this.stats.infectionsByType.get(disease) || 0;
  }

  /**
   * 전염 반경 설정
   */
  setTransmissionRadius(radius: number): void {
    this.transmissionRadius = radius;
  }

  /**
   * 통계 리셋
   */
  resetStats(): void {
    this.stats = {
      totalInfected: 0,
      totalRecovered: 0,
      deathsByDisease: 0,
      infectionsByType: new Map(),
    };
  }
}
