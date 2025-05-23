import React from 'react';

export const ShopModal = ({ coins, onPurchase, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
      <h2 className="text-2xl font-bold text-white mb-4">Level Complete!</h2>
      <p className="text-gray-300 mb-4">Coins: {coins}</p>
      <div className="space-y-3 mb-4">
        <button
          onClick={() => onPurchase('paddle')}
          disabled={coins < 50}
          className={`w-full px-4 py-2 rounded text-white ${coins < 50 ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          Wider Paddle - 50
        </button>
        <button
          onClick={() => onPurchase('ball')}
          disabled={coins < 50}
          className={`w-full px-4 py-2 rounded text-white ${coins < 50 ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          Faster Ball - 50
        </button>
        <button
          onClick={() => onPurchase('life')}
          disabled={coins < 75}
          className={`w-full px-4 py-2 rounded text-white ${coins < 75 ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          Extra Life - 75
        </button>
      </div>
      <button
        onClick={onClose}
        className="mt-2 w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-600"
      >
        Continue
      </button>
    </div>
  </div>
);

