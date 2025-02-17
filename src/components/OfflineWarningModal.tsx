import React from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface OfflineWarningModalProps {
  onContinue: () => void;
  onCancel: () => void;
}

export function OfflineWarningModal({ onContinue, onCancel }: OfflineWarningModalProps) {
  const { setVisible } = useWalletModal();

  const handleConnect = () => {
    setVisible(true);
    onCancel(); // Close the warning modal when opening wallet modal
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gradient-to-r from-gray-600 to-gray-800 p-4 rounded-lg shadow-lg w-80">
        <p className="text-white font-silkscreen text-center mb-4">
          You are not connected! Your scores will not be saved for rewards.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onContinue}
            className="w-full py-2 bg-gray-500 rounded-md text-white font-silkscreen"
          >
            That's OK
          </button>
          <button 
            onClick={handleConnect}
            className="w-full py-2 bg-gradient-to-r from-[#ff2975] to-[#8c1eff] rounded-md text-white font-silkscreen"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
} 