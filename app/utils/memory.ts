import { Memory, User, PlayerStats } from '../types';
import { Parser } from 'expr-eval';

// Default formula for price calculation
let priceFormula = '0.005 * (tvl^0.6) + 0.1';
let parser = new Parser();

export const setPriceFormula = (formula: string) => {
  try {
    parser.parse(formula); // Validate the formula
    priceFormula = formula;
  } catch (error) {
    console.error('Invalid formula:', error);
  }
};

export const calculateMemoryTokenPrice = (principleVault: number, revenueVault: number): number => {
  const tvl = principleVault + revenueVault;
  try {
    // Use expr-eval to evaluate the formula
    const price = parser.evaluate(priceFormula, { tvl });
    console.log(`Price calculation for TVL ${tvl}:`, {
      formula: priceFormula,
      tvl,
      price
    });
    return price;
  } catch (error) {
    console.error('Invalid formula:', error);
    return 0.005 * Math.pow(tvl, 0.6) + 0.1; // Fallback to default formula
  }
};

export const calculateMemoryTokensToMint = (
  attnAmount: number,
  principleVault: number,
  revenueVault: number
): number => {
  // Use numerical integration to calculate tokens
  const steps = 100; // Number of steps for integration
  const stepSize = attnAmount / steps;
  let totalTokens = 0;

  for (let i = 0; i < steps; i++) {
    const currentPrinciple = principleVault + (i * stepSize);
    const price = calculateMemoryTokenPrice(currentPrinciple, revenueVault);
    const tokensInStep = stepSize / price;
    totalTokens += tokensInStep;
  }

  console.log('Token calculation:', {
    attnAmount,
    initialPrinciple: principleVault,
    finalPrinciple: principleVault + attnAmount,
    totalTokens
  });

  return totalTokens;
};

export const distributeStakedAttn = (attnAmount: number): {
  principle: number;
  revenue: number;
  creator: number;
} => {
  return {
    principle: attnAmount * 0.7,
    revenue: attnAmount * 0.25,
    creator: attnAmount * 0.05,
  };
};

export const distributeRevenueBoost = (attnAmount: number): {
  revenue: number;
  creator: number;
} => {
  return {
    revenue: attnAmount * 0.95,
    creator: attnAmount * 0.05,
  };
};

export const calculateRedeemAmount = (
  stakePosition: { attnAmount: number; memoryTokens: number },
  memory: Memory
): {
  principle: number;
  revenue: number;
} => {
  // Calculate principle portion (70% of staked amount)
  const principle = stakePosition.attnAmount * 0.7;
  
  // Calculate revenue share based on memory token ownership
  const revenueShare = memory.totalMemoryTokens > 0 
    ? stakePosition.memoryTokens / memory.totalMemoryTokens 
    : 0;
  
  // Calculate revenue portion based on share of total memory tokens
  const revenue = memory.revenueVault * revenueShare;

  return {
    principle,
    revenue,
  };
};

export const calculatePlayerStats = (user: User, memory: Memory): PlayerStats => {
  const position = user.stakePositions.find(p => p.memoryId === memory.id);
  const memoryTokens = user.memoryTokens[memory.id] || 0;
  const stakedAmount = position?.attnAmount || 0;

  let potentialRedemption = {
    principle: 0,
    revenue: 0,
    creator: 0,
    total: 0,
  };

  if (user.role === 'staker' && position) {
    const redeemAmount = calculateRedeemAmount(position, memory);
    potentialRedemption = {
      principle: redeemAmount.principle,
      revenue: redeemAmount.revenue,
      creator: 0,
      total: redeemAmount.principle + redeemAmount.revenue,
    };
  } else if (user.role === 'creator') {
    potentialRedemption = {
      principle: 0,
      revenue: 0,
      creator: memory.creatorVault,
      total: memory.creatorVault,
    };
  }

  // Calculate total value based on role
  let totalValue = 0;
  let injectedAmount = 0;
  
  if (user.role === 'staker') {
    totalValue = potentialRedemption.total;
  } else if (user.role === 'advertiser') {
    injectedAmount = user.injectedAmount;
    totalValue = injectedAmount;
  } else if (user.role === 'creator') {
    totalValue = memory.creatorVault;
  }

  return {
    address: user.address,
    role: user.role,
    attnBalance: user.attnBalance,
    memoryTokens,
    stakedAmount,
    potentialRedemption,
    totalValue,
    injectedAmount,
  };
};

export const recalculatePositions = (memory: Memory, users: User[]): { updatedUsers: User[], updatedMemory: Memory } => {
  let totalMemoryTokens = 0;
  
  // First pass: calculate new memory tokens for each user
  const updatedUsers = users.map(user => {
    const position = user.stakePositions.find(p => p.memoryId === memory.id);
    if (!position) return user;

    // Calculate new memory tokens based on the new formula
    const newMemoryTokens = calculateMemoryTokensToMint(
      position.attnAmount,
      memory.principleVault,
      memory.revenueVault
    );

    totalMemoryTokens += newMemoryTokens;

    // Update the user's memory tokens and stake position
    return {
      ...user,
      memoryTokens: {
        ...user.memoryTokens,
        [memory.id]: newMemoryTokens
      },
      stakePositions: user.stakePositions.map(p => 
        p.memoryId === memory.id 
          ? { ...p, memoryTokens: newMemoryTokens }
          : p
      )
    };
  });

  // Update memory with new total memory tokens
  const updatedMemory = {
    ...memory,
    totalMemoryTokens
  };

  return { updatedUsers, updatedMemory };
}; 