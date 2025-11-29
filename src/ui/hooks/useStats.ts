/**
 * useStats - 실시간 통계 업데이트 훅
 *
 * 시뮬레이션 통계를 React 상태로 관리합니다.
 */

import { useEffect, useState } from 'react';
import { useGame } from './useGame';

interface Stats {
  // 기본 통계
  organisms: number;
  food: number;
  births: number;
  deaths: number;
  avgEnergy: number;
  avgLifespan: number;
  maxPopulation: number;
  currentTick: number;
  currentYear: number;
  currentDay: number;
  fps: number;
  // 종류별 개체 수
  plantCount: number;
  animalCount: number;
  herbivoreCount: number;
  carnivoreCount: number;
  omnivoreCount: number;
  // Phase 5.2: 플랑크톤 통계
  phytoplanktonCount: number;
  zooplanktonCount: number;
  // 추가 통계
  generation: number;
  avgSpeed: number;
  avgSize: number;
  oldestAge: number;
  highestEnergy: number;
  // Phase 2: 다세포 통계
  multicellularCount: number;
  singleCellCount: number;
  // 원시 지구 환경 정보
  oxygen: number;
  carbonDioxide: number;
  temperature: number;
  era: string;
  eraDescription: string;
  canAnimalsSurvive: boolean;
  canMulticellularEvolve: boolean;
}

/**
 * 기본 통계 값
 */
const defaultStats: Stats = {
  organisms: 0,
  food: 0,
  births: 0,
  deaths: 0,
  avgEnergy: 0,
  avgLifespan: 0,
  maxPopulation: 0,
  currentTick: 0,
  currentYear: 0,
  currentDay: 0,
  fps: 0,
  // 종류별 개체 수
  plantCount: 0,
  animalCount: 0,
  herbivoreCount: 0,
  carnivoreCount: 0,
  omnivoreCount: 0,
  // Phase 5.2: 플랑크톤 통계
  phytoplanktonCount: 0,
  zooplanktonCount: 0,
  // 추가 통계
  generation: 0,
  avgSpeed: 0,
  avgSize: 0,
  oldestAge: 0,
  highestEnergy: 0,
  // Phase 2: 다세포 통계
  multicellularCount: 0,
  singleCellCount: 0,
  // 원시 지구 환경 정보
  oxygen: 0.001,
  carbonDioxide: 50000,
  temperature: 45,
  era: '명왕누대',
  eraDescription: '생명이 없는 불모의 세계',
  canAnimalsSurvive: false,
  canMulticellularEvolve: false,
};

export function useStats() {
  const { game, isReady } = useGame();
  const [stats, setStats] = useState<Stats>(defaultStats);

  useEffect(() => {
    if (!game || !isReady) return;

    // 통계 업데이트 함수
    const updateStats = () => {
      try {
        const simulation = game.getSimulation();
        const statistics = simulation.getStatistics(); // SimulationStats 객체
        const organismManager = simulation.getOrganismManager();
        const orgStats = organismManager?.getStatistics();

        // 원시 지구 환경 정보
        const envInfo = simulation.getEnvironmentInfo();

        // 틱을 년/일로 변환 (1년 = 365일, 1일 = 100틱)
        const ticksPerDay = 100;
        const daysPerYear = 365;
        const totalDays = Math.floor(statistics.tick / ticksPerDay);
        const years = Math.floor(totalDays / daysPerYear);
        const days = totalDays % daysPerYear;

        setStats({
          organisms: statistics.organismCount,
          food: statistics.foodCount,
          births: statistics.totalBirths,
          deaths: statistics.totalDeaths,
          avgEnergy: statistics.averageEnergy,
          avgLifespan: statistics.averageAge,
          maxPopulation: statistics.peakPopulation,
          currentTick: statistics.tick,
          currentYear: years,
          currentDay: days,
          fps: game.getFPS(),
          // 종류별 개체 수 (OrganismManager에서 가져옴)
          plantCount: orgStats?.plantCount ?? 0,
          animalCount: orgStats?.animalCount ?? 0,
          herbivoreCount: orgStats?.herbivoreCount ?? 0,
          carnivoreCount: orgStats?.carnivoreCount ?? 0,
          omnivoreCount: orgStats?.omnivoreCount ?? 0,
          // Phase 5.2: 플랑크톤 통계
          phytoplanktonCount: orgStats?.phytoplanktonCount ?? 0,
          zooplanktonCount: orgStats?.zooplanktonCount ?? 0,
          // 추가 통계
          generation: orgStats?.generation ?? 0,
          avgSpeed: orgStats?.averageSpeed ?? 0,
          avgSize: orgStats?.averageSize ?? 0,
          oldestAge: orgStats?.oldestAge ?? 0,
          highestEnergy: orgStats?.highestEnergy ?? 0,
          // Phase 2: 다세포 통계
          multicellularCount: orgStats?.multicellularCount ?? 0,
          singleCellCount: orgStats?.singleCellCount ?? 0,
          // 원시 지구 환경 정보
          oxygen: envInfo.oxygen,
          carbonDioxide: envInfo.carbonDioxide,
          temperature: envInfo.temperature,
          era: envInfo.era,
          eraDescription: envInfo.eraDescription,
          canAnimalsSurvive: envInfo.canAnimalsSurvive,
          canMulticellularEvolve: envInfo.canMulticellularEvolve,
        });
      } catch (error) {
        // 게임이 아직 초기화되지 않은 경우 무시
        console.warn('통계 업데이트 실패:', error);
      }
    };

    // 초기 업데이트
    updateStats();

    // 주기적 업데이트 (500ms마다)
    const interval = setInterval(updateStats, 500);

    return () => {
      clearInterval(interval);
    };
  }, [game, isReady]);

  return stats;
}
