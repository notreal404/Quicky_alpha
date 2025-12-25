import { supabase } from "./supabase";

export type NetworkMode = "testnet" | "mainnet";

export function normalizeUsername(input: string) {
  const v = (input || "").trim().replace(/^@+/, "").toLowerCase();
  return v;
}

export function displayUsername(u?: string | null) {
  if (!u) return "";
  return u.startsWith("@") ? u : `@${u}`;
}

export function getTelegramId(): string | null {
  try {
    const tg = (window as any).Telegram?.WebApp;
    const id = tg?.initDataUnsafe?.user?.id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export async function getUserByWallet(wallet: string) {
  const { data, error } = await supabase
    .from("users")
    .select("wallet, username, telegram_id, created_at")
    .eq("wallet", wallet)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function ensureUser(wallet: string) {
  const existing = await getUserByWallet(wallet);
  if (existing) return existing;

  const telegram_id = getTelegramId();
  const { data, error } = await supabase
    .from("users")
    .insert([{ wallet, telegram_id }])
    .select("wallet, username, telegram_id, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function isUsernameAvailable(usernameInput: string) {
  const username = normalizeUsername(usernameInput);
  if (!username) return false;

  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return !data;
}

export async function setUsernameForWallet(wallet: string, usernameInput: string) {
  const username = normalizeUsername(usernameInput);
  if (!username) throw new Error("Invalid username");

  const telegram_id = getTelegramId();

  // Check availability
  const available = await isUsernameAvailable(username);
  if (!available) throw new Error("Username is already taken");

  const { data, error } = await supabase
    .from("users")
    .update({ username, telegram_id })
    .eq("wallet", wallet)
    .select("wallet, username, telegram_id, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function getCredits(wallet: string, network: NetworkMode) {
  const { data, error } = await supabase
    .from("balances")
    .select("credits_usd")
    .eq("wallet", wallet)
    .eq("network", network)
    .maybeSingle();

  if (error) throw error;
  return Number(data?.credits_usd ?? 0);
}

export async function topUpCreditsByUsername(usernameInput: string, amountUsd: number, network: NetworkMode) {
  const username = normalizeUsername(usernameInput);
  if (!username) throw new Error("Enter a username");
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) throw new Error("Amount must be > 0");

  // Find wallet
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("wallet")
    .eq("username", username)
    .maybeSingle();

  if (userErr) throw userErr;
  if (!user?.wallet) throw new Error("User not found");

  // Read existing
  const { data: bal, error: balErr } = await supabase
    .from("balances")
    .select("credits_usd")
    .eq("wallet", user.wallet)
    .eq("network", network)
    .maybeSingle();

  if (balErr) throw balErr;

  const next = Number(bal?.credits_usd ?? 0) + amountUsd;

  const { error: upsertErr } = await supabase
    .from("balances")
    .upsert(
      [{ wallet: user.wallet, network, credits_usd: next, updated_at: new Date().toISOString() }],
      { onConflict: "wallet,network" }
    );

  if (upsertErr) throw upsertErr;
  return { wallet: user.wallet, credits_usd: next };
}
