/**
 * 월드 설정
 * 세계의 기본 크기와 청크 정보를 정의합니다
 *
 * 월드 크기 프리셋:
 * - small: 8000 x 6000 (1/4 크기) - 저사양 PC/모바일
 * - medium: 16000 x 12000 (1/2 크기) - 중간 사양
 * - large: 32000 x 24000 (최대 크기) - 고사양 PC
 */

// 월드 크기 프리셋 정의
export const WORLD_SIZE_PRESETS = {
  small: { width: 8000, height: 6000, label: '작음 (8K x 6K)', description: '빠른 로딩, 저사양 권장' },
  medium: { width: 16000, height: 12000, label: '중간 (16K x 12K)', description: '균형잡힌 크기' },
  large: { width: 32000, height: 24000, label: '큼 (32K x 24K)', description: '대륙 규모, 고사양 필요' },
} as const;

export type WorldSizePreset = keyof typeof WORLD_SIZE_PRESETS;

// 기본 월드 설정 (small이 기본값)
export const WORLD_CONFIG: {
  width: number;
  height: number;
  chunkSize: number;
} = {
  // 월드의 가로 너비 (픽셀) - 기본값 small
  width: WORLD_SIZE_PRESETS.small.width,

  // 월드의 세로 높이 (픽셀) - 기본값 small
  height: WORLD_SIZE_PRESETS.small.height,

  // 한 청크의 크기 (한 청크는 chunkSize x chunkSize 타일로 구성)
  chunkSize: 100,
};

// 월드 설정을 동적으로 변경하는 함수
export function setWorldSize(preset: WorldSizePreset): void {
  const size = WORLD_SIZE_PRESETS[preset];
  WORLD_CONFIG.width = size.width;
  WORLD_CONFIG.height = size.height;
}

// 커스텀 크기 설정
export function setCustomWorldSize(width: number, height: number): void {
  WORLD_CONFIG.width = width;
  WORLD_CONFIG.height = height;
}

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
