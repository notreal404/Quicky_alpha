import { useEffect, useMemo, useState } from "react";
import { Copy, Gift, Sparkles, Users } from "lucide-react";
import { Button } from "./ui/button";
import { useTonAddress, useTonWallet } from "@tonconnect/ui-react";

function getUsername(address: string) {
  if (!address) return "";
  return localStorage.getItem(`qmvp_username_${address}`) || "";
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

export function AirdropScreen() {
  const wallet = useTonWallet();
  const address = useTonAddress();
  const username = address ? getUsername(address) : "";
  const isConnected = !!wallet && !!address;

  const [copied, setCopied] = useState(false);
  const [refCount, setRefCount] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      setRefCount(0);
      return;
    }
    const counts = getReferralCounts();
    const key = (username || address).toLowerCase();
    setRefCount(Number(counts[key] || 0));
  }, [isConnected, address, username]);

  const referralMultiplier = useMemo(() => {
    // 0.1x per referral, 10 refs = 1x
    return Math.round(refCount * 0.1 * 10) / 10;
  }, [refCount]);

  const totalMultiplier = useMemo(() => {
    return 1 + referralMultiplier; // NFT multiplier coming soon
  }, [referralMultiplier]);

  const referralLink = useMemo(() => {
    const origin = window.location.origin;
    const ref = encodeURIComponent((username || address || "anon").toLowerCase());
    return `${origin}/?ref=${ref}`;
  }, [username, address]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#050B1A] pb-20">
      <div className="px-4 pt-6">
        <h1 className="text-[rgb(var(--q-text))] text-lg font-semibold">Airdrop</h1>
        <p className="text-[#93A4C7] text-sm">Rewards hub for early users</p>
      </div>

      {/* Banner */}
      <div className="px-4 mt-5">
        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-200" />
            </div>
            <div className="min-w-0">
              <p className="text-[rgb(var(--q-text))] font-medium">Token coming soon</p>
              <p className="text-[#93A4C7] text-xs mt-1">
                Points & multipliers will convert to rewards at TGE.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon blocks */}
      <div className="px-4 mt-6 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[rgb(var(--q-text))]/70" />
              <p className="text-[rgb(var(--q-text))] font-semibold">Quests</p>
            </div>
            <span className="text-xs text-[rgb(var(--q-text))]/60">Coming soon</span>
          </div>
          <p className="text-[#93A4C7] text-xs mt-2">Complete simple tasks to earn points.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[rgb(var(--q-text))]/70" />
              <p className="text-[rgb(var(--q-text))] font-semibold">Leaderboard</p>
            </div>
            <span className="text-xs text-[rgb(var(--q-text))]/60">Coming soon</span>
          </div>
          <p className="text-[#93A4C7] text-xs mt-2">Top traders & top referrers.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[rgb(var(--q-text))] font-semibold">NFT Multiplier</p>
            <span className="text-xs text-[rgb(var(--q-text))]/60">Coming soon</span>
          </div>
          <p className="text-[#93A4C7] text-xs mt-2">1 NFT = 1x, 5 NFTs = 5x.</p>
        </div>
      </div>

      {/* Referrals (real UI, MVP logic local-only) */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[rgb(var(--q-text))] font-semibold">Referrals</h2>
          <span className="text-xs text-[rgb(var(--q-text))]/60">0.1x per referral</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          {!isConnected ? (
            <>
              <p className="text-[rgb(var(--q-text))]/80 text-sm mb-1">Connect to get your referral link</p>
              <p className="text-[#93A4C7] text-xs">Your link will be tied to your profile.</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[#93A4C7] text-xs">Your referral link</p>
                  <p className="text-[rgb(var(--q-text))] text-sm truncate">{referralLink}</p>
                </div>
                <Button
                  className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.99] transition"
                  onClick={copy}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[rgb(var(--q-bg))]/20 border border-white/10 p-3">
                  <p className="text-[#93A4C7] text-xs">Invited</p>
                  <p className="text-[rgb(var(--q-text))] font-semibold mt-1">{refCount}</p>
                </div>
                <div className="rounded-xl bg-[rgb(var(--q-bg))]/20 border border-white/10 p-3">
                  <p className="text-[#93A4C7] text-xs">Bonus</p>
                  <p className="text-[rgb(var(--q-text))] font-semibold mt-1">{referralMultiplier}x</p>
                </div>
                <div className="rounded-xl bg-[rgb(var(--q-bg))]/20 border border-white/10 p-3">
                  <p className="text-[#93A4C7] text-xs">Total</p>
                  <p className="text-[rgb(var(--q-text))] font-semibold mt-1">{totalMultiplier}x</p>
                </div>
              </div>

              <p className="text-[#93A4C7] text-xs mt-4">
                MVP note: referral counts are local-only right now. We'll make it fully real with backend next.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
