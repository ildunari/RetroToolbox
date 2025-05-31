import React, { useState, useEffect } from 'react';

const MAZE_WIDTH = 28;
const MAZE_HEIGHT = 31;

// 0 = wall, 1 = pellet, 2 = power pellet, 3 = empty
const DEFAULT_LAYOUT: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,2,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,3,3,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,3,3,3,3,3,3,0,1,0,0,1,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,0,3,3,3,3,3,3,0,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,1,0,0,1,0,3,3,3,3,3,3,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,2,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,2,0],
  [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
  [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const STORAGE_KEY = 'pacmanLayouts';
const SELECTED_KEY = 'pacmanSelectedLayout';

interface LevelEditorProps {
  onBack: () => void;
}

const loadLayouts = (): Record<string, number[][]> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Failed to load layouts', err);
  }
  return {};
};

const saveLayouts = (layouts: Record<string, number[][]>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  } catch (err) {
    console.error('Failed to save layouts', err);
  }
};

export const LevelEditor: React.FC<LevelEditorProps> = ({ onBack }) => {
  const [layouts, setLayouts] = useState<Record<string, number[][]>>(loadLayouts);
  const initialName = localStorage.getItem(SELECTED_KEY) || Object.keys(layouts)[0] || 'default';
  const [name, setName] = useState(initialName);
  const [grid, setGrid] = useState<number[][]>(() => {
    const layout = layouts[initialName];
    return layout ? layout.map(row => [...row]) : DEFAULT_LAYOUT.map(row => [...row]);
  });

  useEffect(() => {
    saveLayouts(layouts);
  }, [layouts]);

  const toggleCell = (r: number, c: number) => {
    setGrid(prev => {
      const copy = prev.map(row => [...row]);
      copy[r][c] = (copy[r][c] + 1) % 4;
      return copy;
    });
  };

  const handleSave = () => {
    const layoutName = prompt('Layout name', name) || name;
    setName(layoutName);
    const updated = { ...layouts, [layoutName]: grid };
    setLayouts(updated);
    localStorage.setItem(SELECTED_KEY, layoutName);
  };

  const handleLoad = (layoutName: string) => {
    const layout = layouts[layoutName];
    if (layout) {
      setName(layoutName);
      setGrid(layout.map(row => [...row]));
      localStorage.setItem(SELECTED_KEY, layoutName);
    }
  };

  const colors = ['#1e3a8a', '#facc15', '#f472b6', '#111827'];

  return (
    <div className="p-4 text-white flex flex-col items-center">
      <div className="mb-4 w-full flex justify-between items-center">
        <button onClick={onBack} className="bg-gray-700 px-4 py-2 rounded">Back</button>
        <div className="flex items-center gap-2">
          <select value={name} onChange={e => handleLoad(e.target.value)} className="bg-gray-800 p-1 rounded">
            {[name, ...Object.keys(layouts)].filter((v, i, a) => a.indexOf(v) === i).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button onClick={handleSave} className="bg-green-600 px-3 py-1 rounded">Save</button>
        </div>
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${MAZE_WIDTH}, 16px)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => toggleCell(r, c)}
              style={{ width: 16, height: 16, backgroundColor: colors[cell], border: '1px solid #111' }}
            />
          ))
        )}
      </div>
    </div>
  );
};

LevelEditor.displayName = 'LevelEditor';
