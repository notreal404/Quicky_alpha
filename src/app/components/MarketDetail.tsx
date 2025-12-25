import { useEffect, useMemo, useState } from "react";
import { Market } from "../types";
import { X, Clock, TrendingUp, DollarSign, Info } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Input } from "./ui/input";

interface MarketDetailProps {
  market: Market;
  onClose: () => void;
}

type QuickPoint = { t: number; p: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPrice(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function getQuickCgId(market: Market): string | null {
  // @ts-expect-error demo-only field
  const injected = market.cgId as string | undefined;
  if (injected) return injected;

  if (market.id.startsWith("q15_")) {
    const key = market.id.replace("q15_", "");
    if (key === "ton") return "the-open-network";
    return key; // bitcoin, ethereum, solana, binancecoin
  }

  return null;
}

function getSensitivity(cgId: string) {
  switch (cgId) {
    case "bitcoin":
      return 8;
    case "ethereum":
      return 10;
    case "solana":
      return 14;
    case "binancecoin":
      return 12;
    case "the-open-network":
      return 14;
    default:
      return 10;
  }
}

function LineChart({ points }: { points: QuickPoint[] }) {
  const w = 320;
  const h = 140;

  const { minP, maxP } = useMemo(() => {
    if (points.length === 0) return { minP: 0, maxP: 1 };
    const ps = points.map((x) => x.p);
    const minP = Math.min(...ps);
    const maxP = Math.max(...ps);
    const range = (maxP - minP);
    // Make small moves visible: avoid huge padding based on absolute price.
    const pad = (range * 0.25) || (maxP * 0.0002) || 1;
    return { minP: minP - pad, maxP: maxP + pad };
  }, [points]);

  const d = useMemo(() => {
    if (points.length < 2) return "";
    const xs = points.map((_, i) => (i / (points.length - 1)) * w);
    const ys = points.map((pt) => {
      const t = (pt.p - minP) / (maxP - minP || 1);
      return h - t * h;
    });

    let path = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
    for (let i = 1; i < xs.length; i++) {
      path += ` L ${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`;
    }
    return path;
  }, [points, minP, maxP]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="text-xs text-white/60">Price</div>
      </div>

      <div className="px-2 pb-4">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[160px]">
          <defs>
            <linearGradient id="qmvpLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(120, 180, 255, 0.95)" />
              <stop offset="100%" stopColor="rgba(180, 120, 255, 0.95)" />
            </linearGradient>
            <linearGradient id="qmvpFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(120, 180, 255, 0.20)" />
              <stop offset="100%" stopColor="rgba(120, 180, 255, 0.00)" />
            </linearGradient>
          </defs>

          {points.length >= 2 ? (
            <>
              <path d={d} fill="none" stroke="url(#qmvpLine)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#qmvpFill)" />
            </>
          ) : (
            <text x="16" y="80" fill="rgba(255,255,255,0.35)" fontSize="12">
              Loading chart…
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

export function MarketDetail({ market, onClose }: MarketDetailProps) {
  const isQuick = market.id.startsWith("q15_");
  const cgId = getQuickCgId(market);

  const [amount, setAmount] = useState("1");
  const [selectedSide, setSelectedSide] = useState<"UP" | "DOWN">("UP");

  const [points, setPoints] = useState<QuickPoint[]>([]);
  const [startPrice, setStartPrice] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [ticks, setTicks] = useState(0);

  const endTs = useMemo(() => {
    const t = Date.parse(market.endDate);
    return Number.isFinite(t) ? t : Date.now() + 15 * 60 * 1000;
  }, [market.endDate]);

  const secondsLeft = useMemo(() => Math.max(0, Math.floor((endTs - Date.now()) / 1000)), [endTs]);

  useEffect(() => {
    if (!isQuick || !cgId) return;

    let mounted = true;

    // Instant render: use cached price while we fetch fresh
    const cacheKey = `cg:lastPrice:${cgId}`;
    const cached = Number(localStorage.getItem(cacheKey));

    const seedChart = (base: number) => {
      setPoints((prev) => {
        if (prev.length) return prev;
        const now = Date.now();
        const seed: QuickPoint[] = [];
        for (let i = 20; i >= 1; i--) seed.push({ t: now - i * 10_000, p: base });
        seed.push({ t: now, p: base });
        return seed;
      });
    };

    if (Number.isFinite(cached)) {
      setCurrentPrice(cached);
      seedChart(cached);
    } else {
      // placeholder so the chart is visible immediately
      seedChart(0);
    }

    const fetchPrice = async () => {
      try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cgId)}&vs_currencies=usd`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        const p = Number(data?.[cgId]?.usd);
        if (!mounted || !Number.isFinite(p)) return;

        setCurrentPrice(p);
        setTicks((t) => t + 1);
        localStorage.setItem(`cg:lastPrice:${cgId}`, String(p));
        setPoints((prev) => {
          // replace placeholder zeros on first real tick
          if (prev.length && prev.every(x => x.p === 0)) return [{ t: Date.now(), p }];
          const next = [...prev, { t: Date.now(), p }].slice(-90);
          return next;
        });

        setStartPrice((sp) => (sp == null ? p : sp));
      } catch {
        // ignore - UI will keep last known point
      }
    };

    fetchPrice();
    const id = window.setInterval(fetchPrice, 10_000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [isQuick, cgId]);

  const delta = useMemo(() => {
    if (!Number.isFinite(currentPrice ?? NaN) || !Number.isFinite(startPrice ?? NaN)) return 0;
    return ((currentPrice! - startPrice!) / startPrice!) || 0;
  }, [currentPrice, startPrice]);

  const ready = useMemo(() => {
    return (startPrice != null && currentPrice != null && startPrice > 0 && currentPrice > 0);
  }, [startPrice, currentPrice]);

  const odds = useMemo(() => {
    if (!cgId) return { pUp: 0.5, pDown: 0.5, oddUp: 2, oddDown: 2 };
    if (!ready) return { pUp: 0.5, pDown: 0.5, oddUp: 2, oddDown: 2 };
    const K = getSensitivity(cgId);
    const pUp = clamp(0.5 + delta * K, 0.05, 0.95);
    const pDown = 1 - pUp;
    const oddUp = 1 / pUp;
    const oddDown = 1 / pDown;
    return { pUp, pDown, oddUp, oddDown };
  }, [cgId, ready, delta]);

  if (!isQuick) {
    // Legacy (Polymarket-like) market details
    return (
      <div className="min-h-screen bg-[#070A07] pb-24">
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white">Market Details</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="px-4 py-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 bg-white/5 border border-white/10">
            <ImageWithFallback src={market.image} alt={market.title} className="w-full h-full object-cover" />
          </div>

          <h1 className="text-white mb-3">{market.title}</h1>
          {market.description && <p className="text-white/60 text-sm mb-4">{market.description}</p>}

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                <DollarSign className="w-3 h-3" />
                Volume
              </div>
              <div className="text-white font-semibold">{formatMoney(market.volume)}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                <TrendingUp className="w-3 h-3" />
                YES
              </div>
              <div className="text-white font-semibold">{market.yesPrice}%</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                <Clock className="w-3 h-3" />
                Ends
              </div>
              <div className="text-white font-semibold text-sm">{new Date(market.endDate).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="px-0 mb-6">
            <h3 className="text-white mb-3">Current Odds</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-2xl border border-white/10 bg-white/5">
                <div className="text-sm text-emerald-200 mb-1">YES</div>
                <div className="text-2xl font-bold text-white">{market.yesPrice}%</div>
              </button>
              <button className="p-4 rounded-2xl border border-white/10 bg-white/5">
                <div className="text-sm text-rose-200 mb-1">NO</div>
                <div className="text-2xl font-bold text-white">{market.noPrice}%</div>
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-white/70" />
              <h3 className="text-white">Place Bet</h3>
            </div>

            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">Amount</label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>

            <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold">
              Place Bet (Demo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quick 15m market details with chart + odds (coef)
  return (
    <div className="min-h-screen bg-[#070A07] pb-28">
      <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
            <ImageWithFallback src={market.image} alt={market.title} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold truncate">{market.title}</div>
            <div className="text-xs text-white/60 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} left
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      <div className="px-4 py-6 space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-white/60">Current</div>
              <div className="text-2xl font-semibold text-white">{formatPrice(currentPrice ?? NaN)}</div>
            </div>
            <div className={`text-sm font-semibold ${delta >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
              {ready ? `${(delta * 100).toFixed(2)}%` : "—"}
            </div>
          </div>
          <div className="mt-3">
            <LineChart points={points} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedSide("UP")}
            className={`rounded-3xl border transition-all p-4 ${
              selectedSide === "UP"
                ? "border-emerald-400/60 bg-emerald-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="text-xs text-white/60">UP</div>
            <div className="text-2xl font-semibold text-white">{odds.oddUp.toFixed(2)}x</div>
            <div className="text-xs text-white/60 mt-1">Implied {ready ? `${Math.round(odds.pUp * 100)}%` : "—"}</div>
          </button>

          <button
            onClick={() => setSelectedSide("DOWN")}
            className={`rounded-3xl border transition-all p-4 ${
              selectedSide === "DOWN"
                ? "border-rose-400/60 bg-rose-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="text-xs text-white/60">DOWN</div>
            <div className="text-2xl font-semibold text-white">{odds.oddDown.toFixed(2)}x</div>
            <div className="text-xs text-white/60 mt-1">Implied {ready ? `${Math.round(odds.pDown * 100)}%` : "—"}</div>
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="text-white font-semibold mb-3">Place bet</div>

          <label className="text-xs text-white/60">Amount (TON)</label>
          <div className="mt-2">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="0.1"
            />
          </div>

          <button
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-500 hover:to-purple-500 transition-colors py-3 text-white font-semibold"
            onClick={() => {
              // Step C-2 will wire real TON tx + contract call
              alert(`Demo: Bet ${amount} TON on ${selectedSide}. Next step: real TX on testnet.`);
            }}
          >
            Bet {selectedSide}
          </button>

          <div className="mt-3 text-xs text-white/50">
            Demo odds are based on price movement from the start price (no oracle yet).
          </div>
        </div>
      </div>
    </div>
  );
}