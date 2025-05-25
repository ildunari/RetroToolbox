export enum ParticleLayer {
  BACKGROUND = 0,
  GAME = 1,
  FOREGROUND = 2,
  UI = 3
}

export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  layer?: ParticleLayer;
  size?: number;
  gravity?: number;
}

export class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public color: string;
  public life: number;
  public maxLife: number;
  public layer: ParticleLayer;
  public size: number;
  public gravity: number;
  public active: boolean;

  constructor(config: ParticleConfig) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.color = config.color;
    this.life = config.life;
    this.maxLife = config.life;
    this.layer = config.layer || ParticleLayer.GAME;
    this.size = config.size || 2;
    this.gravity = config.gravity || 0;
    this.active = true;
  }

  reset(config: ParticleConfig): void {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.color = config.color;
    this.life = config.life;
    this.maxLife = config.life;
    this.layer = config.layer || ParticleLayer.GAME;
    this.size = config.size || 2;
    this.gravity = config.gravity || 0;
    this.active = true;
  }

  update(deltaTime: number): void {
    if (!this.active) return;
    
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += this.gravity * deltaTime;
    this.life -= deltaTime;
    
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    const halfSize = this.size / 2;
    ctx.fillRect(this.x - halfSize, this.y - halfSize, this.size, this.size);
  }

  isDead(): boolean {
    return !this.active || this.life <= 0;
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private maxParticles: number = 1000;
  private poolSize: number = 500;

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.particlePool.push(new Particle({
        x: 0, y: 0, vx: 0, vy: 0, color: '#ffffff', life: 0
      }));
    }
  }

  private getParticleFromPool(): Particle | null {
    const particle = this.particlePool.pop();
    if (particle) {
      particle.active = true;
      return particle;
    }
    
    // If pool is empty and we haven't hit limit, create new particle
    if (this.particles.length < this.maxParticles) {
      return new Particle({
        x: 0, y: 0, vx: 0, vy: 0, color: '#ffffff', life: 0
      });
    }
    
    return null;
  }

  private returnParticleToPool(particle: Particle): void {
    particle.active = false;
    if (this.particlePool.length < this.poolSize) {
      this.particlePool.push(particle);
    }
  }

  addParticle(config: ParticleConfig): void {
    const particle = this.getParticleFromPool();
    if (particle) {
      particle.reset(config);
      this.particles.push(particle);
    }
  }

  createExplosion(x: number, y: number, color: string, count: number = 10, layer: ParticleLayer = ParticleLayer.GAME): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 50 + Math.random() * 100;
      this.addParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.5 + Math.random() * 0.5,
        layer,
        size: 2 + Math.random() * 2
      });
    }
  }

  createBurst(x: number, y: number, vx: number, color: string, count: number = 20, layer: ParticleLayer = ParticleLayer.GAME): void {
    for (let i = 0; i < count; i++) {
      this.addParticle({
        x, y,
        vx: vx + (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color,
        life: 0.5,
        layer,
        size: 1 + Math.random() * 2
      });
    }
  }

  createTrail(x: number, y: number, vx: number, vy: number, color: string, layer: ParticleLayer = ParticleLayer.BACKGROUND): void {
    this.addParticle({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: vx * 0.1 + (Math.random() - 0.5) * 20,
      vy: vy * 0.1 + (Math.random() - 0.5) * 20,
      color,
      life: 0.3,
      layer,
      size: 1 + Math.random()
    });
  }

  update(deltaTime: number): void {
    // Update particles and remove dead ones
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        this.returnParticleToPool(particle);
        this.particles.splice(i, 1);
      }
    }
  }

  drawLayer(ctx: CanvasRenderingContext2D, layer: ParticleLayer): void {
    this.particles
      .filter(particle => particle.layer === layer && particle.active)
      .forEach(particle => particle.draw(ctx));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw particles by layer for proper rendering order
    for (let layer = ParticleLayer.BACKGROUND; layer <= ParticleLayer.UI; layer++) {
      this.drawLayer(ctx, layer);
    }
  }

  clear(): void {
    // Return all particles to pool
    this.particles.forEach(particle => this.returnParticleToPool(particle));
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  getPoolStats(): { active: number; pooled: number; total: number } {
    return {
      active: this.particles.length,
      pooled: this.particlePool.length,
      total: this.particles.length + this.particlePool.length
    };
  }
}

// Singleton ParticleManager for global particle system
export class ParticleManager {
  private static instance: ParticleManager;
  private particleSystem: ParticleSystem;

  private constructor() {
    this.particleSystem = new ParticleSystem();
  }

  static getInstance(): ParticleManager {
    if (!ParticleManager.instance) {
      ParticleManager.instance = new ParticleManager();
    }
    return ParticleManager.instance;
  }

  getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }

  update(deltaTime: number): void {
    this.particleSystem.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.particleSystem.draw(ctx);
  }

  drawLayer(ctx: CanvasRenderingContext2D, layer: ParticleLayer): void {
    this.particleSystem.drawLayer(ctx, layer);
  }

  clear(): void {
    this.particleSystem.clear();
  }

  getStats(): { active: number; pooled: number; total: number } {
    return this.particleSystem.getPoolStats();
  }
}

// Export singleton instance
export const particleManager = ParticleManager.getInstance();