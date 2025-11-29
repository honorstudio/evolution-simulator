/**
 * 렌더링에 사용되는 색상 팔레트
 * 자연 다큐멘터리 톤의 사실적인 색상 구성
 */

// 바이옴별 색상 (16진수)
export const BIOME_COLORS: Record<string, number> = {
  // 물 바이옴
  deep_ocean: 0x1a3a5c,    // 깊은 바다 (짙은 남색)
  ocean: 0x2d5a7b,         // 바다 (청색)
  beach: 0xc2b280,         // 해변 (모래색)
  lake: 0x4fc3f7,          // 호수 (밝은 청색)
  river: 0x29b6f6,         // 강 (하늘색)

  // 육지 바이옴
  desert: 0xd4a574,        // 사막 (황토색)
  grassland: 0x7cb342,     // 초원 (연두색)
  savanna: 0xc5a93a,       // 사바나 (황금색)
  forest: 0x2e7d32,        // 숲 (녹색)
  rainforest: 0x1b5e20,    // 열대우림 (진한 녹색)
  swamp: 0x558b2f,         // 습지 (올리브색)

  // 극한 지형
  tundra: 0x90a4ae,        // 툰드라 (회청색)
  snow: 0xeceff1,          // 눈 (흰색)
  mountain: 0x5d4037,      // 산 (갈색)
  rocky: 0x78909c,         // 바위 (회색)
  volcanic: 0x37474f,      // 화산 (짙은 회색)

  // 대문자 버전 (하위 호환성)
  DEEP_OCEAN: 0x1a3a5c,
  OCEAN: 0x2d5a7b,
  BEACH: 0xc2b280,
  LAKE: 0x4fc3f7,
  RIVER: 0x29b6f6,
  DESERT: 0xd4a574,
  GRASSLAND: 0x7cb342,
  SAVANNA: 0xc5a93a,
  FOREST: 0x2e7d32,
  RAINFOREST: 0x1b5e20,
  SWAMP: 0x558b2f,
  TUNDRA: 0x90a4ae,
  SNOW: 0xeceff1,
  MOUNTAIN: 0x5d4037,
  ROCKY: 0x78909c,
  VOLCANIC: 0x37474f,
};

// 생물체 기본 색상
export const ORGANISM_COLORS = {
  DEFAULT: 0x8bc34a,       // 기본 녹색
  HERBIVORE: 0x66bb6a,     // 초식동물 - 연한 녹색
  CARNIVORE: 0xe53935,     // 육식동물 - 붉은색
  OMNIVORE: 0xffa726,      // 잡식동물 - 주황색
  PLANT: 0x2e7d32,         // 식물 - 진한 녹색
};

// UI 색상
export const UI_COLORS = {
  BACKGROUND: 0x1a1a2e,    // 배경
  PANEL: 0x16213e,         // 패널
  BORDER: 0x0f3460,        // 테두리
  TEXT: 0xe4e4e4,          // 텍스트
  ACCENT: 0x00d9ff,        // 강조색
  SUCCESS: 0x4caf50,       // 성공
  WARNING: 0xff9800,       // 경고
  ERROR: 0xf44336,         // 오류
};

// 고도에 따른 색상 틴트 계산
export function getElevationTint(elevation: number): number {
  // elevation: -1.0 (깊은 바다) ~ 1.0 (높은 산)
  // 어두운 색 (0.3) ~ 밝은 색 (1.0)
  const brightness = 0.3 + (elevation + 1) * 0.35;
  const clampedBrightness = Math.min(1, Math.max(0, brightness));
  const value = Math.floor(clampedBrightness * 255);
  return (value << 16) | (value << 8) | value;
}

// HSL을 16진수 색상으로 변환
export function hslToHex(h: number, s: number, l: number): number {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  const r = f(0);
  const g = f(8);
  const b = f(4);
  return (r << 16) | (g << 8) | b;
}

// RGB를 HSL로 변환 (유전자 변형에 사용)
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// 16진수 색상을 RGB로 변환
export function hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

/**
 * 생명체의 색상을 가져옵니다.
 * genome의 HSL 값을 사용하여 16진수 색상 반환
 */
export function getOrganismColor(organism: { genome: { hue: number; saturation: number; lightness: number } }): number {
  return hslToHex(
    organism.genome.hue,
    organism.genome.saturation,
    organism.genome.lightness
  );
}
