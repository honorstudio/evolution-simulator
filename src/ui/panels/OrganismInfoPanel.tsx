/**
 * OrganismInfoPanel - 개체 정보 패널
 *
 * 선택된 개체의 상세 정보를 표시합니다.
 */

import { useEffect, useState } from 'react';
import { useGameContext } from '../GameContext';
import { Organism } from '../../organism/Organism';
import './OrganismInfoPanel.css';

interface OrganismInfoPanelProps {
  organismId?: string | null;
}

export function OrganismInfoPanel({ organismId }: OrganismInfoPanelProps) {
  const { game } = useGameContext();
  const [organism, setOrganism] = useState<Organism | null>(null);

  // organismId가 변경되면 실제 organism 데이터 가져오기
  useEffect(() => {
    if (!organismId || !game) {
      setOrganism(null);
      return;
    }

    const simulation = game.getSimulation();
    const organismManager = simulation.getOrganismManager();

    if (!organismManager) {
      setOrganism(null);
      return;
    }

    const organisms = organismManager.getOrganisms();
    const found = organisms.find(org => org.id === organismId);

    if (found && found.isAlive) {
      setOrganism(found);
    } else {
      // 생명체가 죽었거나 없으면 선택 해제
      setOrganism(null);
    }
  }, [organismId, game]);

  // 매 프레임 데이터 업데이트 (생명체가 선택되어 있을 때만)
  useEffect(() => {
    if (!organism || !game) return;

    const interval = setInterval(() => {
      const simulation = game.getSimulation();
      const organismManager = simulation.getOrganismManager();

      if (!organismManager) return;

      const organisms = organismManager.getOrganisms();
      const found = organisms.find(org => org.id === organism.id);

      if (found && found.isAlive) {
        // 상태 업데이트를 위해 새 객체 참조 생성
        setOrganism(Object.assign(Object.create(Object.getPrototypeOf(found)), found));
      } else {
        // 생명체가 죽었으면 선택 해제
        setOrganism(null);
      }
    }, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [organism?.id, game]);

  // 아직 선택된 개체가 없는 경우
  if (!organism) {
    return (
      <div className="organism-info-panel panel">
        <h3>🔬 개체 정보</h3>
        <div className="no-selection">
          <p>개체를 클릭하여 정보를 확인하세요</p>
        </div>
      </div>
    );
  }

  // 에너지 퍼센트 계산
  const energyPercent = Math.round((organism.energy / organism.maxEnergy) * 100);
  const healthPercent = Math.round(organism.health);

  // Kingdom/Diet 한글 변환
  const getKingdomLabel = (kingdom: string) => {
    switch (kingdom) {
      case 'plant': return '식물';
      case 'animal': return '동물';
      default: return '미분화';
    }
  };

  const getDietLabel = (diet: string) => {
    switch (diet) {
      case 'herbivore': return '초식';
      case 'carnivore': return '육식';
      case 'omnivore': return '잡식';
      case 'photosynthetic': return '광합성';
      default: return '미정';
    }
  };

  const getSexLabel = (sex: string) => {
    switch (sex) {
      case 'male': return '수컷';
      case 'female': return '암컷';
      case 'hermaphrodite': return '자웅동체';
      default: return '미정';
    }
  };

  return (
    <div className="organism-info-panel panel">
      <h3>🔬 개체 #{organism.id.substring(0, 6)}</h3>

      {/* 분류 정보 */}
      <div className="classification-badges">
        <span className={`badge ${organism.genome.kingdom}`}>
          {getKingdomLabel(organism.genome.kingdom)}
        </span>
        <span className={`badge ${organism.genome.diet}`}>
          {getDietLabel(organism.genome.diet)}
        </span>
        {organism.isMulticellular() && (
          <span className="badge multicellular">다세포</span>
        )}
      </div>

      {/* 에너지 바 */}
      <div className="energy-section">
        <div className="energy-label">
          <span>에너지</span>
          <span>{energyPercent}%</span>
        </div>
        <div className="energy-bar">
          <div
            className="energy-fill"
            style={{ width: `${energyPercent}%` }}
          />
        </div>
      </div>

      {/* 건강 바 */}
      <div className="energy-section">
        <div className="energy-label">
          <span>건강</span>
          <span>{healthPercent}%</span>
        </div>
        <div className="health-bar">
          <div
            className="health-fill"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="info-section">
        <div className="info-row">
          <span className="info-label">나이</span>
          <span className="info-value">{Math.round(organism.age)} 틱</span>
        </div>
        <div className="info-row">
          <span className="info-label">세대</span>
          <span className="info-value">{organism.generation}</span>
        </div>
        <div className="info-row">
          <span className="info-label">위치</span>
          <span className="info-value">
            ({Math.round(organism.x)}, {Math.round(organism.y)})
          </span>
        </div>
        {organism.isMulticellular() && (
          <div className="info-row">
            <span className="info-label">세포 수</span>
            <span className="info-value">{organism.getCellCount()}</span>
          </div>
        )}
      </div>

      {/* 성선택 정보 */}
      <div className="info-section">
        <h4>성선택</h4>
        <div className="info-row">
          <span className="info-label">성별</span>
          <span className="info-value">{getSexLabel(organism.sex)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">매력도</span>
          <span className="info-value">{(organism.attractiveness * 100).toFixed(0)}%</span>
        </div>
        <div className="info-row">
          <span className="info-label">짝짓기 욕구</span>
          <span className="info-value">{(organism.matingDesire * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* 유전자 정보 */}
      <div className="info-section">
        <h4>유전자</h4>
        <div className="info-row">
          <span className="info-label">크기</span>
          <span className="info-value">{organism.genome.size.toFixed(2)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">속도</span>
          <span className="info-value">{organism.genome.speed.toFixed(2)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">센서 범위</span>
          <span className="info-value">{Math.round(organism.genome.sensorRange)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">대사율</span>
          <span className="info-value">{organism.genome.metabolism.toFixed(2)}</span>
        </div>
      </div>

      {/* 뇌 정보 */}
      <div className="info-section">
        <h4>뇌</h4>
        <div className="info-row">
          <span className="info-label">은닉층</span>
          <span className="info-value">{organism.genome.hiddenLayers}</span>
        </div>
        <div className="info-row">
          <span className="info-label">뉴런/층</span>
          <span className="info-value">{organism.genome.neuronsPerLayer}</span>
        </div>
      </div>
    </div>
  );
}
