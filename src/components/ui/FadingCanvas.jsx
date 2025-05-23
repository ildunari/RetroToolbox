import React, { useEffect, useState } from 'react';

export const FadingCanvas = ({ active, slide = false, children }) => {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    setVisible(active);
  }, [active]);

  const classes = slide
    ? `transition-all duration-700 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
    : `transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`;

  return (
    <div className={classes}>{children}</div>
  );
};
