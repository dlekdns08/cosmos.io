/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace Matter {
  interface Body {
    tier?: number;
    _merged?: boolean;
    _spawnT?: number;
    _phaseActive?: boolean;
    _orbitUntil?: number;
    _slingshotUntil?: number;
    _chargeMod?: 'charged' | 'slow' | 'attract' | null;
    _anchorY?: number;
  }
}
