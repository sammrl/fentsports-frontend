// src/App.tsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HeaderBar } from "./components/HeaderBar";
import { ThreeDCarousel } from "./components/ThreeDCarousel";
import { RetroGrid } from "./components/ui/RetroGrid";
import { GameModal } from "./components/GameModal";
import { Leaderboard } from "./pages/Leaderboard";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { UserRegistrationModal } from "./components/UserRegistrationModal";
import { OfflineWarningModal } from "./components/OfflineWarningModal";

const API_URL = import.meta.env.VITE_API_URL;

const GAME_SECRETS: Record<string, string> = {
  FentMan: import.meta.env.VITE_FENTMAN_SECRET || "default_secret_1",
  FentFall: import.meta.env.VITE_FENTFALL_SECRET || "default_secret_2",
  FentaPiller: import.meta.env.VITE_FENTAPILLER_SECRET || "default_secret_3",
};

function Home() {
  const [selectedGameUrl, setSelectedGameUrl] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [pendingGameUrl, setPendingGameUrl] = useState<string | null>(null);
  const { publicKey, signMessage } = useWallet();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  // games with URL and game name 
  const games: Record<string, { url: string; name: string }> = {
    FentMan: { url: "https://effortless-marshmallow-2f2b8c.netlify.app/", name: "FentMan" },
    FentFall: { url: "https://eloquent-cascaron-0d6d10.netlify.app/", name: "FentFall" },
    FentaPiller: { url: "https://delicate-fox-bec4e2.netlify.app/", name: "FentaPiller" },
  };

  // Check registration status on wallet connection
  useEffect(() => {
    const checkRegistration = async () => {
      if (publicKey) {
        try {
          const walletAddress = publicKey.toBase58();
          const response = await fetch(`${API_URL}/api/user?wallet=${encodeURIComponent(walletAddress)}`);
          const data = await response.json();
          if (data.registered) {
            setIsRegistered(true);
            localStorage.setItem("userName", data.name);
            localStorage.setItem("registered", "true");
          } else {
            setIsRegistered(false);
            setShowRegistrationModal(true);
          }
        } catch (err) {
          console.error("Error checking registration status:", err);
        }
      } else {
        setIsRegistered(null);
        localStorage.removeItem("userName");
        localStorage.removeItem("registered");
      }
    };
    checkRegistration();
  }, [publicKey]);

  // Handle game selection and request a session token from the backend
  const handleGameSelect = async (gameKey: string) => {
    console.log("Selected game:", gameKey);
    const selectedGame = games[gameKey];

    if (!selectedGame) {
      console.error("Game not found:", gameKey);
      return;
    }

    if (!publicKey || !signMessage) {
      console.log("Wallet not connected or signMessage not available");
      setPendingGameUrl(selectedGame.url);
      setShowOfflineWarning(true);
      return;
    }

    try {
      // Get a session token first
      const sessionResponse = await fetch(`${API_URL}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          game: gameKey,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error(`HTTP error! status: ${sessionResponse.status}`);
      }

      const { sessionToken } = await sessionResponse.json();
      setSessionToken(sessionToken);


      const handleMessage = async (event: MessageEvent) => {

        const gameUrls = Object.values(games).map(g => new URL(g.url).origin);
        if (!gameUrls.includes(event.origin)) return;

        if (event.data.type === 'GAME_SCORE') {
          const score = event.data.score;
          console.log(`Received score from game: ${score}`);
          
          try {

            const timestamp = Date.now();
            const signatureMessage = `Game:${gameKey},Score:${score},Session:${sessionToken},Timestamp:${timestamp}`;
            const encodedMessage = new TextEncoder().encode(signatureMessage);
            const signatureBytes = await signMessage(encodedMessage);
            const clientSignature = bs58.encode(signatureBytes);
            const response = await fetch(`${API_URL}/api/score`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                wallet: publicKey.toString(),
                game: gameKey,
                score: score,
                sessionToken: sessionToken,
                clientSignature: clientSignature,
                signatureMessage: signatureMessage
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            console.log('Score submitted successfully');
          } catch (error) {
            console.error('Error submitting score:', error);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      setSelectedGameUrl(selectedGame.url);

      return () => {
        window.removeEventListener('message', handleMessage);
        setSessionToken(null);
      };

    } catch (error) {
      console.error("Error starting game session:", error);
      // Even if session creation fails, we can still launch the game
      setSelectedGameUrl(selectedGame.url);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && (event.data.type === "GAME_FINISHED" || event.data.type === "GAME_SCORE")) {
        const { score, game } = event.data;
        
        const gameUrls = Object.values(games).map(g => new URL(g.url).origin);
        const allowedOrigins = [...gameUrls, 'null']; // Allow 'null' origin for local development
        if (!allowedOrigins.includes(event.origin)) {
          console.error('Invalid origin:', event.origin);
          return;
        }

        if (publicKey && sessionToken && signMessage) {
          const walletAddress = publicKey.toBase58();
          try {
            const timestamp = Date.now();
            const signatureMessage = `Game:${game},Score:${score},Session:${sessionToken},Timestamp:${timestamp}`;
            const encodedMessage = new TextEncoder().encode(signatureMessage);
            
            const signatureBytes = await signMessage(encodedMessage);
            const clientSignature = bs58.encode(signatureBytes);

            const response = await fetch(`${API_URL}/api/score`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                wallet: walletAddress,
                game: game,
                score,
                sessionToken,
                clientSignature,
                signatureMessage
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Failed to save score:", errorText);
            } else {
              console.log("Score saved successfully for game:", game);
            }
          } catch (err) {
            console.error("Error submitting score:", err);
          }
        } else {
          console.log("Either wallet not connected, session missing, or signMessage unavailable; score not saved.");
        }
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [publicKey, sessionToken, signMessage, games]);

  return (
    <div className="relative">
      <HeaderBar />
      <RetroGrid />
      {showRegistrationModal && isRegistered === false && (
        <UserRegistrationModal 
          onComplete={(finalName) => {
            setShowRegistrationModal(false);
            setIsRegistered(true);
            localStorage.setItem("registered", "true");
            localStorage.setItem("userName", finalName);
          }} 
        />
      )}
      <div className="relative z-10">
        <ThreeDCarousel onItemClick={handleGameSelect} />
      </div>
      {selectedGameUrl && (
        <GameModal
          gameUrl={selectedGameUrl}
          onClose={() => {
            setSelectedGameUrl(null);
            setSessionToken(null); 
          }}
        />
      )}
      {showOfflineWarning && pendingGameUrl && (
        <OfflineWarningModal
          onContinue={() => {
            setSelectedGameUrl(pendingGameUrl);
            setShowOfflineWarning(false);
            setPendingGameUrl(null);
          }}
          onCancel={() => {
            setShowOfflineWarning(false);
            setPendingGameUrl(null);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home route */}
        <Route path="/" element={<Home />} />
        {/* Leaderboard route */}
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
