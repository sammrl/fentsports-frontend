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

function Home() {
  const [selectedGameUrl, setSelectedGameUrl] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { publicKey, signMessage } = useWallet();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  // games with URL and game name 
  const games: Record<string, { url: string; name: string }> = {
    FentMan: { url: "https://effortless-marshmallow-2f2b8c.netlify.app/", name: "FentMan" },
    FentFall: { url: "https://amazing-sprinkles-bd617e.netlify.app/", name: "FentFall" },
    FlappyFloyd: { url: "https://fastidious-florentine-b554ce.netlify.app/", name: "FlappyFloyd" },
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

    // Set up message handler for receiving scores from the game iframe
    window.addEventListener('message', async (event) => {
      // Verify the origin matches one of your game URLs
      const gameUrls = Object.values(games).map(g => new URL(g.url).origin);
      if (!gameUrls.includes(event.origin)) return;

      if (event.data.type === 'GAME_SCORE') {
        const score = event.data.score;
        console.log(`Received score from game: ${score}`);
        
        try {
          // Create the message to sign
          const message = `Submit score of ${score} for ${gameKey}`;
          const encodedMessage = new TextEncoder().encode(message);
          
          // Sign the message
          const signature = await signMessage(encodedMessage);
          
          // Submit the score
          const response = await fetch(`${API_URL}/api/score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wallet: publicKey.toString(),
              game: gameKey,
              score: score,
              signature: signature,
              message: message
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          console.log('Score submitted successfully');
        } catch (error) {
          console.error('Error submitting score:', error);
        }
      }
    });

    // Launch the game
    setSelectedGameUrl(selectedGame.url);
  };

  // Listen for game finished event and submit the score along with a cryptographic signature
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === "GAME_FINISHED") {
        const { score, game } = event.data;
        console.log("Final score received from game:", score);
        if (publicKey && sessionToken && signMessage) {
          const walletAddress = publicKey.toBase58();
          const timestamp = Date.now();
          // Create a message string that includes game, score, session token, and timestamp.
          const signatureMessage = `Game:${game},Score:${score},Session:${sessionToken},Timestamp:${timestamp}`;
          try {
            const signatureBytes = await signMessage(new TextEncoder().encode(signatureMessage));
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
                signatureMessage,
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
  }, [publicKey, sessionToken, signMessage]);

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
