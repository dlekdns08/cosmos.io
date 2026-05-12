declare namespace Matter {
  interface Body {
    tier?: number;
    _merged?: boolean;
    _spawnT?: number;
    _phaseActive?: boolean;
    _orbitUntil?: number;
    _slingshotUntil?: number;
    _chargeMod?: 'charged' | 'slow' | 'attract' | null;
  }
}
