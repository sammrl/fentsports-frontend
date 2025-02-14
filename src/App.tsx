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
  const { publicKey, signMessage } = useWallet();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  // games with  URL and game name 
  const games: Record<string, { url: string; name: string }> = {
    game1: { url: "https://stupendous-faun-49e2f9.netlify.app/", name: "FentMan" },
    game3: { url: "https://amazing-sprinkles-bd617e.netlify.app/", name: "FentFall" },
    game2: { url: "https://fastidious-florentine-b554ce.netlify.app/", name: "FlappyFloyd" },
  };

  // When a wallet connects, check the backend to determine if registration is complete.
  useEffect(() => {
    console.log('Wallet connection changed:', publicKey?.toBase58());
    
    const checkRegistration = async () => {
      if (publicKey) {
        try {
          const walletAddress = publicKey.toBase58();
          console.log('Checking registration for wallet:', walletAddress);
          
          const response = await fetch(
            `${API_URL}/api/user?wallet=${encodeURIComponent(walletAddress)}`
          );
          const data = await response.json();
          
          console.log('Registration check response:', data);
          
          if (data.registered) {
            setIsRegistered(true);
            localStorage.setItem("userName", data.name);
            localStorage.setItem("registered", "true");
            // If no authToken is present, generate one and save it.
            if (!localStorage.getItem("authToken")) {
              const authToken = `${walletAddress}-${Date.now()}`;
              localStorage.setItem("authToken", authToken);
            }
          } else {
            setIsRegistered(false);
            setShowRegistrationModal(true);
          }
        } catch (err) {
          console.error("Error checking registration status:", err);
        }
      } else {
        // Reset states when wallet disconnects
        setIsRegistered(null);
        localStorage.removeItem("userName");
        localStorage.removeItem("registered");
        localStorage.removeItem("authToken");
      }
    };

    checkRegistration();
  }, [publicKey]);

  // Handle game selection
  const handleGameSelect = (gameKey: string) => {
    console.log('handleGameSelect called with:', gameKey);
    console.log('Wallet state:', { 
      publicKey: publicKey?.toBase58(), 
      isRegistered, 
      hasLocalStorage: !!localStorage.getItem("registered") 
    });
    
    if (!publicKey) {
      console.log('No wallet connected');
      // Prompt to connect wallet
      return;
    }

    if (!isRegistered) {
      console.log('User not registered, showing modal');
      setShowRegistrationModal(true);
      return;
    }

    const selectedGame = games[gameKey as keyof typeof games];
    if (selectedGame) {
      console.log('Setting game URL:', selectedGame.url);
      setSelectedGameUrl(selectedGame.url);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === "GAME_FINISHED") {
        const { score, game } = event.data;
        console.log("Final score received from game:", score);
        const gameName = game || "FentMan";
        if (publicKey) {
          const walletAddress = publicKey.toBase58();
          const authToken = localStorage.getItem("authToken");
          if (!authToken) {
            console.log("User is not authenticated; please register on the homepage.");
            return;
          }
          try {
            const response = await fetch(`${API_URL}/api/score`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                wallet: walletAddress,
                game: gameName,
                score,
                authToken,
              }),
            });
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Failed to save score:", errorText);
            } else {
              console.log("Score saved successfully for game:", gameName);
            }
          } catch (err) {
            console.error("Error submitting score:", err);
          }
        } else {
          console.log("Wallet not connected; score not saved.");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [publicKey]);

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
          onClose={() => setSelectedGameUrl(null)}
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
