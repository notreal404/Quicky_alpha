import { Market } from '../types';
import { Clock, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MarketCardProps {
  market: Market;
  onClick?: () => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol}`;
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Ended';
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day';
    return `${diff} days`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-white/6 to-white/3 border border-white/10 rounded-2xl p-4 cursor-pointer hover:border-white/20 transition-all active:scale-[0.98]"
    >
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
          <ImageWithFallback
            src={market.image}
            alt={market.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[rgb(var(--q-text))] line-clamp-2 mb-1">{market.title}</p>
          <div className="flex items-center gap-2 text-xs text-[#93A4C7]">
            <Clock className="w-3 h-3" />
            <span>{getDaysRemaining(market.endDate)}</span>
            {market.isTrending && (
              <>
                <span>•</span>
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Trending</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border border-emerald-800/50 rounded-xl p-3">
          <div className="text-xs text-emerald-400 mb-1">YES</div>
          <div className="text-emerald-300">{market.yesPrice}¢</div>
        </div>
        <div className="bg-gradient-to-br from-rose-950/50 to-rose-900/30 border border-rose-800/50 rounded-xl p-3">
          <div className="text-xs text-rose-400 mb-1">NO</div>
          <div className="text-rose-300">{market.noPrice}¢</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[rgb(var(--q-text))]/50">Volume</span>
        <span className="text-[rgb(var(--q-text))]/70">{formatVolume(market.volume)}</span>
      </div>
    </div>
  );
}
