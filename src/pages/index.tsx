import Head from "next/head";
import { CardanoWallet, useWallet } from "@meshsdk/react";
import { useEffect, useState } from "react";
import FortuneChat from "../components/FortuneChat";

export default function Home() {
  const { connected } = useWallet();
  const [showChat, setShowChat] = useState(false);

  // Add delay before showing chat to allow wallet animation to complete
  useEffect(() => {
    if (connected) {
      const timer = setTimeout(() => setShowChat(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowChat(false);
    }
  }, [connected]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white">
      <Head>
        <title>Mystic Fortune Teller</title>
        <meta name="description" content="AI-powered Cardano Fortune Teller" />
      </Head>

      <main className="container mx-auto px-4 min-h-screen relative">
        {/* Wallet Container with Animation */}
        <div
          className={`transition-all duration-1000 ease-in-out ${
            connected
              ? "absolute top-4 right-4"
              : "flex justify-center pt-24"
          }`}
        >
          <CardanoWallet />
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center">
          <h1 className="text-5xl font-bold text-center mt-12 mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Mystic Fortune Teller
          </h1>

          {!connected && (
            <div className="text-xl text-center text-purple-200 mt-8 animate-pulse">
              Connect your wallet to reveal your mystical fortune...
            </div>
          )}

          {/* Fortune Teller Chat */}
          <div className={`w-full max-w-2xl transition-opacity duration-1000 ${
            showChat ? "opacity-100" : "opacity-0"
          }`}>
            {showChat && <FortuneChat />}
          </div>
        </div>
      </main>
    </div>
  );
}
