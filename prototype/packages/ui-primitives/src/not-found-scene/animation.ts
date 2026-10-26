import { brandMarkPath } from '@reinforce/ui-primitives/brand';

const BRAND_VIEWBOX_SIZE = 512;
const SPRING = 0.02;
const DAMPING = 0.86;
const REPULSE_FORCE = 1.35;
const SETTLE_EPS = 0.08;
const GRID_DESKTOP = 64;
const GRID_MOBILE = 44;
const AMBER_EVERY = 20;
const MAX_TILT_DEG = 6;
const TILT_LERP = 0.08;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hx: number;
  hy: number;
  size: number;
  paletteIndex: number;
};

const paletteVars = [
  '--palette-blue-400',
  '--palette-blue-500',
  '--palette-blue-600',
  '--palette-amber-400',
] as const;

function resolvePalette(el: HTMLElement): string[] {
  const styles = getComputedStyle(el);
  return paletteVars.map((v) => styles.getPropertyValue(v).trim() || 'currentColor');
}

function paletteIndexFor(index: number): number {
  if (index % AMBER_EVERY === 0) return 3;
  return index % 3;
}

function sampleMarkTargets(sizePx: number, grid: number): Array<{ x: number; y: number }> {
  const probe = document.createElement('canvas');
  probe.width = grid;
  probe.height = grid;
  const ctx = probe.getContext('2d');
  if (!ctx) return [];
  ctx.scale(grid / BRAND_VIEWBOX_SIZE, grid / BRAND_VIEWBOX_SIZE);
  ctx.fill(new Path2D(brandMarkPath));
  const data = ctx.getImageData(0, 0, grid, grid).data;
  const cell = sizePx / grid;
  const targets: Array<{ x: number; y: number }> = [];
  for (let gy = 0; gy < grid; gy += 1) {
    for (let gx = 0; gx < grid; gx += 1) {
      const alpha = data[(gy * grid + gx) * 4 + 3];
      if (alpha !== undefined && alpha > 128) {
        targets.push({ x: (gx + 0.5) * cell, y: (gy + 0.5) * cell });
      }
    }
  }
  return targets;
}

function buildParticles(
  targets: Array<{ x: number; y: number }>,
  sizePx: number,
  dpr: number,
  atHome: boolean,
): Particle[] {
  return targets.map((t, i) => ({
    x: atHome ? t.x : Math.random() * sizePx,
    y: atHome ? t.y : Math.random() * sizePx,
    vx: atHome ? 0 : (Math.random() - 0.5) * 6,
    vy: atHome ? 0 : (Math.random() - 0.5) * 6,
    hx: t.x,
    hy: t.y,
    size: (0.9 + Math.random() * 0.9) * dpr,
    paletteIndex: paletteIndexFor(i),
  }));
}

