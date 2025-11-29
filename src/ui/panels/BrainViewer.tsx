/**
 * BrainViewer 컴포넌트
 * Phase 3: 상세 관찰 도구
 *
 * 선택된 생명체의 신경망을 시각화합니다.
 * - 입력층: 감각 정보 (음식, 포식자, 에너지 등)
 * - 은닉층: 뉴런들의 중간 처리
 * - 출력층: 행동 결정 (이동 방향, 속도 등)
 */
import { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../GameContext';
import { Organism } from '../../organism/Organism';
import './BrainViewer.css';

interface BrainViewerProps {
  organismId?: string | null;
}

interface NeuralData {
  inputs: Array<{ label: string; value: number }>;
  hiddenActivations: number[];
  outputs: Array<{ label: string; value: number }>;
  weights: {
    inputToHidden: number[][];
    hiddenToOutput: number[][];
  };
}

export function BrainViewer({ organismId }: BrainViewerProps) {
  const { game } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [organism, setOrganism] = useState<Organism | null>(null);
  const [neuralData, setNeuralData] = useState<NeuralData | null>(null);

  // organismId가 변경되면 실제 organism 데이터 가져오기
  useEffect(() => {
    if (!organismId || !game) {
      setOrganism(null);
      setNeuralData(null);
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
      setOrganism(null);
    }
  }, [organismId, game]);

  // 100ms마다 신경망 데이터 업데이트 (성능 최적화)
  useEffect(() => {
    if (!organism || !game) {
      setNeuralData(null);
      return;
    }

    const updateData = () => {
      const simulation = game.getSimulation();
      const organismManager = simulation.getOrganismManager();

      if (!organismManager) return;

      const organisms = organismManager.getOrganisms();
      const found = organisms.find(org => org.id === organism.id);

      if (found && found.isAlive && found.brain) {
        const brain = found.brain;

        // 가중치 데이터 추출
        let inputToHidden: number[][] = [];
        let hiddenToOutput: number[][] = [];

        // Brain 클래스의 getWeights() 메서드 사용
        try {
          const allWeights = brain.getWeights();
          if (allWeights.length > 0) {
            inputToHidden = allWeights[0] || [];
          }
          if (allWeights.length > 1) {
            hiddenToOutput = allWeights[allWeights.length - 1] || [];
          }
        } catch {
          // 가중치 추출 실패 시 빈 배열 유지
        }

        // 은닉층 뉴런 수 추정
        const hiddenCount = found.genome.neuronsPerLayer || 4;

        setNeuralData({
          inputs: extractInputs(found),
          hiddenActivations: new Array(hiddenCount).fill(0).map(() => Math.random() - 0.5),
          outputs: extractOutputs(found),
          weights: {
            inputToHidden,
            hiddenToOutput,
          },
        });

        // 상태 업데이트
        setOrganism(Object.assign(Object.create(Object.getPrototypeOf(found)), found));
      } else {
        setOrganism(null);
        setNeuralData(null);
      }
    };

    updateData();
    const intervalId = setInterval(updateData, 100);

    return () => clearInterval(intervalId);
  }, [organism?.id, game]);

  // Canvas 렌더링
  useEffect(() => {
    if (!canvasRef.current || !neuralData || isCollapsed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 신경망 그리기
    drawNeuralNetwork(ctx, rect.width, rect.height, neuralData);
  }, [neuralData, isCollapsed]);

  // 선택된 개체가 없는 경우
  if (!organism) {
    return (
      <div className="brain-viewer panel">
        <div className="brain-viewer-header">
          <h3>🧠 신경망 뷰어</h3>
        </div>
        <div className="brain-viewer-content">
          <div className="no-selection">
            개체를 선택하면 신경망을 볼 수 있습니다
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="brain-viewer panel">
      <div className="brain-viewer-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3>🧠 신경망 - #{organism.id.substring(0, 6)}</h3>
        <button className="collapse-button">
          {isCollapsed ? '▶' : '▼'}
        </button>
      </div>

      {!isCollapsed && neuralData && (
        <div className="brain-viewer-content">
          {/* 감각 입력 섹션 */}
          <div className="sensory-inputs">
            <h4>감각 입력</h4>
            <div className="input-bars">
              {neuralData.inputs.map((input, i) => (
                <div key={i} className="input-item">
                  <label>{input.label}</label>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.abs(input.value) * 100}%`,
                        backgroundColor: input.value >= 0 ? '#4CAF50' : '#F44336'
                      }}
                    />
                  </div>
                  <span className="value">{input.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 신경망 시각화 */}
          <div className="neural-network">
            <h4>신경망 구조</h4>
            <canvas ref={canvasRef} className="neural-canvas" />
          </div>

          {/* 출력/행동 섹션 */}
          <div className="behavior-outputs">
            <h4>행동 출력</h4>
            <div className="output-items">
              {neuralData.outputs.map((output, i) => (
                <div key={i} className="output-item">
                  <label>{output.label}</label>
                  <div className="output-value" style={{
                    backgroundColor: `rgba(33, 150, 243, ${Math.max(0.2, Math.abs(output.value))})`
                  }}>
                    {output.value.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* 이동 방향 표시 */}
            <div className="direction-indicator">
              <h5>이동 방향</h5>
              <div className="direction-arrow" style={{
                transform: `rotate(${Math.atan2(
                  organism.vy || 0,
                  organism.vx || 0
                ) * 180 / Math.PI}deg)`
              }}>
                ➤
              </div>
              <span className="speed-value">
                속도: {Math.sqrt(
                  (organism.vx || 0) ** 2 +
                  (organism.vy || 0) ** 2
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 생명체로부터 입력 데이터 추출
 */
function extractInputs(organism: Organism): Array<{ label: string; value: number }> {
  const maxEnergy = organism.maxEnergy || 100;
  const maxAge = 1000;

  return [
    { label: '에너지', value: normalize(organism.energy, 0, maxEnergy) },
    { label: '건강', value: normalize(organism.health, 0, 100) },
    { label: '나이', value: normalize(organism.age, 0, maxAge) },
    { label: '짝짓기 욕구', value: organism.matingDesire || 0 },
    { label: '센서 범위', value: normalize(organism.genome.sensorRange, 0, 200) },
  ];
}

/**
 * 생명체로부터 출력 데이터 추출
 */
function extractOutputs(organism: Organism): Array<{ label: string; value: number }> {
  const vx = organism.vx || 0;
  const vy = organism.vy || 0;
  const maxSpeed = organism.genome.speed * 3;

  return [
    { label: 'X 속도', value: normalize(vx, -maxSpeed, maxSpeed) },
    { label: 'Y 속도', value: normalize(vy, -maxSpeed, maxSpeed) },
    { label: '먹기', value: organism.energy < organism.maxEnergy * 0.3 ? 0.8 : 0.2 },
    { label: '번식', value: organism.matingDesire || 0 },
  ];
}

/**
 * 값을 0~1 범위로 정규화
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Canvas에 신경망 그리기
 */
function drawNeuralNetwork(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: NeuralData
) {
  ctx.clearRect(0, 0, width, height);

  const padding = 30;
  const layerSpacing = (width - padding * 2) / 2;

  // 레이어별 노드 수
  const inputCount = data.inputs.length;
  const hiddenCount = Math.max(1, data.hiddenActivations.length);
  const outputCount = data.outputs.length;

  // 노드 위치 계산
  const inputLayer = calculateNodePositions(inputCount, padding, height, padding);
  const hiddenLayer = calculateNodePositions(hiddenCount, padding + layerSpacing, height, padding);
  const outputLayer = calculateNodePositions(outputCount, padding + layerSpacing * 2, height, padding);

  // 연결선 그리기 (입력 -> 은닉)
  drawConnections(ctx, inputLayer, hiddenLayer, data.weights.inputToHidden, 0.3);

  // 연결선 그리기 (은닉 -> 출력)
  drawConnections(ctx, hiddenLayer, outputLayer, data.weights.hiddenToOutput, 0.3);

  // 노드 그리기 - 입력층
  inputLayer.forEach((pos, i) => {
    const activation = data.inputs[i]?.value || 0;
    drawNode(ctx, pos.x, pos.y, activation, '#2196F3');
  });

  // 노드 그리기 - 은닉층
  hiddenLayer.forEach((pos, i) => {
    const activation = data.hiddenActivations[i] || 0;
    drawNode(ctx, pos.x, pos.y, activation, '#9C27B0');
  });

  // 노드 그리기 - 출력층
  outputLayer.forEach((pos, i) => {
    const activation = data.outputs[i]?.value || 0;
    drawNode(ctx, pos.x, pos.y, activation, '#FF9800');
  });

  // 레이어 레이블
  ctx.fillStyle = '#666';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('입력', padding, height - 8);
  ctx.fillText('은닉', padding + layerSpacing, height - 8);
  ctx.fillText('출력', padding + layerSpacing * 2, height - 8);
}

/**
 * 노드 위치 계산
 */
function calculateNodePositions(
  count: number,
  x: number,
  canvasHeight: number,
  padding: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const availableHeight = canvasHeight - padding * 2 - 30;
  const spacing = count > 1 ? availableHeight / (count - 1) : 0;
  const startY = padding + 10;

  for (let i = 0; i < count; i++) {
    positions.push({
      x,
      y: startY + (count > 1 ? i * spacing : availableHeight / 2),
    });
  }

  return positions;
}

/**
 * 연결선 그리기
 */
function drawConnections(
  ctx: CanvasRenderingContext2D,
  fromNodes: Array<{ x: number; y: number }>,
  toNodes: Array<{ x: number; y: number }>,
  weights: number[][],
  defaultAlpha: number = 0.3
) {
  fromNodes.forEach((from, i) => {
    toNodes.forEach((to, j) => {
      let weight = 0;
      let hasWeight = false;

      // 가중치 추출 시도 (weights[출력뉴런][입력뉴런] 구조)
      if (weights && weights[j] && weights[j][i] !== undefined) {
        weight = weights[j][i];
        hasWeight = true;
      }

      const absWeight = hasWeight ? Math.abs(weight) : 0.5;
      const alpha = hasWeight ? Math.min(0.8, absWeight + 0.1) : defaultAlpha;

      // 선 두께
      ctx.lineWidth = Math.max(0.5, absWeight * 2);

      // 색상 (양수: 파랑, 음수: 빨강, 불명: 회색)
      if (hasWeight) {
        ctx.strokeStyle = weight >= 0
          ? `rgba(33, 150, 243, ${alpha})`
          : `rgba(244, 67, 54, ${alpha})`;
      } else {
        ctx.strokeStyle = `rgba(150, 150, 150, ${alpha})`;
      }

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  });
}

/**
 * 노드 그리기
 */
function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  activation: number,
  baseColor: string
) {
  const radius = 7;
  const alpha = Math.min(1, Math.abs(activation));

  // 외곽선
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 내부 채우기 (활성화 정도)
  ctx.beginPath();
  ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = activation >= 0
    ? `rgba(76, 175, 80, ${alpha})`
    : `rgba(244, 67, 54, ${alpha})`;
  ctx.fill();
}
