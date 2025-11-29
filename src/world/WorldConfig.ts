/**
 * 월드 설정 상수
 * 세계의 기본 크기와 청크 정보를 정의합니다
 *
 * 실제 지구 비율의 대륙 규모 시뮬레이션을 위해
 * 32,000 x 24,000 픽셀 크기의 월드를 사용합니다. (4배 확대)
 * 너무 크면 메모리 문제 발생, 적절한 크기로 조정
 */

export const WORLD_CONFIG = {
  // 월드의 가로 너비 (픽셀) - 대륙 규모 (4배 확대)
  width: 32000,

  // 월드의 세로 높이 (픽셀) - 대륙 규모 (4배 확대)
  height: 24000,

  // 한 청크의 크기 (한 청크는 chunkSize x chunkSize 타일로 구성)
  chunkSize: 100,
};

// 노이즈 파라미터 설정
// 월드 크기 32000x24000에 맞춰 주파수 조정 (4배 작게)
export const NOISE_CONFIG = {
  // 고도 맵 생성용
  elevation: {
    // 기본 주파수 (낮을수록 넓은 지형)
    // 월드 4배 확대로 0.005 → 0.00125로 조정
    baseFrequency: 0.00125,
    // 옥타브 개수 (디테일 수준, 많을수록 복잡함)
    octaves: 6,
    // 진폭 감소율 (0~1, 높을수록 거친 지형)
    persistence: 0.5,
    // 주파수 증가율 (일반적으로 2.0)
    lacunarity: 2.0,
  },

  // 습도 맵 생성용
  moisture: {
    baseFrequency: 0.001,
    octaves: 5,
    persistence: 0.5,
    lacunarity: 2.0,
  },
};
