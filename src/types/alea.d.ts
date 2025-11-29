/**
 * alea PRNG 타입 선언
 */
declare module 'alea' {
  interface AleaPRNG {
    (): number;
    uint32(): number;
    fract53(): number;
    exportState(): number[];
    importState(state: number[]): void;
  }

  function alea(seed?: string | number): AleaPRNG;

  export = alea;
}
