import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { calculateMemoryTokenPrice } from '../utils/memory';

export function MemoryManager() {
  const { memories, currentUser, createMemory, stakeAttn, boostRevenue, redeemPosition, redeemCreatorEarnings } = useSimulation();
  const [newMemoryName, setNewMemoryName] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [boostAmount, setBoostAmount] = useState('');

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMemoryName) return;
    createMemory(newMemoryName, currentUser.address);
    setNewMemoryName('');
  };

  const handleStake = (memoryId: string) => {
    if (!stakeAmount) return;
    stakeAttn(memoryId, parseFloat(stakeAmount));
    setStakeAmount('');
  };

  const handleBoost = (memoryId: string) => {
    if (!boostAmount) return;
    boostRevenue(memoryId, parseFloat(boostAmount));
    setBoostAmount('');
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Memory Manager</h2>
      
      {/* Create Memory Form */}
      <form onSubmit={handleCreateMemory} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMemoryName}
            onChange={(e) => setNewMemoryName(e.target.value)}
            placeholder="Memory Name"
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create Memory
          </button>
        </div>
      </form>

      {/* Memories List */}
      <div className="space-y-4">
        {memories.map((memory) => (
          <div key={memory.id} className="border p-4 rounded">
            <h3 className="text-xl font-semibold">{memory.name}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p>Principle Vault: {memory.principleVault.toFixed(2)} ATTN</p>
                <p>Revenue Vault: {memory.revenueVault.toFixed(2)} ATTN</p>
                <p>Creator Vault: {memory.creatorVault.toFixed(2)} ATTN</p>
                <p>Total Memory Tokens: {memory.totalMemoryTokens.toFixed(2)}</p>
                <p>Token Price: {calculateMemoryTokenPrice(memory.principleVault, memory.revenueVault).toFixed(4)} ATTN</p>
              </div>
              <div>
                {/* Stake Form */}
                <div className="mb-4">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="ATTN Amount"
                    className="border p-2 rounded w-full mb-2"
                  />
                  <button
                    onClick={() => handleStake(memory.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded w-full"
                  >
                    Stake ATTN
                  </button>
                </div>

                {/* Boost Form */}
                <div className="mb-4">
                  <input
                    type="number"
                    value={boostAmount}
                    onChange={(e) => setBoostAmount(e.target.value)}
                    placeholder="ATTN Amount"
                    className="border p-2 rounded w-full mb-2"
                  />
                  <button
                    onClick={() => handleBoost(memory.id)}
                    className="bg-purple-500 text-white px-4 py-2 rounded w-full"
                  >
                    Boost Revenue
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => redeemPosition(memory.id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
                  >
                    Redeem Position
                  </button>
                  {currentUser?.address === memory.creator && (
                    <button
                      onClick={() => redeemCreatorEarnings(memory.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded w-full"
                    >
                      Redeem Creator Earnings
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 