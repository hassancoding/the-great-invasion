export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
};

export class ParticleSystem {
  list: Particle[] = [];

  burst(x: number, y: number, color: string, count = 10, speed = 120) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.5,
        size: 2 + Math.random() * 3,
        color,
        gravity: 420,
      });
    }
  }

  spark(x: number, y: number, color: string) {
    this.burst(x, y, color, 6, 90);
  }

  confetti(x: number, y: number) {
    const colors = ['#fbbf24', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa'];
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const s = 80 + Math.random() * 140;
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1,
        size: 3 + Math.random() * 3,
        color: colors[i % colors.length],
        gravity: 280,
      });
    }
  }

  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.list) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.list.length = 0;
  }
}
