import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

const API_URL = import.meta.env.VITE_API_URL;

interface UserRegistrationModalProps {
  onComplete: (registeredName: string) => void;
}

export function UserRegistrationModal({ onComplete }: UserRegistrationModalProps) {
  const { publicKey, signMessage } = useWallet();
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const buttonLabel = inputName.length > 0 ? "Enter" : "Skip";

  const handleSubmit = async () => {
    if (!publicKey) {
      console.error("No wallet connected.");
      return;
    }
    
    setLoading(true);
    const walletAddress = publicKey.toBase58();
    const timestamp = Date.now();
    
    // Trim the input to remove any accidental whitespace.
    const trimmedName = inputName.trim();
    // Use trimmedName if provided; if not, default to a truncated wallet address.
    const finalName =
      trimmedName.length > 0 ? trimmedName.substring(0, 10) : `${walletAddress.substring(0, 6)}...`;
    
    try {
      let response;
      
      if (trimmedName.length > 0) {
        // Normal flow: require signature when a real name is provided.
        if (!signMessage) {
          console.error("Wallet does not support signMessage. Registration cannot proceed.");
          setLoading(false);
          return;
        }
        
        const registrationMessage = `Register:${walletAddress},Name:${finalName},Timestamp:${timestamp}`;
        const messageBytes = new TextEncoder().encode(registrationMessage);
        console.log("Requesting signature for registration message:", registrationMessage);
        const signatureBytes = await signMessage(messageBytes);
        const signature = bs58.encode(signatureBytes);
        console.log("Received signature:", signature);
        
        response = await fetch(`${API_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: walletAddress,
            signature,
            message: registrationMessage,
            name: finalName,
            skip: false,
          }),
        });
      } else {
        // Skip flow: no signature required
        response = await fetch(`${API_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: walletAddress,
            signature: "",
            message: "",
            name: finalName, // This will be the truncated wallet address
            skip: true,
          }),
        });
      }
      
      if (!response.ok) {
        console.error("Registration failed", await response.text());
      } else {
        console.log("Registration successful");
        // Store auth token consistently for both flows
        const authToken = `${walletAddress}-${timestamp}`;
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("userName", finalName);
        localStorage.setItem("registered", "true");
        onComplete(finalName);
      }
    } catch (error) {
      console.error("Error during registration:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gradient-to-r from-gray-600 to-gray-800 p-4 rounded-lg shadow-lg w-80">
        <p className="text-white font-silkscreen text-center mb-4">
          Enter your name (max 10 characters)
        </p>
        <input 
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value.slice(0, 10))}
          maxLength={10}
          placeholder="Your Name"
          className="w-full p-2 rounded-md mb-4 bg-white text-black font-silkscreen"
        />
        <button 
          onClick={handleSubmit} 
          className="w-full py-2 bg-gradient-to-r from-[#ff2975] to-[#8c1eff] rounded-md text-white font-silkscreen"
          disabled={loading}
        >
          {loading ? "Loading..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}