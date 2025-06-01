export interface Memory {
  id: string;
  name: string;
  principleVault: number;
  revenueVault: number;
  creatorVault: number;
  totalMemoryTokens: number;
  creator: string;
}

export interface StakePosition {
  memoryId: string;
  attnAmount: number;
  memoryTokens: number;
  timestamp: number;
}

export interface User {
  address: string;
  attnBalance: number;
  memoryTokens: { [memoryId: string]: number };
  stakePositions: StakePosition[];
  role: 'staker' | 'advertiser' | 'creator';
  injectedAmount: number;
}

export interface PlayerStats {
  address: string;
  role: 'staker' | 'advertiser' | 'creator';
  attnBalance: number;
  memoryTokens: number;
  stakedAmount: number;
  potentialRedemption: {
    principle: number;
    revenue: number;
    creator: number;
    total: number;
  } | null;
  totalValue: number;
  injectedAmount: number;
} 