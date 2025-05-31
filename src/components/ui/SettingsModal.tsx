import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface Settings {
  soundEnabled: boolean;
  volume: number;
  difficulty: string;
  renderer: 'canvas2d' | 'webgl';
}

interface SettingsModalProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSettingsChange, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-white">Sound</label>
          <button
            onClick={() => onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded ${settings.soundEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-white">Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSettingsChange({ ...settings, volume: parseFloat(e.target.value) })}
            className="w-32"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-white">Difficulty</label>
          <select
            value={settings.difficulty}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSettingsChange({ ...settings, difficulty: e.target.value })}
            className="bg-gray-700 text-white rounded px-3 py-1"
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-white">Renderer</label>
          <select
            value={settings.renderer}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onSettingsChange({ ...settings, renderer: e.target.value as 'canvas2d' | 'webgl' })
            }
            className="bg-gray-700 text-white rounded px-3 py-1"
          >
            <option value="canvas2d">Canvas 2D</option>
            <option value="webgl">WebGL</option>
          </select>
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="mt-6 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);

SettingsModal.displayName = 'SettingsModal';