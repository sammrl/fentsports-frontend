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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <iframe
        ref={iframeRef}
        src={gameUrl}
        title="Game"
        style={{
          border: "none",
          width: "1024px",
          height: "768px",
          maxWidth: "95vw",
          maxHeight: "95vh",
          objectFit: "contain"
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff2975, #8c1eff)",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 100,
        }}
      >
        <span style={{ color: "#fff", fontWeight: "bold" }}>X</span>
      </button>
    </div>
  );
}
