import React, { useEffect, useState } from 'react';

export const GameOverBanner = ({ show }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-start justify-center pointer-events-none mt-8">
      <div className="px-6 py-3 bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-amber-500/50 rounded-lg shadow-2xl transform animate-game-over">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 font-mono">GAME OVER</h2>
      </div>
    </div>
  );
};
