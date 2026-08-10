(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const network = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(network && network.saveData);
  const lowCPU = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const constrainedDevice = saveData || lowCPU || lowMemory;

  const start = () => {
    if (!document.body || document.querySelector('.research-field-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'research-field-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    const aura = document.createElement('div');
    aura.className = 'research-field-aura';
    aura.setAttribute('aria-hidden', 'true');

    document.body.prepend(aura);
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let frame = 0;
    let running = false;
    let lastFrame = 0;
    let resizeTimer = 0;

    const pointer = {
      x: -10000, y: -10000,
      px: -10000, py: -10000,
      vx: 0, vy: 0,
      speed: 0,
      energy: 0,
      active: false,
      lastMove: 0
    };

    const config = {
      cell: 128,
      linkDistance: 122,
      pointerRadius: 235,
      maxLinksPerParticle: 4,
      idleFPS: constrainedDevice ? 30 : 42,
      activeFPS: constrainedDevice ? 45 : 60
    };

    const palette = [];

    const parseColor = (cssValue, fallback) => {
      const value = cssValue.trim();

      if (value.startsWith('#')) {
        let hex = value.slice(1);
        if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
        const num = Number.parseInt(hex, 16);
        if (Number.isFinite(num)) return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      }

      const match = value.match(/(\d+(?:\.\d+)?)[^\d]+(\d+(?:\.\d+)?)[^\d]+(\d+(?:\.\d+)?)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : fallback;
    };

    const refreshPalette = () => {
      const styles = getComputedStyle(document.documentElement);
      palette.length = 0;
      palette.push(parseColor(styles.getPropertyValue('--accent'), [37, 99, 235]));
      palette.push(parseColor(styles.getPropertyValue('--accent-2'), [6, 182, 212]));
      palette.push(parseColor(styles.getPropertyValue('--accent-3'), [124, 58, 237]));
    };

    const rgba = (rgb, alpha) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;

    class Particle {
      constructor(index) {
        this.index = index;
        this.seed = Math.random() * Math.PI * 2;
        this.color = index % 7 === 0 ? 1 : (index % 13 === 0 ? 2 : 0);
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;

        const angle = Math.random() * Math.PI * 2;
        const base = 0.16 + Math.random() * 0.22;

        this.vx = Math.cos(angle) * base;
        this.vy = Math.sin(angle) * base;
        this.baseVx = this.vx;
        this.baseVy = this.vy;

        this.radius = 0.9 + Math.random() * 1.35;
        this.depth = 0.60 + Math.random() * 0.70;
        this.alpha = 0.28 + Math.random() * 0.42;
      }

      update(dt, now) {
        if (pointer.active) {
          const dx = this.x - pointer.x;
          const dy = this.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          const radiusSq = config.pointerRadius * config.pointerRadius;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq) || 1;
            const influence = 1 - dist / config.pointerRadius;
            const nx = dx / dist;
            const ny = dy / dist;

            // Bounded repulsion: mouse pushes the local particle field away.
            const repel = influence * influence * 0.95 * this.depth;
            this.vx += nx * repel * dt;
            this.vy += ny * repel * dt;

            // Tangential flow: mouse direction changes the local vector field.
            const motion = Math.min(pointer.speed / 28, 2.0);
            const tangentX = -ny;
            const tangentY = nx;
            const handedness = Math.sign(pointer.vx * dy - pointer.vy * dx) || 1;

            this.vx += tangentX * influence * motion * 0.20 * handedness * dt;
            this.vy += tangentY * influence * motion * 0.20 * handedness * dt;

            // Transfer a little pointer momentum to nearby particles.
            this.vx += pointer.vx * influence * 0.014 * this.depth;
            this.vy += pointer.vy * influence * 0.014 * this.depth;
          }
        }

        // Autonomous smooth vector field.
        this.vx += Math.sin(now * 0.00030 + this.seed + this.y * 0.004) * 0.0019 * dt;
        this.vy += Math.cos(now * 0.00026 + this.seed + this.x * 0.004) * 0.0017 * dt;

        // Recover to baseline, preventing runaway velocities after interaction.
        this.vx += (this.baseVx - this.vx) * 0.0045 * dt;
        this.vy += (this.baseVy - this.vy) * 0.0045 * dt;

        const maxSpeed = 2.25 + pointer.energy * 1.15;
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          this.vx *= scale;
          this.vy *= scale;
        }

        this.vx *= Math.pow(0.989, dt);
        this.vy *= Math.pow(0.989, dt);
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        const margin = 26;
        if (this.x < -margin) this.x = width + margin;
        else if (this.x > width + margin) this.x = -margin;

        if (this.y < -margin) this.y = height + margin;
        else if (this.y > height + margin) this.y = -margin;
      }

      draw(now) {
        const pulse = 0.90 + Math.sin(now * 0.0011 + this.seed) * 0.10;
        const r = this.radius * pulse;
        const color = palette[this.color] || palette[0];

        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(color, this.alpha);
        ctx.fill();

        if (this.radius > 1.85) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, r + 4.6, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(color, this.alpha * 0.12);
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    const particleCount = () => {
      const area = width * height;

      if (reduceMotion.matches) {
        return Math.max(30, Math.min(54, Math.round(area / 30000)));
      }

      if (coarsePointer.matches) {
        return Math.max(42, Math.min(68, Math.round(area / 19000)));
      }

      if (constrainedDevice) {
        return Math.max(58, Math.min(86, Math.round(area / 16000)));
      }

      return Math.max(76, Math.min(118, Math.round(area / 13500)));
    };

    const rebuild = () => {
      particles = Array.from({ length: particleCount() }, (_, i) => new Particle(i));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      // DPR cap prevents 2x/3x screens from multiplying canvas work excessively.
      dpr = Math.min(window.devicePixelRatio || 1, constrainedDevice ? 1.35 : 1.7);

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      refreshPalette();
      rebuild();
      drawStatic(performance.now());
    };

    // Spatial hashing means connection work stays local rather than O(n²).
    const buildGrid = () => {
      const grid = new Map();
      const cell = config.cell;

      for (const p of particles) {
        const gx = Math.floor(p.x / cell);
        const gy = Math.floor(p.y / cell);
        const key = `${gx}:${gy}`;

        let bucket = grid.get(key);
        if (!bucket) {
          bucket = [];
          grid.set(key, bucket);
        }
        bucket.push(p);
      }

      return grid;
    };

    const drawConnections = () => {
      const grid = buildGrid();
      const cell = config.cell;
      const maxDist = config.linkDistance;
      const maxDistSq = maxDist * maxDist;
      const accent = palette[0] || [37, 99, 235];

      for (const p of particles) {
        const gx = Math.floor(p.x / cell);
        const gy = Math.floor(p.y / cell);
        let links = 0;

        for (let ox = -1; ox <= 1 && links < config.maxLinksPerParticle; ox++) {
          for (let oy = -1; oy <= 1 && links < config.maxLinksPerParticle; oy++) {
            const bucket = grid.get(`${gx + ox}:${gy + oy}`);
            if (!bucket) continue;

            for (const q of bucket) {
              if (q.index <= p.index || links >= config.maxLinksPerParticle) continue;

              const dx = p.x - q.x;
              const dy = p.y - q.y;
              const distSq = dx * dx + dy * dy;

              if (distSq >= maxDistSq) continue;

              const dist = Math.sqrt(distSq);
              const alpha = (1 - dist / maxDist) * 0.105;

              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = rgba(accent, alpha);
              ctx.lineWidth = 0.55;
              ctx.stroke();
              links++;
            }
          }
        }
      }
    };

    const drawPointerLens = () => {
      if (!pointer.active || pointer.energy < 0.04 || coarsePointer.matches) return;

      const accent = palette[0] || [37, 99, 235];
      const gradient = ctx.createRadialGradient(
        pointer.x, pointer.y, 0,
        pointer.x, pointer.y, config.pointerRadius
      );

      gradient.addColorStop(0, rgba(accent, 0.055 * pointer.energy));
      gradient.addColorStop(0.42, rgba(accent, 0.018 * pointer.energy));
      gradient.addColorStop(1, rgba(accent, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, config.pointerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Minimal "data probe" cursor ring.
      const ring = 18 + pointer.energy * 5;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, ring, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(accent, 0.14 * pointer.energy);
      ctx.lineWidth = 0.7;
      ctx.setLineDash([2, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (pointer.speed > 2.5) {
        const mag = Math.hypot(pointer.vx, pointer.vy) || 1;
        const nx = pointer.vx / mag;
        const ny = pointer.vy / mag;
        const len = Math.min(78, 22 + pointer.speed * 2.2);

        ctx.beginPath();
        ctx.moveTo(pointer.x - nx * 7, pointer.y - ny * 7);
        ctx.lineTo(pointer.x + nx * len, pointer.y + ny * len);
        ctx.strokeStyle = rgba(accent, 0.18 * pointer.energy);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    };

    const drawStatic = (now) => {
      ctx.clearRect(0, 0, width, height);
      drawConnections();
      particles.forEach((p) => p.draw(now));
    };

    const render = (now) => {
      if (!running) return;

      const recentlyActive = pointer.active && now - pointer.lastMove < 1000;
      const fps = recentlyActive ? config.activeFPS : config.idleFPS;
      const interval = 1000 / fps;
      const elapsed = now - lastFrame;

      if (elapsed < interval) {
        frame = requestAnimationFrame(render);
        return;
      }

      lastFrame = now - (elapsed % interval);
      const dt = Math.min(elapsed / 16.667, 2.0);

      pointer.energy *= 0.94;
      pointer.vx *= 0.86;
      pointer.vy *= 0.86;
      pointer.speed = Math.hypot(pointer.vx, pointer.vy);

      if (pointer.active && now - pointer.lastMove > 1500) {
        pointer.active = false;
      }

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) p.update(dt, now);
      drawConnections();
      for (const p of particles) p.draw(now);
      drawPointerLens();

      frame = requestAnimationFrame(render);
    };

    const play = () => {
      if (running || reduceMotion.matches || document.hidden) return;
      running = true;
      lastFrame = performance.now();
      frame = requestAnimationFrame(render);
    };

    const pause = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const onPointerMove = (event) => {
      const x = event.clientX;
      const y = event.clientY;

      if (!pointer.active) {
        pointer.px = x;
        pointer.py = y;
      }

      pointer.vx = x - pointer.px;
      pointer.vy = y - pointer.py;
      pointer.speed = Math.hypot(pointer.vx, pointer.vy);
      pointer.energy = Math.min(1.35, 0.25 + pointer.speed / 22);

      pointer.x = x;
      pointer.y = y;
      pointer.px = x;
      pointer.py = y;
      pointer.active = true;
      pointer.lastMove = performance.now();
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -10000;
      pointer.y = -10000;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave, { passive: true });

    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 140);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else if (!reduceMotion.matches) play();
    });

    const themeObserver = new MutationObserver(refreshPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    const onMotionPreferenceChange = () => {
      pause();
      resize();
      if (!reduceMotion.matches) play();
    };

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', onMotionPreferenceChange);
    }

    resize();

    if (!reduceMotion.matches) play();
  };

  // Decorative work starts after first paint, so it never competes with
  // navigation/content for initial rendering time.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 700 });
  } else {
    window.setTimeout(start, 120);
  }
})();
