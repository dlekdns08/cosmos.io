export interface Theme {
  id: string;
  name: string;
  bgInner: string;
  bgOuter: string;
  star: string;
  accent: string;
  accentSoft: string;
}

export const THEMES: Record<string, Theme> = {
  default: {
    id: 'default',
    name: '기본',
    bgInner: '#0d1234',
    bgOuter: '#03040e',
    star: 'rgba(255,255,255,1)',
    accent: '#7f4dff',
    accentSoft: 'rgba(127,77,255,0.15)',
  },
  andromeda: {
    id: 'andromeda',
    name: '안드로메다',
    bgInner: '#0e2030',
    bgOuter: '#03101a',
    star: 'rgba(190,255,240,1)',
    accent: '#42e6c3',
    accentSoft: 'rgba(66,230,195,0.18)',
  },
  karmanian: {
    id: 'karmanian',
    name: '카르마니안',
    bgInner: '#26120a',
    bgOuter: '#0a0303',
    star: 'rgba(255,220,150,1)',
    accent: '#d6a35a',
    accentSoft: 'rgba(214,163,90,0.18)',
  },
  meteorShower: {
    id: 'meteorShower',
    name: '유성우',
    bgInner: '#18112a',
    bgOuter: '#080510',
    star: 'rgba(255,180,255,1)',
    accent: '#ff66cc',
    accentSoft: 'rgba(255,102,204,0.18)',
  },
};

export function getTheme(id: string): Theme {
  return THEMES[id] ?? THEMES.default;
}
