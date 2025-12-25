export interface Market {
  id: string;
  title: string;
  category: 'crypto' | 'finance' | 'politics' | 'world';
  image: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate: string;
  description?: string;
  isTrending?: boolean;
}

export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  side: 'YES' | 'NO';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  status: 'active' | 'settled';
  outcome?: 'won' | 'lost';
  pnl?: number;
  settledDate?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'available' | 'completed';
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  points: number;
  multiplier: number;
}
