// src/components/ShareConfirmModal.tsx
import React from "react";

export interface ShareConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ShareConfirmModal({ message, onConfirm, onCancel }: ShareConfirmModalProps) {
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
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#000",
          padding: "2rem",
          borderRadius: "8px",
          textAlign: "center",
          fontFamily: "silkscreen",
          color: "#fff",
        }}
      >
        <p style={{ marginBottom: "1.5rem" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button
            onClick={onConfirm}
            className="font-silkscreen text-white hover:text-[#ff2975] transition-colors"
          >
            Yes, Share
          </button>
          <button
            onClick={onCancel}
            className="font-silkscreen text-white hover:text-[#ff2975] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}