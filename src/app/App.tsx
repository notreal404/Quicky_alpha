import { useEffect, useMemo, useState } from "react";
import { Gift, House, TrendingUp, Wallet } from "lucide-react";
import { useTonAddress, useTonWallet } from "@tonconnect/ui-react";

import { HomeScreen } from "./components/HomeScreen";
import { TrendingScreen } from "./components/TrendingScreen";
import { PortfolioScreen } from "./components/PortfolioScreen";
import { AirdropScreen } from "./components/AirdropScreen";

type TabType = "home" | "trending" | "portfolio" | "airdrop";

function getRefParam(): string | null {
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    return ref ? ref.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

function getReferralCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem("qmvp_ref_counts");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveReferralCounts(counts: Record<string, number>) {
  localStorage.setItem("qmvp_ref_counts", JSON.stringify(counts));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("home");

  const wallet = useTonWallet();
  const address = useTonAddress();
  const isConnected = !!wallet && !!address;

  // Telegram WebApp init
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
  }, []);

  // MVP referral capture (local-only): /?ref=xxx
  useEffect(() => {
    if (!isConnected) return;

    const ref = getRefParam();
    if (!ref) return;

    const appliedKey = `qmvp_ref_applied_${address}`;
    if (localStorage.getItem(appliedKey)) return;

    // Don't self-refer
    const self = (localStorage.getItem(`qmvp_username_${address}`) || address).toLowerCase();
    if (ref === self) {
      localStorage.setItem(appliedKey, "1");
      return;
    }

    const counts = getReferralCounts();
    counts[ref] = Number(counts[ref] || 0) + 1;
    saveReferralCounts(counts);

    localStorage.setItem(appliedKey, "1");
  }, [isConnected, address]);

  const renderScreen = useMemo(() => {
    switch (activeTab) {
      case "home":
        return <HomeScreen />;
      case "trending":
        return <TrendingScreen />;
      case "portfolio":
        return <PortfolioScreen />;
      case "airdrop":
        return <AirdropScreen />;
      default:
        return <HomeScreen />;
    }
  }, [activeTab]);

  return (
    <div className="dark min-h-screen bg-[#050B1A]">
      {/* Main Content */}
      <div className="relative">{renderScreen}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 q-glass-strong">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4 h-20">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "home" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <House className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </button>

            <button
              onClick={() => setActiveTab("trending")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "trending" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Trending</span>
            </button>

            <button
              onClick={() => setActiveTab("portfolio")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "portfolio" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Portfolio</span>
            </button>

            <button
              onClick={() => setActiveTab("airdrop")}
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "airdrop" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <Gift className="w-5 h-5" />
              <span className="text-xs">Airdrop</span>
              {/* small pulse dot */}
              <div className="absolute top-2 right-8 w-2 h-2 bg-blue-400 rounded-full" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
