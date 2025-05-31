import React, { useEffect, useState } from 'react';

export type TransitionType = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'rotate';

interface TransitionWrapperProps {
  transitioning: boolean;
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  onTransitionEnd?: () => void;
  className?: string;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  transitioning,
  children,
  type = 'fade',
  duration = 300,
  delay = 0,
  onTransitionEnd,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(!transitioning);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (transitioning) {
      // Start exit transition
      setIsVisible(false);
      setShouldRender(true);
    } else {
      // Start enter transition
      setShouldRender(true);
      // Small timeout to ensure DOM update before transition
      const enterTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(enterTimeout);
    }
  }, [transitioning]);

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transitions on the wrapper itself
    if (e.target !== e.currentTarget) return;
    
    if (transitioning && !isVisible) {
      setShouldRender(false);
    }
    onTransitionEnd?.();
  };

  const getTransitionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      transition: `all ${duration}ms ease-in-out ${delay}ms`,
      transformOrigin: 'center center',
    };

    const visibleStyles: React.CSSProperties = {
      opacity: 1,
      transform: 'translate(0, 0) scale(1) rotate(0deg)',
    };

    const hiddenStyles: { [key in TransitionType]: React.CSSProperties } = {
      fade: {
        opacity: 0,
      },
      'slide-up': {
        opacity: 0,
        transform: 'translateY(50px)',
      },
      'slide-down': {
        opacity: 0,
        transform: 'translateY(-50px)',
      },
      'slide-left': {
        opacity: 0,
        transform: 'translateX(50px)',
      },
      'slide-right': {
        opacity: 0,
        transform: 'translateX(-50px)',
      },
      scale: {
        opacity: 0,
        transform: 'scale(0.8)',
      },
      rotate: {
        opacity: 0,
        transform: 'rotate(180deg) scale(0.8)',
      },
    };

    return {
      ...baseStyles,
      ...(isVisible ? visibleStyles : hiddenStyles[type]),
    };
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`transition-wrapper ${className}`}
      style={getTransitionStyles()}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
};

export default TransitionWrapper;

// CSS for additional animation effects
export const transitionStyles = `
  .transition-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  /* Optional enhanced transitions with keyframes */
  .transition-wrapper.bounce-in {
    animation: bounceIn 0.5s ease-out;
  }

  .transition-wrapper.bounce-out {
    animation: bounceOut 0.5s ease-in;
  }

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes bounceOut {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    25% {
      transform: scale(0.95);
    }
    100% {
      opacity: 0;
      transform: scale(0.3);
    }
  }

  /* Blur transition effect */
  .transition-wrapper.blur {
    filter: blur(0);
    transition: filter 0.3s ease-in-out;
  }

  .transition-wrapper.blur.transitioning {
    filter: blur(10px);
  }

  /* Glitch effect */
  .transition-wrapper.glitch {
    position: relative;
  }

  .transition-wrapper.glitch::before,
  .transition-wrapper.glitch::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    opacity: 0;
  }

  .transition-wrapper.glitch.transitioning::before {
    animation: glitch-1 0.2s ease-in-out infinite;
    background: rgba(255, 0, 0, 0.3);
    opacity: 0.8;
  }

  .transition-wrapper.glitch.transitioning::after {
    animation: glitch-2 0.2s ease-in-out infinite reverse;
    background: rgba(0, 255, 255, 0.3);
    opacity: 0.8;
  }

  @keyframes glitch-1 {
    0%, 100% {
      transform: translate(0);
    }
    33% {
      transform: translate(-2px, 2px);
    }
    66% {
      transform: translate(2px, -2px);
    }
  }

  @keyframes glitch-2 {
    0%, 100% {
      transform: translate(0);
    }
    33% {
      transform: translate(2px, 2px);
    }
    66% {
      transform: translate(-2px, -2px);
    }
  }
`;

// Hook for managing transitions
export const useTransition = (initialState = false) => {
  const [transitioning, setTransitioning] = useState(initialState);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const startTransition = (callback?: () => void) => {
    setTransitioning(true);
    if (callback) {
      setPendingCallback(() => callback);
    }
  };

  const endTransition = () => {
    setTransitioning(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  };

  return {
    transitioning,
    startTransition,
    endTransition,
  };
};

// Example usage component
export const TransitionExample: React.FC = () => {
  const { transitioning, startTransition, endTransition } = useTransition();
  const [currentScreen, setCurrentScreen] = useState('menu');

  const _changeScreen /* unused */ = (newScreen: string) => {
    startTransition(() => {
      setCurrentScreen(newScreen);
      setTimeout(endTransition, 50);
    });
  };

  return (
    <TransitionWrapper
      transitioning={transitioning}
      type="slide-up"
      duration={400}
      onTransitionEnd={() => {
        if (!transitioning) {
          console.log('Transition complete');
        }
      }}
    >
      <div>
        {currentScreen === 'menu' && <div>Menu Screen</div>}
        {currentScreen === 'game' && <div>Game Screen</div>}
        {currentScreen === 'scores' && <div>High Scores</div>}
      </div>
    </TransitionWrapper>
  );
};