import { useEffect, useMemo, useState } from "react";
import { Settings, ArrowUp, ArrowDown, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { AdminScreen, type NetworkMode } from "./AdminScreen";
import { ensureUser, getCredits, isUsernameAvailable, setUsernameForWallet, normalizeUsername } from "../../lib/demoDb";

type UsernameState = {
  value: string;
  isChecking: boolean;
  error?: string;
};

function maskAddress(addr: string) {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function loadUsernames(): string[] {
  try {
    const raw = localStorage.getItem("qmvp_usernames");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsernames(usernames: string[]) {
  localStorage.setItem("qmvp_usernames", JSON.stringify(Array.from(new Set(usernames))));
}

async function fetchTonBalanceTON(userFriendlyAddress: string): Promise<number | null> {
  try {
    // Public endpoint (no key). Good for MVP/demo.
    const resp = await fetch(`https://tonapi.io/v2/accounts/${encodeURIComponent(userFriendlyAddress)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const nano = typeof data?.balance === "string" ? Number(data.balance) : Number(data?.balance);
    if (!Number.isFinite(nano)) return null;
    return nano / 1e9;
  } catch {
    return null;
  }
}

export function PortfolioScreen() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress(); // user-friendly
  const ADMIN_WALLET = "UQBCgJlpPbnHbuR4iMi_3wtNCBRTs3C-ZgI0Pm7AYgTkc3vY";
  const [adminOpen, setAdminOpen] = useState(false);
  const [network, setNetwork] = useState<NetworkMode>(() => (localStorage.getItem("qmvp_network") as NetworkMode) || "testnet");
  useEffect(() => { localStorage.setItem("qmvp_network", network); }, [network]);

  const isConnected = !!wallet && !!address;

  const [username, setUsername] = useState<string>("");
  const [usernameState, setUsernameState] = useState<UsernameState>({
    value: "",
    isChecking: false,
  });

  const [balanceTON, setBalanceTON] = useState<number | null>(null);
  const [creditsUSD, setCreditsUSD] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Load user + username from Supabase after connect
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!address) return;
      try {
        const u = await ensureUser(address);
        if (cancelled) return;
        const uName = (u?.username as string | undefined) || "";
        setUsername(uName);
        setUsernameState((s) => ({ ...s, value: uName }));
      } catch (e: any) {
        console.warn("Supabase user load failed", e?.message || e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // Load demo credits (stored in Supabase balances)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!address) return;
      try {
        const v = await getCredits(address, network);
        if (!cancelled) setCreditsUSD(v);
      } catch (e: any) {
        console.warn("Credits load failed", e?.message || e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [address, network]);

  // Fetch balance after connect
  useEffect(() => {
    let cancelled = false;
    if (!isConnected) {
      setBalanceTON(null);
      return;
    }
    setBalanceLoading(true);
    fetchTonBalanceTON(address).then((val) => {
      if (cancelled) return;
      setBalanceTON(val);
      setBalanceLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  const pnlChartData = useMemo(() => {
    // MVP: no history yet -> flat line
    return Array.from({ length: 12 }, () => ({ value: 0 }));
  }, []);

  const totalPnL = 0;

  // --------------- UI blocks ---------------

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#070A07] pb-20">
        <div className="px-4 pt-6">
          <h1 className="text-[rgb(var(--q-text))] text-lg font-semibold">Portfolio</h1>
          <p className="text-[#93A4C7] text-sm">Your profile & stats live here</p>
        </div>

        <div className="px-4 mt-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-[rgb(var(--q-text))]/80" />
            </div>

            <h2 className="text-[rgb(var(--q-text))] text-xl font-semibold mb-2">To see your profile</h2>
            <p className="text-[#93A4C7] text-sm mb-6">
              Connect your wallet to view balance, bets, and rewards.
            </p>

            <Button
              className="w-full h-12 rounded-xl text-base font-medium bg-blue-500 hover:bg-blue-400 active:scale-[0.99] transition"
              onClick={() => tonConnectUI.openModal()}
            >
              Connect your wallet
            </Button>

            <p className="text-[#93A4C7] text-xs mt-3">
              Non-custodial. You keep full control.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Username gate (first-time connected)
  if (!username) {
    const onSave = async () => {
      const valueRaw = usernameState.value;
      const value = normalizeUsername(valueRaw);
      if (value.length < 3) {
        setUsernameState((s) => ({ ...s, error: "Username must be at least 3 characters." }));
        return;
      }
      if (!/^[a-z0-9_]+$/.test(value)) {
        setUsernameState((s) => ({ ...s, error: "Use only letters, numbers, and underscores." }));
        return;
      }

      setUsernameState((s) => ({ ...s, isChecking: true, error: undefined }));

      try {
        const available = await isUsernameAvailable(value);
        if (!available) {
          setUsernameState((s) => ({ ...s, isChecking: false, error: "Username is taken. Try another." }));
          return;
        }

        const updated = await setUsernameForWallet(address, value);
        setUsername(updated.username || value);
        setUsernameState((s) => ({ ...s, isChecking: false, error: undefined }));
      } catch (e: any) {
        setUsernameState((s) => ({
          ...s,
          isChecking: false,
          error: e?.message || "Failed to save username. Try again.",
        }));
      }
    };

    return (
      <div className="min-h-screen bg-[#070A07] pb-20">
        <div className="px-4 pt-6 flex items-center justify-between">
          <div>
            <h1 className="text-[rgb(var(--q-text))] text-lg font-semibold">Create your profile</h1>
            <p className="text-[#93A4C7] text-sm">Pick a username to continue</p>
          </div>
          <div className="text-xs text-[rgb(var(--q-text))]/60">{maskAddress(address)}</div>
        </div>

        <div className="px-4 mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <label className="text-[rgb(var(--q-text))]/80 text-sm block mb-2">Username</label>

            <div className="flex items-center gap-2">
              <div className="text-[rgb(var(--q-text))]/60">@</div>
              <input
                value={usernameState.value}
                onChange={(e) => setUsernameState((s) => ({ ...s, value: e.target.value, error: undefined }))}
                placeholder="yourname"
                className="flex-1 h-11 rounded-xl bg-[rgb(var(--q-bg))]/20 border border-white/10 px-3 text-[rgb(var(--q-text))] outline-none focus:border-blue-500"
              />
            </div>

            {usernameState.error ? (
              <p className="text-red-300 text-xs mt-2">{usernameState.error}</p>
            ) : (
              <p className="text-[#93A4C7] text-xs mt-2">No password needed. You can change later.</p>
            )}

            <Button
              className="w-full h-12 mt-5 rounded-xl text-base font-medium bg-blue-500 hover:bg-blue-400 active:scale-[0.99] transition"
              onClick={onSave}
              disabled={usernameState.isChecking}
            >
              {usernameState.isChecking ? "Checking..." : "Save username"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Connected + username set
  return (
    <div className="min-h-screen bg-[#070A07] pb-20">
	      {/* Header */}
	      <div className="px-4 pt-6 flex items-start justify-between">
	        <div>
	          <h1 className="text-[rgb(var(--q-text))] text-lg font-semibold">Welcome, @{username}</h1>
	          <p className="text-[#93A4C7] text-sm">{maskAddress(address)}</p>
	        </div>
	        <div className="flex items-center gap-2">
	          <button
	            className="px-3 h-10 rounded-xl q-glass text-[rgb(var(--q-text))] text-sm flex items-center justify-center hover:bg-white/10 active:scale-[0.98] transition"
	            onClick={() => {
	              try {
	                localStorage.removeItem("qmvp_username");
	              } catch {}
	              tonConnectUI.disconnect();
	            }}
	            title="Logout"
	          >
	            Logout
	          </button>

	          {address === ADMIN_WALLET ? (
	            <button
	              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-[0.98] transition"
	              onClick={() => setAdminOpen(true)}
	              title="Admin"
	            >
	              <span className="text-xs text-[rgb(var(--q-text))]/90 font-semibold">A</span>
	            </button>
	          ) : null}
	        </div>
	      </div>

      {/* Balance */}
      <div className="px-4 mt-6">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/7 to-white/3 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#93A4C7] text-sm">Wallet balance</p>
            <div className="text-xs text-[rgb(var(--q-text))]/60">TON</div>
          </div>

          <div className="text-[rgb(var(--q-text))] text-3xl font-semibold tracking-tight">
            {balanceLoading ? "Loading..." : balanceTON === null ? "—" : `${balanceTON.toFixed(3)}`}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[#93A4C7]">Demo credits ({network})</span>
            <span className="text-[rgb(var(--q-text))]/80">${creditsUSD.toFixed(2)}</span>
          </div>

          <div className="mt-4 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlChartData}>
                <YAxis hide domain={[-1, 1]} />
                <Area type="monotone" dataKey="value" strokeWidth={2} stroke="rgba(59,130,246,0.9)" fill="rgba(59,130,246,0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[#93A4C7] text-sm">P&L</p>
            <p className="text-[rgb(var(--q-text))] font-medium">{totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`}</p>
          </div>

          <div className="mt-4 flex gap-2">
            <Button className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.99] transition">
              <ArrowDown className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.99] transition">
              <ArrowUp className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>
      </div>

      {/* Active Bets */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[rgb(var(--q-text))] font-semibold">Active Bets</h2>
          <p className="text-xs text-[rgb(var(--q-text))]/60">0</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-[rgb(var(--q-text))]/80 text-sm mb-1">No active bets yet</p>
          <p className="text-[#93A4C7] text-xs">Place your first prediction on the Home tab.</p>
        </div>
      </div>

      {/* History */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[rgb(var(--q-text))] font-semibold">History</h2>
          <p className="text-xs text-[rgb(var(--q-text))]/60">0</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-[rgb(var(--q-text))]/80 text-sm mb-1">Nothing here yet</p>
          <p className="text-[#93A4C7] text-xs">Your settled bets will show up here.</p>
        </div>
      </div>

      {adminOpen ? (
      <AdminScreen
        adminAddress={ADMIN_WALLET}
        activeAddress={address}
        network={network}
        onNetworkChange={setNetwork}
        onClose={() => setAdminOpen(false)}
      />
    ) : null}
    </div>
  );

}