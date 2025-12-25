import { useMemo, useState } from "react";
import { X, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "./ui/button";
import { topUpCreditsByUsername, normalizeUsername } from "../../lib/demoDb";

export type NetworkMode = "testnet" | "mainnet";

type Props = {
  adminAddress: string;
  activeAddress: string;
  network: NetworkMode;
  onNetworkChange: (n: NetworkMode) => void;
  onClose: () => void;
};

export function AdminScreen({ adminAddress, activeAddress, network, onNetworkChange, onClose }: Props) {
  const isAdmin = useMemo(() => activeAddress === adminAddress, [activeAddress, adminAddress]);

  // MVP demo-only: local "credits" top-up (not TON)
  const [username, setUsername] = useState("");
  const [credits, setCredits] = useState("100");
  const [status, setStatus] = useState<string | null>(null);

  const onTopUp = async () => {
    const u = normalizeUsername(username);
    const amount = Number(credits);

    if (u.length < 3) {
      setStatus("Enter a valid username");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus("Enter valid amount");
      return;
    }

    try {
      setStatus("Processing...");
      const res = await topUpCreditsByUsername(u, amount, network);
      setStatus(`Added $${amount} demo credits to @${u} (${network}). New: $${Number(res.credits_usd).toFixed(2)}`);
    } catch (e: any) {
      setStatus(e?.message || "Top up failed");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#050B1A]">
      <div className="px-4 pt-6 pb-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[rgb(var(--q-text))]/90" />
            </div>
            <div>
              <h2 className="text-[rgb(var(--q-text))] text-lg font-semibold">Admin Panel</h2>
              <p className="text-[#93A4C7] text-xs">Demo tools for testnet & mainnet</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-[rgb(var(--q-text))]/80" />
          </Button>
        </div>

        {/* Network toggle */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[rgb(var(--q-text))] font-medium">Network</p>
              <p className="text-[#93A4C7] text-xs">One-tap switch for demo</p>
            </div>

            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              onClick={() => onNetworkChange(network === "testnet" ? "mainnet" : "testnet")}
            >
              {network === "testnet" ? (
                <>
                  <ToggleLeft className="w-5 h-5 text-cyan-300" />
                  <span className="text-[rgb(var(--q-text))] text-sm">Testnet</span>
                </>
              ) : (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-300" />
                  <span className="text-[rgb(var(--q-text))] text-sm">Mainnet</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 text-xs text-[#93A4C7]">
            Testnet credits and settlement tools will be enabled first. Mainnet is read-only for now.
          </div>
        </div>

        {/* Demo credits top-up */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1B44]/40 to-[#050B1A] p-4">
          <p className="text-[rgb(var(--q-text))] font-medium">Team demo credits</p>
          <p className="text-[#93A4C7] text-xs mt-1">
            For investor demo only. These are UI credits (not real TON).
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (e.g. @alex)"
              className="h-11 rounded-xl bg-[#071027] border border-white/10 px-3 text-[rgb(var(--q-text))] placeholder:text-[rgb(var(--q-text))]/30 outline-none focus:border-cyan-400/40"
            />
            <input
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="Amount (USD)"
              className="h-11 rounded-xl bg-[#071027] border border-white/10 px-3 text-[rgb(var(--q-text))] placeholder:text-[rgb(var(--q-text))]/30 outline-none focus:border-cyan-400/40"
            />

            <Button
              className="h-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-blue-500/20"
              onClick={onTopUp}
            >
              Top up credits
            </Button>

            {status ? <p className="text-xs text-[rgb(var(--q-text))]/70">{status}</p> : null}
          </div>
        </div>

        {/* Coming soon tools */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[rgb(var(--q-text))] font-medium">On-chain tools</p>
          <p className="text-[#93A4C7] text-xs mt-1">Create markets, mint, settle — coming in Step C.</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[rgb(var(--q-text))] text-sm">Create Market</p>
              <p className="text-[#93A4C7] text-xs">Coming soon</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[rgb(var(--q-text))] text-sm">Settle</p>
              <p className="text-[#93A4C7] text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
