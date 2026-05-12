import 'matter-js';

declare module 'matter-js' {
  namespace Matter {
    interface Body {
      tier?: number;
      _merged?: boolean;
      _spawnT?: number;
      _phaseActive?: boolean;
    }
  }
}
