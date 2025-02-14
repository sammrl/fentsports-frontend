// src/pages/Leaderboard.tsx
import React, { useState, useEffect } from "react";
import { RetroGrid } from "../components/ui/RetroGrid";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

// Define the games you support
const games = ['FentMan', 'FentFall', 'FlappyFloyd'];

const API_URL = import.meta.env.VITE_API_URL;

export function Leaderboard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<any[]>([]);
  const currentGame = games[currentIndex];
  const { publicKey } = useWallet();
  const [bestScore, setBestScore] = useState<any>(null);

  // Function to fetch leaderboard data for the current game
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard?game=${encodeURIComponent(currentGame)}`);
      const data = await res.json();
      if (res.ok) {
        setScores(data.scores);
      } else {
        console.error("Error fetching leaderboard:", data.error);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  // Function to fetch the user's best score
  const fetchBestScore = async () => {
    if (!publicKey) return;
    const walletAddress = publicKey.toBase58();
    try {
      const res = await fetch(
        `${API_URL}/api/bestscore?wallet=${encodeURIComponent(walletAddress)}&game=${encodeURIComponent(currentGame)}`
      );
      const data = await res.json();
      if (res.ok) {
        setBestScore(data.best);
      } else {
        console.error("Error fetching best score:", data.error);
      }
    } catch (err) {
      console.error("Error fetching best score:", err);
    }
  };

  // Fetch leaderboard data when the current game changes
  useEffect(() => {
    fetchLeaderboard();
    if (publicKey) {
      fetchBestScore();
    } else {
      setBestScore(null);
    }
  }, [currentGame, publicKey]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % games.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
  };

  return (
    <div className="relative min-h-screen">
      <RetroGrid showTitle={false} />

      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center px-4">
        <h1 className="font-silkscreen text-7xl font-bold bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text text-transparent text-center mb-4">
          LEADERBOARD
        </h1>

        <h2 className="font-silkscreen text-3xl text-white text-center mb-8">
          {currentGame}
        </h2>

        <div className="flex items-center gap-8">
          <button 
            onClick={handlePrev} 
            className="font-silkscreen text-4xl text-white hover:text-[#ff2975] transition-colors"
          >
            ←
          </button>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden w-[400px]">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#242424]/80 backdrop-blur-sm">
                  <tr className="border-b border-white/20">
                    <th className="px-6 py-3 text-left text-lg font-silkscreen text-white">
                      User
                    </th>
                    <th className="px-6 py-3 text-right text-lg font-silkscreen text-white">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!publicKey ? (
                    // When no wallet is connected, display a blinking message.
                    <tr className="bg-gradient-to-r from-gray-600 to-gray-800 animate-pulse text-white font-bold">
                      <td colSpan={2} className="px-6 py-4 font-silkscreen text-center">
                        Connect your wallet to climb the leaderboard
                      </td>
                    </tr>
                  ) : (
                    // When a wallet is connected, show the user's best score if available.
                    bestScore ? (
                      <tr className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold">
                        <td className="px-6 py-4 font-silkscreen">Your Best</td>
                        <td className="px-6 py-4 font-silkscreen text-right">{bestScore.score}</td>
                      </tr>
                    ) : (
                      <tr className="bg-gradient-to-r from-gray-400 to-gray-500 text-black font-bold">
                        <td colSpan={2} className="px-6 py-4 font-silkscreen text-center">
                          No score yet
                        </td>
                      </tr>
                    )
                  )}
                  {scores.map((entry, idx) => (
                    <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-silkscreen text-white">
                        {entry.name
                          ? entry.name
                          : `${entry.wallet.slice(0, 6)}...`}
                      </td>
                      <td className="px-6 py-4 font-silkscreen text-white text-right">
                        {entry.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            onClick={handleNext} 
            className="font-silkscreen text-4xl text-white hover:text-[#ff2975] transition-colors"
          >
            →
          </button>
        </div>

        <Link 
          to="/" 
          className="mt-8 font-silkscreen text-white hover:text-[#ff2975] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
