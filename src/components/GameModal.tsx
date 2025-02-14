// src/components/GameModal.tsx
import React, { useRef } from "react";

interface GameModalProps {
  gameUrl: string;
  onClose: () => void;
}

export function GameModal({ gameUrl, onClose }: GameModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-[800px] h-[90vh] bg-[#2A2A2A] m-0 p-0 overflow-hidden">
        <iframe
          ref={iframeRef}
          src={gameUrl}
          className="w-full h-full m-0 p-0"
          style={{ border: "none" }}
          title="Game"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-[#ff2975] to-[#8c1eff] rounded-md text-white font-silkscreen z-10"
        >
          Close
        </button>
      </div>
    </div>
  );
}
