import React, { createContext, useContext, useState, useCallback } from 'react';
import { Memory, User, StakePosition } from '../types';
import {
  calculateMemoryTokensToMint,
  distributeStakedAttn,
  distributeRevenueBoost,
  calculateRedeemAmount,
} from '../utils/memory';

interface SimulationContextType {
  memories: Memory[];
  users: User[];
  currentUser: User | null;
  stakeAttn: (memoryId: string, attnAmount: number) => void;
  boostRevenue: (memoryId: string, attnAmount: number) => void;
  redeemPosition: (memoryId: string, userAddress: string) => void;
  redeemCreatorEarnings: (memoryId: string) => void;
  selectUser: (address: string, role: 'staker' | 'advertiser' | 'creator', attnAmount?: number) => void;
  setUsers: (users: User[]) => void;
  setMemories: (memories: Memory[]) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Initialize with a single memory
const initialMemory: Memory = {
  id: '1',
  name: 'Test Memory',
  principleVault: 0,
  revenueVault: 0,
  creatorVault: 0,
  totalMemoryTokens: 0,
  creator: 'Creator_1',
};

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<Memory[]>([initialMemory]);
  const [users, setUsers] = useState<User[]>([{
    address: 'Creator_1',
    attnBalance: 1000,
    memoryTokens: {},
    stakePositions: [],
    role: 'creator',
    injectedAmount: 0
  }]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const updateMemory = useCallback((memoryId: string, updater: (memory: Memory) => Memory) => {
    setMemories(prevMemories => 
      prevMemories.map(m => m.id === memoryId ? updater({...m}) : m)
    );
  }, []);

  const updateUser = useCallback((address: string, updater: (user: User) => User) => {
    setUsers(prevUsers => 
      prevUsers.map(u => u.address === address ? updater({...u}) : u)
    );
  }, []);

  const stakeAttn = useCallback((memoryId: string, attnAmount: number) => {
    if (!currentUser || currentUser.attnBalance < attnAmount) return;

    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;

    const distribution = distributeStakedAttn(attnAmount);
    const memoryTokens = calculateMemoryTokensToMint(
      attnAmount,
      memory.principleVault,
      memory.revenueVault
    );

    // Update memory
    updateMemory(memoryId, memory => ({
      ...memory,
      principleVault: memory.principleVault + distribution.principle,
      revenueVault: memory.revenueVault + distribution.revenue,
      creatorVault: memory.creatorVault + distribution.creator,
      totalMemoryTokens: memory.totalMemoryTokens + memoryTokens,
    }));

    // Update user
    updateUser(currentUser.address, user => {
      const stakePosition: StakePosition = {
        memoryId,
        attnAmount,
        memoryTokens,
        timestamp: Date.now(),
      };

      return {
        ...user,
        attnBalance: user.attnBalance - attnAmount,
        memoryTokens: {
          ...user.memoryTokens,
          [memoryId]: (user.memoryTokens[memoryId] || 0) + memoryTokens,
        },
        stakePositions: [...user.stakePositions, stakePosition],
      };
    });
  }, [currentUser, memories, updateMemory, updateUser]);

  const boostRevenue = useCallback((memoryId: string, attnAmount: number) => {
    if (!currentUser || currentUser.attnBalance < attnAmount) return;

    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;

    const distribution = distributeRevenueBoost(attnAmount);

    // Update memory
    updateMemory(memoryId, memory => ({
      ...memory,
      revenueVault: memory.revenueVault + distribution.revenue,
      creatorVault: memory.creatorVault + distribution.creator,
    }));

    // Update user
    updateUser(currentUser.address, user => ({
      ...user,
      attnBalance: user.attnBalance - attnAmount,
      injectedAmount: user.role === 'advertiser' ? user.injectedAmount + attnAmount : user.injectedAmount,
    }));
  }, [currentUser, memories, updateMemory, updateUser]);

  const redeemPosition = useCallback((memoryId: string, userAddress: string) => {
    const user = users.find(u => u.address === userAddress);
    if (!user) return;

    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;

    const position = user.stakePositions.find(p => p.memoryId === memoryId);
    if (!position) return;

    const redeemAmount = calculateRedeemAmount(position, memory);

    // Update memory
    updateMemory(memoryId, memory => ({
      ...memory,
      principleVault: memory.principleVault - redeemAmount.principle,
      revenueVault: memory.revenueVault - redeemAmount.revenue,
      totalMemoryTokens: memory.totalMemoryTokens - position.memoryTokens,
    }));

    // Update user
    updateUser(userAddress, user => ({
      ...user,
      attnBalance: user.attnBalance + redeemAmount.principle + redeemAmount.revenue,
      memoryTokens: {
        ...user.memoryTokens,
        [memoryId]: 0,
      },
      stakePositions: user.stakePositions.filter(p => p.memoryId !== memoryId),
    }));
  }, [users, memories, updateMemory, updateUser]);

  const redeemCreatorEarnings = useCallback((memoryId: string) => {
    if (!currentUser) return;

    const memory = memories.find(m => m.id === memoryId);
    if (!memory || memory.creator !== currentUser.address) return;

    // Update memory
    updateMemory(memoryId, memory => ({
      ...memory,
      creatorVault: 0,
    }));

    // Update user
    updateUser(currentUser.address, user => ({
      ...user,
      attnBalance: user.attnBalance + memory.creatorVault,
    }));
  }, [currentUser, memories, updateMemory, updateUser]);

  const selectUser = useCallback((address: string, role: 'staker' | 'advertiser' | 'creator', attnAmount?: number) => {
    const user = users.find(u => u.address === address);
    if (user) {
      setCurrentUser({...user});
    } else {
      const memory = memories[0];
      if (!memory) return;

      // Create new user with initial state
      const newUser: User = {
        address,
        attnBalance: 1000,
        memoryTokens: {},
        stakePositions: [],
        role,
        injectedAmount: 0
      };

      // If attnAmount is provided, calculate the distribution and memory tokens immediately
      if (attnAmount) {
        if (role === 'staker') {
          const distribution = distributeStakedAttn(attnAmount);
          // Calculate memory tokens using current formula
          const memoryTokens = calculateMemoryTokensToMint(
            attnAmount,
            memory.principleVault,
            memory.revenueVault
          );

          // Update memory state
          updateMemory(memory.id, memory => ({
            ...memory,
            principleVault: memory.principleVault + distribution.principle,
            revenueVault: memory.revenueVault + distribution.revenue,
            creatorVault: memory.creatorVault + distribution.creator,
            totalMemoryTokens: memory.totalMemoryTokens + memoryTokens,
          }));

          // Update new user with staking information
          newUser.attnBalance -= attnAmount;
          newUser.memoryTokens[memory.id] = memoryTokens;
          newUser.stakePositions.push({
            memoryId: memory.id,
            attnAmount,
            memoryTokens,
            timestamp: Date.now(),
          });
        } else if (role === 'advertiser') {
          const distribution = distributeRevenueBoost(attnAmount);

          // Update memory state
          updateMemory(memory.id, memory => ({
            ...memory,
            revenueVault: memory.revenueVault + distribution.revenue,
            creatorVault: memory.creatorVault + distribution.creator,
          }));

          // Update new user with boost information
          newUser.attnBalance -= attnAmount;
          newUser.injectedAmount = attnAmount;
        }
      }

      // If this is the creator, update the memory's creator
      if (role === 'creator') {
        setMemories(prevMemories => 
          prevMemories.map(m => ({
            ...m,
            creator: address,
          }))
        );
      }

      // Add the new user with all updates already applied
      setUsers(prevUsers => [...prevUsers, newUser]);
      setCurrentUser(newUser);
    }
  }, [users, memories, updateMemory]);

  return (
    <SimulationContext.Provider
      value={{
        memories,
        users,
        currentUser,
        stakeAttn,
        boostRevenue,
        redeemPosition,
        redeemCreatorEarnings,
        selectUser,
        setUsers,
        setMemories,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
} 