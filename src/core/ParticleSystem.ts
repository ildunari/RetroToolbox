export class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public color: string;
  public life: number;
  public maxLife: number;
  public size?: number;
  public growthRate?: number;
  public text?: string;
  public fontSize?: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, life: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    
    if (this.size && this.growthRate) {
      this.size += this.growthRate * deltaTime;
      if (this.size < 0) this.size = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.size === undefined) {
      this.size = 4;
    }
    const alpha = this.life / this.maxLife;
    
    if (this.text && this.fontSize) {
      // Draw text particle
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.font = `bold ${this.fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    } else if (this.size) {
      // Draw sized particle
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Draw default particle
      ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
  }

  isDead(): boolean {
    return this.life <= 0;
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];

  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  createExplosion(x: number, y: number, color: string, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 50 + Math.random() * 100;
      const particle = new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        0.5 + Math.random() * 0.5
      );
      this.addParticle(particle);
    }
  }

  createBurst(x: number, y: number, vx: number, color: string, count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const particle = new Particle(
        x, y,
        vx + (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        color,
        0.5
      );
      this.addParticle(particle);
    }
  }

  update(deltaTime: number): void {
    this.particles = this.particles.filter(particle => {
      particle.update(deltaTime);
      return !particle.isDead();
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => particle.draw(ctx));
  }

  clear(): void {
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}