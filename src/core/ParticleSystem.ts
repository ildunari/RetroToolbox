export class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public color: string;
  public life: number;
  public maxLife: number;

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
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
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