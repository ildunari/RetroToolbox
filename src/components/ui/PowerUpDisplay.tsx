import React from 'react';

export interface PowerUp {
  id: string;
  type: string;
  name: string;
  timeRemaining: number;
  maxTime: number;
  icon?: string;
  color?: string;
}

interface PowerUpDisplayProps {
  powerUps: PowerUp[];
  className?: string;
}

const PowerUpDisplay: React.FC<PowerUpDisplayProps> = ({ powerUps, className = '' }) => {
  if (powerUps.length === 0) return null;

  const getDefaultColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      speed: '#00ff00',
      slow: '#00ffff',
      invincibility: '#ffff00',
      shield: '#ff00ff',
      multiball: '#ff6600',
      double: '#ff0066',
      triple: '#ff00ff',
      shrink: '#00ff99',
      grow: '#ff9900',
      laser: '#ff0000',
      sticky: '#66ff00',
      default: '#ffffff'
    };
    return colorMap[type.toLowerCase()] || colorMap.default;
  };

  const getDefaultIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      speed: '⚡',
      slow: '🐌',
      invincibility: '🛡️',
      shield: '🛡️',
      multiball: '🎱',
      double: '2×',
      triple: '3×',
      shrink: '▼',
      grow: '▲',
      laser: '💥',
      sticky: '🎯',
      default: '✦'
    };
    return iconMap[type.toLowerCase()] || iconMap.default;
  };

  return (
    <div 
      className={`power-up-display ${className}`}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100,
        pointerEvents: 'none'
      }}
    >
      {powerUps.map((powerUp) => {
        const percentage = (powerUp.timeRemaining / powerUp.maxTime) * 100;
        const color = powerUp.color || getDefaultColor(powerUp.type);
        const icon = powerUp.icon || getDefaultIcon(powerUp.type);
        
        return (
          <div
            key={powerUp.id}
            className="power-up-item"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: `2px solid ${color}`,
              borderRadius: '8px',
              padding: '8px 12px',
              minWidth: '120px',
              boxShadow: `0 0 10px ${color}`,
              animation: percentage < 20 ? 'pulse 0.5s infinite' : 'none'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{
                fontSize: '18px',
                filter: `drop-shadow(0 0 3px ${color})`
              }}>
                {icon}
              </span>
              <span style={{
                color: color,
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase',
                textShadow: `0 0 5px ${color}`,
                fontFamily: 'monospace'
              }}>
                {powerUp.name}
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  borderRadius: '2px',
                  transition: 'width 0.1s linear',
                  boxShadow: `0 0 5px ${color}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
                  animation: 'shimmer 1s infinite'
                }} />
              </div>
            </div>
            
            <div style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: '2px',
              fontFamily: 'monospace',
              textAlign: 'right'
            }}>
              {Math.ceil(powerUp.timeRemaining / 1000)}s
            </div>
          </div>
        );
      })}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .power-up-item {
          transition: all 0.3s ease;
        }
        
        .power-up-item:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default PowerUpDisplay;