export interface TierInfo {
  tier: number;
  name: string;
  radius: number;
  color: string;
  accent: string;
  glow: number;
  density: number;
  rings?: boolean;
  pulse?: boolean;
  supernova?: boolean;
  blackhole?: boolean;
  gravity?: number;
  gravityRadius?: number;
  orbitBonus?: boolean;
}

export const TIERS: readonly (TierInfo | null)[] = [
  null,
  { tier: 1,  name: '우주먼지',  radius: 17,  color: '#dfe9ff', accent: '#7aa4ff', glow: 0.15, density: 0.0012 },
  { tier: 2,  name: '가스구름',  radius: 23,  color: '#a8c0ff', accent: '#5b7ddc', glow: 0.25, density: 0.0014 },
  { tier: 3,  name: '운석',      radius: 30,  color: '#9b8772', accent: '#5e4d3c', glow: 0.0,  density: 0.0018 },
  { tier: 4,  name: '소행성',    radius: 38,  color: '#7a6859', accent: '#3a2f24', glow: 0.0,  density: 0.0022 },
  { tier: 5,  name: '위성',      radius: 48,  color: '#d6caa8', accent: '#7e6f4f', glow: 0.1,  density: 0.0024, orbitBonus: true },
  { tier: 6,  name: '행성',      radius: 58,  color: '#3fa1ff', accent: '#1b4ea0', glow: 0.55, density: 0.0026 },
  { tier: 7,  name: '거대행성',  radius: 70,  color: '#e6a25f', accent: '#7b4621', glow: 0.7,  density: 0.0028, rings: true },
  { tier: 8,  name: '항성',      radius: 82,  color: '#ffd96b', accent: '#ff8e3a', glow: 1.4,  density: 0.0030, gravity: 0.045,  gravityRadius: 240 },
  { tier: 9,  name: '적색거성',  radius: 96,  color: '#ff5e3a', accent: '#8e1a0f', glow: 1.8,  density: 0.0032, gravity: 0.090,  gravityRadius: 300, pulse: true },
  { tier: 10, name: '초신성',    radius: 110, color: '#ffffff', accent: '#ffe25a', glow: 2.5,  density: 0.0036, gravity: 0.130,  gravityRadius: 340, supernova: true },
  { tier: 11, name: '블랙홀',    radius: 84,  color: '#02020a', accent: '#7f4dff', glow: 3.0,  density: 0.010,                                       blackhole: true }
];

export const MAX_TIER = 11;
export const DROP_TIER_MAX = 3;

export function tierInfo(tier: number): TierInfo {
  const info = TIERS[tier];
  if (!info) throw new Error(`Invalid tier: ${tier}`);
  return info;
}
