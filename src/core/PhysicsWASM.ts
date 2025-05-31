export type PhysicsExports = {
  integrate_position: (x: number, vx: number, dt: number) => number;
  integrate_velocity: (v: number, a: number, dt: number) => number;
  detect_collision: (
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) => number;
};

let wasm: PhysicsExports | null = null;

const fallback = {
  integrate_position: (x: number, vx: number, dt: number) => x + vx * dt,
  integrate_velocity: (v: number, a: number, dt: number) => v + a * dt,
  detect_collision: (
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) => (ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by ? 1 : 0),
};

export async function initPhysicsWASM(): Promise<void> {
  try {
    const response = await fetch('/physics_wasm.wasm');
    if (!response.ok) throw new Error('Failed to fetch wasm');
    const bytes = await response.arrayBuffer();
    const result = await WebAssembly.instantiate(bytes, {});
    wasm = result.instance.exports as unknown as PhysicsExports;
  } catch (err) {
    console.warn('Physics WASM failed to load, falling back to JS', err);
    wasm = null;
  }
}

export const integratePosition = (
  x: number,
  vx: number,
  dt: number
): number => (wasm ? wasm.integrate_position(x, vx, dt) : fallback.integrate_position(x, vx, dt));

export const integrateVelocity = (
  v: number,
  a: number,
  dt: number
): number => (wasm ? wasm.integrate_velocity(v, a, dt) : fallback.integrate_velocity(v, a, dt));

export const detectCollision = (
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean =>
  (wasm ? wasm.detect_collision(ax, ay, aw, ah, bx, by, bw, bh) : fallback.detect_collision(ax, ay, aw, ah, bx, by, bw, bh)) === 1;
