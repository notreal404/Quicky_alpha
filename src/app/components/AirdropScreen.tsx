import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Copy, Gift, Lock, Sparkles, Trophy, Users } from "lucide-react";
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

type RewardsTab = "quests" | "referrals" | "leaderboard" | "nft";

export function AirdropScreen() {
  const wallet = useTonWallet();
  const address = useTonAddress();
  const username = address ? getUsername(address) : "";
  const isConnected = !!wallet && !!address;

  const [activeTab, setActiveTab] = useState<RewardsTab>("quests");
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
      setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  };

  const TabButton = ({
    tab,
    title,
    icon,
  }: {
    tab: RewardsTab;
    title: string;
    icon: ReactNode;
  }) => {
    const active = tab === activeTab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={[
          "q-glass flex items-center gap-2 px-4 py-3 text-sm font-semibold transition",
          active
            ? "border-[rgba(197,216,157,0.35)] bg-[rgba(197,216,157,0.14)] shadow-[0_0_16px_rgba(197,216,157,0.25)]"
            : "opacity-90 hover:opacity-100",
        ].join(" ")}
      >
        <span className="text-[rgb(var(--q-text))]/80">{icon}</span>
        <span className="text-[rgb(var(--q-text))]">{title}</span>
      </button>
    );
  };

  const ComingSoonCard = ({
    title,
    subtitle,
    icon,
  }: {
    title: string;
    subtitle: string;
    icon: ReactNode;
  }) => {
    return (
      <div className="q-glass-strong relative overflow-hidden p-5">
        <div className="absolute inset-0 bg-[rgba(10,12,10,0.55)]" />
        <div className="absolute inset-0 backdrop-blur-xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[rgba(197,216,157,0.12)] border border-[rgba(197,216,157,0.18)] flex items-center justify-center">
                {icon}
              </div>
              <div>
                <p className="text-[rgb(var(--q-text))] font-semibold">{title}</p>
                <p className="text-[rgb(var(--q-text))]/70 text-xs mt-1">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[rgb(var(--q-text))]/70 text-xs">
              <Lock className="w-4 h-4" />
              <span>Coming soon</span>
            </div>
          </div>

          <div className="mt-5 q-glass px-4 py-3">
            <p className="text-[rgb(var(--q-text))]/80 text-sm">
              We’re polishing this for the next build. You’ll see it unlocked soon.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070A07] pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-[rgb(var(--q-text))] text-lg font-semibold">Rewards</h1>
        <p className="text-[rgb(var(--q-text))]/70 text-sm">Early user hub • quests, multipliers, referrals</p>
      </div>

      {/* Banner */}
      <div className="px-4 mt-5">
        <div className="q-glass-strong p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(197,216,157,0.12)] border border-[rgba(197,216,157,0.18)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[rgb(var(--q-text))]/80" />
            </div>
            <div className="min-w-0">
              <p className="text-[rgb(var(--q-text))] font-semibold">Token coming soon</p>
              <p className="text-[rgb(var(--q-text))]/70 text-xs mt-1">
                Points & multipliers will convert to rewards at TGE.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Internal menu */}
      <div className="px-4 mt-5">
        <div className="grid grid-cols-2 gap-3">
          <TabButton tab="quests" title="Quests" icon={<Gift className="w-4 h-4" />} />
          <TabButton tab="referrals" title="Referrals" icon={<Users className="w-4 h-4" />} />
          <TabButton tab="leaderboard" title="Leaderboard" icon={<Trophy className="w-4 h-4" />} />
          <TabButton tab="nft" title="NFT" icon={<Sparkles className="w-4 h-4" />} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-5">
        {activeTab === "referrals" ? (
          <div className="q-glass-strong p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[rgb(var(--q-text))] font-semibold">Referrals</h2>
              <span className="text-xs text-[rgb(var(--q-text))]/70">0.1x per referral</span>
            </div>

            {!isConnected ? (
              <>
                <p className="text-[rgb(var(--q-text))]/85 text-sm mb-1">Connect to get your referral link</p>
                <p className="text-[rgb(var(--q-text))]/70 text-xs">Your link will be tied to your profile.</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[rgb(var(--q-text))]/70 text-xs">Your referral link</p>
                    <p className="text-[rgb(var(--q-text))] text-sm truncate">{referralLink}</p>
                  </div>
                  <Button className="h-10 px-4 rounded-xl q-btn" onClick={copy}>
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="q-glass p-3">
                    <p className="text-[rgb(var(--q-text))]/70 text-xs">Invited</p>
                    <p className="text-[rgb(var(--q-text))] font-semibold mt-1">{refCount}</p>
                  </div>
                  <div className="q-glass p-3">
                    <p className="text-[rgb(var(--q-text))]/70 text-xs">Bonus</p>
                    <p className="text-[rgb(var(--q-text))] font-semibold mt-1">{referralMultiplier}x</p>
                  </div>
                  <div className="q-glass p-3">
                    <p className="text-[rgb(var(--q-text))]/70 text-xs">Total</p>
                    <p className="text-[rgb(var(--q-text))] font-semibold mt-1">{totalMultiplier}x</p>
                  </div>
                </div>

                <p className="text-[rgb(var(--q-text))]/70 text-xs mt-4">
                  MVP note: referral counts are local-only right now. We’ll make it fully real with backend next.
                </p>
              </>
            )}
          </div>
        ) : activeTab === "quests" ? (
          <ComingSoonCard
            title="Quests"
            subtitle="Complete tasks to earn points and multipliers."
            icon={<Gift className="w-5 h-5 text-[rgb(var(--q-text))]/80" />}
          />
        ) : activeTab === "leaderboard" ? (
          <ComingSoonCard
            title="Leaderboard"
            subtitle="Top traders & top referrers — updated weekly."
            icon={<Trophy className="w-5 h-5 text-[rgb(var(--q-text))]/80" />}
          />
        ) : (
          <ComingSoonCard
            title="NFT Multiplier"
            subtitle="Hold project NFTs to boost rewards."
            icon={<Sparkles className="w-5 h-5 text-[rgb(var(--q-text))]/80" />}
          />
        )}
      </div>
    </div>
  );
}
