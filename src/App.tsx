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

const API_URL = import.meta.env.VITE_API_URL;

const GAME_SECRETS: Record<string, string> = {
  FentMan: import.meta.env.VITE_FENTMAN_SECRET || "default_secret_1",
  FentFall: import.meta.env.VITE_FENTFALL_SECRET || "default_secret_2",
  FentaPiller: import.meta.env.VITE_FENTAPILLER_SECRET || "default_secret_3",
};

function Home() {
  const [selectedGameUrl, setSelectedGameUrl] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { publicKey, signMessage } = useWallet();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  // games with URL and game name 
  const games: Record<string, { url: string; name: string }> = {
    FentMan: { url: "https://effortless-marshmallow-2f2b8c.netlify.app/", name: "FentMan" },
    FentFall: { url: "https://wonderful-brioche-ef39ad.netlify.app/", name: "FentFall" },
    FentaPiller: { url: "https://benevolent-eclair-4b23fd.netlify.app/", name: "FentaPiller" },
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
      setSelectedGameUrl(selectedGame.url);
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

      // Set up message handler for receiving scores from the game iframe
      const handleMessage = async (event: MessageEvent) => {
        // Verify the origin matches one of your game URLs
        const gameUrls = Object.values(games).map(g => new URL(g.url).origin);
        if (!gameUrls.includes(event.origin)) return;

        if (event.data.type === 'GAME_SCORE') {
          const score = event.data.score;
          console.log(`Received score from game: ${score}`);
          
          try {
            // Create the message to sign
            const timestamp = Date.now();
            const signatureMessage = `Game:${gameKey},Score:${score},Session:${sessionToken},Timestamp:${timestamp}`;
            const encodedMessage = new TextEncoder().encode(signatureMessage);
            
            // Sign the message
            const signatureBytes = await signMessage(encodedMessage);
            const clientSignature = bs58.encode(signatureBytes);
            
            // Submit the score with session token and signature
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

      // Add the message listener
      window.addEventListener('message', handleMessage);

      // Launch the game
      setSelectedGameUrl(selectedGame.url);

      // Return cleanup function to remove event listener when game closes
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

  // Listen for game finished event and submit the score along with a cryptographic signature
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Check if it's a game message
      if (event.data && (event.data.type === "GAME_FINISHED" || event.data.type === "GAME_SCORE")) {
        const { score, game } = event.data;
        
        // Verify the game origin
        const gameUrls = Object.values(games).map(g => new URL(g.url).origin);
        if (!gameUrls.includes(event.origin)) {
          console.error('Invalid origin:', event.origin);
          return;
        }

        if (publicKey && sessionToken && signMessage) {
          const walletAddress = publicKey.toBase58();
          try {
            // Create the message to sign
            const timestamp = Date.now();
            const signatureMessage = `Game:${game},Score:${score},Session:${sessionToken},Timestamp:${timestamp}`;
            const encodedMessage = new TextEncoder().encode(signatureMessage);
            
            // Sign the message
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
            setSessionToken(null); // clear session token when game modal closes
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
        {/* Home route: shows your main game view */}
        <Route path="/" element={<Home />} />
        {/* Leaderboard route: shows the leaderboard page */}
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
