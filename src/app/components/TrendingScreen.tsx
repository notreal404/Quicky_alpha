import { useState } from "react";
import { Flame } from "lucide-react";
import { MarketCard } from "./MarketCard";
import { MarketDetail } from "./MarketDetail";
import { markets } from "../data/markets";
import { Market } from "../types";

export function TrendingScreen() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const trendingMarkets = markets.filter((m) => m.isTrending);

  if (selectedMarket) {
    return <MarketDetail market={selectedMarket} onClose={() => setSelectedMarket(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#070A07] pb-20">
      {/* Header (not sticky) */}
      <div className="px-4 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <h1 className="text-[rgb(var(--q-text))] text-lg font-semibold">Trending</h1>
            <p className="text-[#93A4C7] text-sm">Markets getting the most action</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-3">
        {trendingMarkets.map((market) => (
          <MarketCard key={market.id} market={market} onClick={() => setSelectedMarket(market)} />
        ))}
      </div>
    </div>
  );
}
