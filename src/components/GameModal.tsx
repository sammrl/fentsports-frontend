// src/components/GameModal.tsx
import React, { useRef } from "react";

export interface GameModalProps {
  gameUrl: string;
  onClose: () => void;
}

export function GameModal({ gameUrl, onClose }: GameModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)", // Dark overlay in the background
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          padding: "20px",
          background: "linear-gradient(135deg, #4e4e4e, #222)",
          border: "4px double #fff",
          borderRadius: "12px",
          boxShadow: "0 0 15px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.1)",
          position: "relative",
        }}
      >
        <iframe
          ref={iframeRef}
          src={gameUrl}
          style={{
            display: "block",
            width: "512px",
            height: "480px",
            border: "none",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
            borderRadius: "4px",
          }}
          title="Game"
        />
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "4px 8px",
            background: "linear-gradient(135deg, #ff2975, #8c1eff)",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
