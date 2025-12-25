import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Flame, Sparkles } from "lucide-react";
import { MarketCard } from "./MarketCard";
import { MarketDetail } from "./MarketDetail";
import { markets } from "../data/markets";
import { Market } from "../types";
import { useTonAddress, useTonWallet } from "@tonconnect/ui-react";

function getUsername(address: string) {
  if (!address) return "";
  return localStorage.getItem(`qmvp_username_${address}`) || "";
}

const TOP5 = ["bitcoin", "ethereum", "solana", "bnb", "ton"];

export function HomeScreen() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const wallet = useTonWallet();
  const address = useTonAddress();

  const username = address ? getUsername(address) : "";
  const isConnected = !!wallet && !!address;

  const quickMarkets = useMemo(() => {
    const COINS: Array<{ id: string; name: string; symbol: string; cgId: string; image: string }> = [
      {
        id: "q15_bitcoin",
        name: "Bitcoin",
        symbol: "BTC",
        cgId: "bitcoin",
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      },
      {
        id: "q15_ethereum",
        name: "Ethereum",
        symbol: "ETH",
        cgId: "ethereum",
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      },
      {
        id: "q15_solana",
        name: "Solana",
        symbol: "SOL",
        cgId: "solana",
        image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      },
      {
        id: "q15_binancecoin",
        name: "BNB",
        symbol: "BNB",
        cgId: "binancecoin",
        image: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png",
      },
      {
        id: "q15_ton",
        name: "TON",
        symbol: "TON",
        cgId: "the-open-network",
        image: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png",
      },
    ];

    const now = new Date();
    const end = new Date(now.getTime() + 15 * 60 * 1000);

    return COINS.map((c) => ({
      id: c.id,
      title: `${c.symbol} up in the next 15 minutes?`,
      category: "crypto",
      image: c.image,
      yesPrice: 50,
      noPrice: 50,
      volume: 0,
      endDate: end.toISOString(),
      description: `Quick 15m market. Predict whether ${c.symbol} will be higher than the start price when the timer ends.`,
      isTrending: true,
      // @ts-expect-error - demo-only field used by MarketDetail
      cgId: c.cgId,
    }));
  }, []);

  const otherMarkets = useMemo(() => {
    // Keep the rest for browsing
    const pickedIds = new Set(quickMarkets.map((m) => m.id));
    return markets.filter((m) => !pickedIds.has(m.id));
  }, [quickMarkets]);

  if (selectedMarket) {
    return <MarketDetail market={selectedMarket} onClose={() => setSelectedMarket(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#070A07] pb-24">
      {/* Header */}
      <div className="px-4 pt-6">
        <div className="q-glass-strong relative overflow-hidden p-6">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[rgb(var(--q-primary))]/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[rgb(var(--q-surface))]/20 blur-3xl" />
          <div className="text-center">
            <div className="text-[rgb(var(--q-text))] text-2xl font-semibold tracking-tight">
              Welcome to Quicky
            </div>

            {username ? (
              <div className="mt-2 text-[rgb(var(--q-text))] text-3xl font-semibold">@{username}</div>
            ) : (
              <div className="mt-2 text-[rgb(var(--q-text))] text-3xl font-semibold">Quicky Alpha</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick 15m markets */}

      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-300" />
          <h2 className="text-white font-semibold">Quick 15m</h2>
          <span className="text-xs text-white/50">Top markets</span>
        </div>

        <div className="space-y-3">
          {quickMarkets.map((market) => (
            <div key={market.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{market.title}</p>
                  <p className="text-[#93A4C7] text-xs mt-1">
                    Next 15 minutes · Pick a side (MVP demo)
                  </p>
                </div>
                <button
                  className="ml-3 text-xs text-white/60 hover:text-white transition"
                  onClick={() => setSelectedMarket(market)}
                >
                  Details
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1 h-11 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 border border-emerald-400/20 active:scale-[0.99] transition"
                  onClick={() => setSelectedMarket(market)}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Up
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-100 border border-rose-400/20 active:scale-[0.99] transition"
                  onClick={() => setSelectedMarket(market)}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Down
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse */}
      <div className="px-4 mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-300" />
          <h2 className="text-white font-semibold">Browse markets</h2>
        </div>
        <div className="space-y-3">
          {otherMarkets.slice(0, 8).map((market) => (
            <MarketCard key={market.id} market={market} onClick={() => setSelectedMarket(market)} />
          ))}
        </div>
      </div>
    </div>
  );
}
