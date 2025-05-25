import { useRef, useCallback } from 'react';
import { particleManager, ParticleLayer, ParticleConfig } from '../core/ParticleSystem';

export interface UseParticlesOptions {
  maxParticles?: number;
  defaultLayer?: ParticleLayer;
}

export function useParticles(options: UseParticlesOptions = {}) {
  const { defaultLayer = ParticleLayer.GAME } = options;
  
  const createExplosion = useCallback((x: number, y: number, color: string, count?: number) => {
    particleManager.getParticleSystem().createExplosion(x, y, color, count, defaultLayer);
  }, [defaultLayer]);

  const createBurst = useCallback((x: number, y: number, vx: number, color: string, count?: number) => {
    particleManager.getParticleSystem().createBurst(x, y, vx, color, count, defaultLayer);
  }, [defaultLayer]);

  const createTrail = useCallback((x: number, y: number, vx: number, vy: number, color: string) => {
    particleManager.getParticleSystem().createTrail(x, y, vx, vy, color, defaultLayer);
  }, [defaultLayer]);

  const addParticle = useCallback((config: Omit<ParticleConfig, 'layer'> & { layer?: ParticleLayer }) => {
    particleManager.getParticleSystem().addParticle({
      ...config,
      layer: config.layer || defaultLayer
    });
  }, [defaultLayer]);

  const update = useCallback((deltaTime: number) => {
    particleManager.update(deltaTime);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    particleManager.draw(ctx);
  }, []);

  const drawLayer = useCallback((ctx: CanvasRenderingContext2D, layer: ParticleLayer) => {
    particleManager.drawLayer(ctx, layer);
  }, []);

  const clear = useCallback(() => {
    particleManager.clear();
  }, []);

  const getStats = useCallback(() => {
    return particleManager.getStats();
  }, []);

  return {
    createExplosion,
    createBurst,
    createTrail,
    addParticle,
    update,
    draw,
    drawLayer,
    clear,
    getStats
  };
}