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
import { ShareConfirmModal } from "./components/ShareConfirmModal";
import { JwtPayload } from 'jsonwebtoken';

const API_URL = import.meta.env.VITE_API_URL;

// Add this type declaration for window.getSessionToken
declare global {
  interface Window {
    getSessionToken: () => string | null;
  }
}

// Update the decodeJWT function to handle the token as a base64 string
function decodeJWT(token: string): JwtPayload | null {
  try {
    // Split the token to get the payload (the second part)
    const base64Payload = token.split('.')[1];
    // Decode the base64 payload using the browser's atob function
    const jsonPayload = decodeURIComponent(
      atob(base64Payload)
        .split('')
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding JWT:", e);
    return null;
  }
}

function Home() {
  const [selectedGameUrl, setSelectedGameUrl] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [pendingGameUrl, setPendingGameUrl] = useState(null);
  const { publicKey, signMessage } = useWallet();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  // NEW: State for share data and confirmation modal
  const [shareData, setShareData] = useState<{ score: number; game: string } | null>(null);
  const [showShareConfirm, setShowShareConfirm] = useState(false);

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

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Log the received event so we know if the game is posting messages at all
      console.log("Received message event:", { origin: event.origin, data: event.data });

      // Try to parse game URLs from your games array
      const gameUrls = Object.values(games).map(g => {
        try {
          return new URL(g.url).origin;
        } catch (e) {
          console.error("Error parsing game url for:", g);
          return "";
        }
      });

      // For local development, add extra allowed origins
      const allowedOrigins = [
        "https://fentsports.win",
        "https://www.fentsports.win",
        "http://fentsports.win",
        "http://www.fentsports.win",
        "https://effortless-marshmallow-2f2b8c.netlify.app",
        "https://eloquent-cascaron-0d6d10.netlify.app",
        "https://delicate-fox-bec4e2.netlify.app",
        "http://localhost:5173",
        "http://localhost:10000",
        "null"
      ];
      if (!allowedOrigins.includes(event.origin)) {
        console.error('Rejected message from invalid origin:', event.origin, 'Allowed origins:', allowedOrigins);
        return;
      }

      // Handle both GAME_SCORE and GAME_FINISHED events
      if (event.data && (event.data.type === "GAME_SCORE" || event.data.type === "GAME_FINISHED")) {
        console.log("Processing game score event:", event.data);
        
        if (!publicKey || !sessionToken || !signMessage) {
          console.log("Missing required credentials:", {
            hasPublicKey: !!publicKey,
            hasSessionToken: !!sessionToken,
            hasSignMessage: !!signMessage
          });
          return;
        }

        // Add game-specific validation
        if (event.data.game) {
          const sessionGame = sessionToken ? decodeJWT(sessionToken)?.game : null;
          if (sessionGame !== event.data.game) {
            console.error("Game mismatch between session and score submission");
            return;
          }
        }

        const walletAddress = publicKey.toBase58();
        try {
          const timestamp = Date.now();
          const score = event.data.score;
          const game = event.data.game || Object.keys(games).find(key => games[key].name === event.data.game);
          
          console.log("Preparing score submission:", { game, score, wallet: walletAddress });

          const signatureMessage = `Game:${game},Score:${score},Session:${sessionToken},Timestamp:${timestamp}`;
          const encodedMessage = new TextEncoder().encode(signatureMessage);
          const signatureBytes = await signMessage(encodedMessage);
          const clientSignature = bs58.encode(signatureBytes);

          console.log("Submitting score to API...");
          const response = await fetch(`${API_URL}/api/score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              wallet: walletAddress,
              game,
              score,
              sessionToken,
              clientSignature,
              signatureMessage,
            }),
          });

          const responseText = await response.text();
          console.log("API Response:", response.status, responseText);

          if (!response.ok) {
            throw new Error(`Failed to save score: ${responseText}`);
          }

          console.log("Score saved successfully for game:", game);
          if (!shareData) {
            setShareData({ score, game });
          }
        } catch (err) {
          console.error("Error submitting score:", err);
        }
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [publicKey, sessionToken, signMessage, games, shareData]);

  // Remove the handleMessage from handleGameSelect
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
      const sessionResponse = await fetch(`${API_URL}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          game: gameKey,
          origin: window.location.origin
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error(`HTTP error! status: ${sessionResponse.status}`);
      }

      const { sessionToken: newSessionToken } = await sessionResponse.json();
      setSessionToken(newSessionToken);
      setSelectedGameUrl(selectedGame.url);
    } catch (error) {
      console.error("Error starting game session:", error);
      setSelectedGameUrl(selectedGame.url);
    }
  };

  // NEW: Function to get the placard image URL based on game key
  function getPlacardForGame(game: string): string {
    if (game === "FentMan") {
      return "https://firebasestorage.googleapis.com/v0/b/fentsports-a8133.firebasestorage.app/o/twitter%2Fxgame1.png?alt=media&token=40b0202b-961b-41ea-a0f6-1b1f5dc11882";
    } else if (game === "FentFall") {
      return "https://firebasestorage.googleapis.com/v0/b/fentsports-a8133.firebasestorage.app/o/twitter%2Fxgame2.png?alt=media&token=40b0202b-961b-41ea-a0f6-1b1f5dc11882";
    } else if (game === "FentaPiller") {
      return "https://firebasestorage.googleapis.com/v0/b/fentsports-a8133.firebasestorage.app/o/twitter%2Fxgame3.png?alt=media&token=40b0202b-961b-41ea-a0f6-1b1f5dc11882";
    }
    return "";
  }

  // NEW: Handler for when the user confirms share
  async function handleShareConfirm() {
    if (!shareData || !publicKey) return;
    // Track share in the database
    await fetch(`${API_URL}/api/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet: publicKey.toString(),
        game: shareData.game,
        score: shareData.score,
        timestamp: Date.now(),
      }),
    });

    // Build tweet text and URL
    const tweetText = encodeURIComponent(
      `I just scored ${shareData.score} in ${shareData.game}! fentsports.netlify.app - Play now for rewards!`
    );
    // Twitter web intent expects hashtags as a comma-separated list without the '#' symbol
    const hashtags = "pumpfun,memecoins,solana,georgefloyd,BLM";
    // We're including fentsports.netlify.app as the URL parameter so that if you set up Twitter Cards on that site, the correct placard appears
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(
      "https://fentsports.netlify.app"
    )}&hashtags=${hashtags}`;

    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    setShowShareConfirm(false);
  }

  // Expose session token to games
  window.getSessionToken = () => sessionToken;

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
      {/* UPDATED: Render share button positioned at the bottom center on top of game window */}
      {shareData && (
        <button
          onClick={() => setShowShareConfirm(true)}
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999, // bring the button to the front
            padding: "10px 20px",
            fontSize: "18px",
            fontFamily: "silkscreen",
            background: "linear-gradient(135deg, #ff2975, #8c1eff)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Share on Twitter
        </button>
      )}
      {/* NEW: Render confirmation modal when needed */}
      {showShareConfirm && (
        <ShareConfirmModal
          message="Share your score on Twitter?"
          onConfirm={handleShareConfirm}
          onCancel={() => setShowShareConfirm(false)}
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
