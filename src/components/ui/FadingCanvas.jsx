import React, { useEffect, useState } from 'react';

export const FadingCanvas = ({ active, children }) => {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    setVisible(active);
  }, [active]);

  return (
    <div className={`transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>{children}</div>
  );
};