export function mountNotFoundScene(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-nfs-canvas]');
  const fallback = root.querySelector<SVGElement>('[data-nfs-fallback]');
  const plane = root.querySelector<HTMLElement>('[data-nfs-plane]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return () => {};

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');

  let palette = resolvePalette(canvas);
  let particles: Particle[] = [];
  let deviceSize = 0;
  let dpr = 1;
  let assembled = false;
  let rafId = 0;
  let running = false;
  let cursor: { x: number; y: number } | null = null;
  let tiltTarget = { x: 0, y: 0 };
  let tilt = { x: 0, y: 0 };

  const rebuild = (atHome: boolean) => {
    const cssSize = canvas.clientWidth;
    if (cssSize === 0) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    deviceSize = Math.round(cssSize * dpr);
    canvas.width = deviceSize;
    canvas.height = deviceSize;
    const grid = coarsePointer.matches ? GRID_MOBILE : GRID_DESKTOP;
    particles = buildParticles(sampleMarkTargets(deviceSize, grid), deviceSize, dpr, atHome);
    if (fallback) fallback.style.visibility = 'hidden';
  };

  const draw = () => {
    ctx.clearRect(0, 0, deviceSize, deviceSize);
    for (let colorIndex = 0; colorIndex < palette.length; colorIndex += 1) {
      const color = palette[colorIndex];
      if (color === undefined) continue;
      ctx.fillStyle = color;
      for (const p of particles) {
        if (p.paletteIndex === colorIndex) ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
  };

  const drawSettled = () => {
    for (const p of particles) {
      p.x = p.hx;
      p.y = p.hy;
      p.vx = 0;
      p.vy = 0;
    }
    assembled = true;
    draw();
  };

  const step = (): boolean => {
    const repulseRadius = deviceSize * 0.2;
    let maxMotion = 0;
    for (const p of particles) {
      p.vx = (p.vx + (p.hx - p.x) * SPRING) * DAMPING;
      p.vy = (p.vy + (p.hy - p.y) * SPRING) * DAMPING;
      if (cursor) {
        const dx = p.x - cursor.x;
        const dy = p.y - cursor.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.5 && dist < repulseRadius) {
          const push = (REPULSE_FORCE * (repulseRadius - dist)) / repulseRadius;
          p.vx += (dx / dist) * push;
          p.vy += (dy / dist) * push;
        }
      }
      p.x += p.vx;
      p.y += p.vy;
      const motion = Math.abs(p.vx) + Math.abs(p.vy);
      if (motion > maxMotion) maxMotion = motion;
    }
    if (!assembled && maxMotion < SETTLE_EPS) assembled = true;
    return maxMotion >= SETTLE_EPS;
  };

  const stepTilt = (): boolean => {
    tilt = {
      x: tilt.x + (tiltTarget.x - tilt.x) * TILT_LERP,
      y: tilt.y + (tiltTarget.y - tilt.y) * TILT_LERP,
    };
    if (plane) plane.style.transform = `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;
    return Math.abs(tiltTarget.x - tilt.x) + Math.abs(tiltTarget.y - tilt.y) > 0.01;
  };

  const frame = () => {
    const particlesBusy = step();
    const tiltBusy = stepTilt();
    draw();
    if (particlesBusy || tiltBusy || cursor) {
      rafId = requestAnimationFrame(frame);
    } else {
      running = false;
    }
  };

  const wake = () => {
    if (running || reducedMotion.matches || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  };

  const sleep = () => {
    cancelAnimationFrame(rafId);
    running = false;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (reducedMotion.matches) return;
    const rootRect = root.getBoundingClientRect();
    tiltTarget = {
      x: -((event.clientY - rootRect.top) / rootRect.height - 0.5) * MAX_TILT_DEG * 2,
      y: ((event.clientX - rootRect.left) / rootRect.width - 0.5) * MAX_TILT_DEG * 2,
    };
    const canvasRect = canvas.getBoundingClientRect();
    cursor = {
      x: (event.clientX - canvasRect.left) * (deviceSize / canvasRect.width),
      y: (event.clientY - canvasRect.top) * (deviceSize / canvasRect.height),
    };
    wake();
  };

  const onPointerLeave = () => {
    cursor = null;
    tiltTarget = { x: 0, y: 0 };
    wake();
  };

  const onVisibilityChange = () => {
    if (document.hidden) sleep();
    else wake();
  };

  const onMotionPreferenceChange = () => {
    if (reducedMotion.matches) {
      sleep();
      tiltTarget = { x: 0, y: 0 };
      tilt = { x: 0, y: 0 };
      if (plane) plane.style.transform = '';
      drawSettled();
    } else {
      wake();
    }
  };

  const themeObserver = new MutationObserver(() => {
    palette = resolvePalette(canvas);
    if (running) return;
    draw();
  });

  const resizeObserver = new ResizeObserver(() => {
    const cssSize = canvas.clientWidth;
    if (cssSize === 0 || Math.round(cssSize * dpr) === deviceSize) return;
    rebuild(assembled || reducedMotion.matches);
    if (reducedMotion.matches) drawSettled();
    else {
      draw();
      wake();
    }
  });

  rebuild(reducedMotion.matches);
  if (reducedMotion.matches) drawSettled();
  else wake();

  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener('change', onMotionPreferenceChange);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  resizeObserver.observe(canvas);

  return () => {
    sleep();
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.removeEventListener('change', onMotionPreferenceChange);
    themeObserver.disconnect();
    resizeObserver.disconnect();
  };
}
