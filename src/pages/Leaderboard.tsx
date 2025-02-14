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

  // Toggle state for leaderboard view mode: "current" or "alltime"
  const [viewMode, setViewMode] = useState<'current' | 'alltime'>("current");

  // Placeholder data for All Time leaderboard
  const placeholderAllTimeScores = [
    { name: "Alice", wallet: "0xAlice", score: 10000 },
    { name: "Bob", wallet: "0xBob", score: 9000 },
    { name: "Charlie", wallet: "0xCharlie", score: 8000 },
    { name: "Dave", wallet: "0xDave", score: 7500 },
    { name: "Eve", wallet: "0xEve", score: 7000 },
  ];

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

  // Fetch leaderboard data when the current game or view mode changes (for current leaderboard)
  useEffect(() => {
    if (viewMode === "current") {
      fetchLeaderboard();
      if (publicKey) {
        fetchBestScore();
      } else {
        setBestScore(null);
      }
    }
  }, [currentGame, publicKey, viewMode]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % games.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
  };

  // Determine which scores to display based on view mode
  const displayScores = viewMode === "current" ? scores : placeholderAllTimeScores;

  return (
    <div className="relative min-h-screen">
      <RetroGrid showTitle={false} />

      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center px-4">
        <h1 className="font-silkscreen text-7xl font-bold bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text text-transparent text-center mb-4">
          LEADERBOARD
        </h1>

        <h2 className="font-silkscreen text-3xl text-white text-center mb-4">
          {currentGame}
          {viewMode === "alltime" && " (All Time)"}
        </h2>

        {/* Retro styled toggle control */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setViewMode("current")}
            className={`px-4 py-2 font-silkscreen text-lg border rounded-md transition-colors ${
              viewMode === "current"
                ? "bg-gradient-to-r from-[#ffd319] to-[#8c1eff] text-white"
                : "bg-transparent text-white border-white hover:bg-white/10"
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setViewMode("alltime")}
            className={`px-4 py-2 font-silkscreen text-lg border rounded-md transition-colors ${
              viewMode === "alltime"
                ? "bg-gradient-to-r from-[#ffd319] to-[#8c1eff] text-white"
                : "bg-transparent text-white border-white hover:bg-white/10"
            }`}
          >
            All Time
          </button>
        </div>

        <div className="flex items-center gap-8">
          {/* Only show carousel navigation for the current leaderboard */}
          {viewMode === "current" && (
            <button
              onClick={handlePrev}
              className="font-silkscreen text-4xl text-white hover:text-[#ff2975] transition-colors"
            >
              ←
            </button>
          )}

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden w-[400px]">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#242424]/80 backdrop-blur-sm">
                  <tr className="border-b border-white/20">
                    <th className="px-6 py-3 text-left text-lg font-silkscreen text-white">#</th>
                    <th className="px-6 py-3 text-left text-lg font-silkscreen text-white">User</th>
                    <th className="px-6 py-3 text-right text-lg font-silkscreen text-white">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {!publicKey ? (
                    <tr className="bg-gradient-to-r from-gray-600 to-gray-800 animate-pulse text-white font-bold">
                      <td colSpan={3} className="px-6 py-4 font-silkscreen text-center">
                        Connect your wallet to climb the leaderboard
                      </td>
                    </tr>
                  ) : (
                    // For current mode, show the best score row if available
                    viewMode === "current" && bestScore ? (
                      <tr className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold">
                        <td className="px-6 py-4 font-silkscreen">Your Best</td>
                        <td className="px-6 py-4 font-silkscreen">{bestScore.name || "User"}</td>
                        <td className="px-6 py-4 font-silkscreen text-right">{bestScore.score}</td>
                      </tr>
                    ) : viewMode === "current" && !bestScore ? (
                      <tr className="bg-gradient-to-r from-gray-400 to-gray-500 text-black font-bold">
                        <td colSpan={3} className="px-6 py-4 font-silkscreen text-center">
                          No score yet
                        </td>
                      </tr>
                    ) : null
                  )}
                  {displayScores.map((entry, idx) => (
                    <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-silkscreen text-white">
                        {viewMode === "current" ? (
                          idx < 10 ? (
                            <span className="inline-flex items-center">
                              <img
                                src="/images/symbol.png"
                                alt="symbol"
                                className="w-4 h-4 mx-2"
                              />
                              <span className="w-10 block text-right">{idx + 1}</span>
                            </span>
                          ) : (
                            <span className="block text-right w-10">{idx + 1}</span>
                          )
                        ) : (
                          <span className="block text-right w-10">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-silkscreen text-white">
                        {entry.name ? entry.name : `${entry.wallet.slice(0, 6)}...`}
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

          {viewMode === "current" && (
            <button
              onClick={handleNext}
              className="font-silkscreen text-4xl text-white hover:text-[#ff2975] transition-colors"
            >
              →
            </button>
          )}
        </div>

        {/* For current mode only, display the rewards info */}
        {viewMode === "current" && (
          <div className="flex items-center mt-4">
            <img src="/images/symbol.png" alt="symbol" className="w-4 h-4 mx-2" />
            <span className="font-silkscreen text-white">= qualifies for rewards!</span>
          </div>
        )}

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
