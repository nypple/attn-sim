import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { calculateMemoryTokenPrice, calculatePlayerStats } from '../utils/memory';
import { PlayerChart } from './PlayerChart';
import { FormulaInput } from './FormulaInput';
import { PlayerStats } from '../types';

type AdvertiserType = 'Advertiser' | 'Airdrop' | 'External Revenue';

export function MemorySimulator() {
  const { memories, users, currentUser, stakeAttn, boostRevenue, redeemPosition, redeemCreatorEarnings, selectUser } = useSimulation();
  const [newUserRole, setNewUserRole] = useState<'staker' | 'advertiser'>('staker');
  const [advertiserType, setAdvertiserType] = useState<AdvertiserType>('Advertiser');
  const [newUserAmount, setNewUserAmount] = useState('1000');
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);

  // Get the single memory (first one created)
  const memory = memories[0];

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return;

    // Count existing users by role
    const stakerCount = users.filter(u => u.role === 'staker').length;
    const advertiserCount = users.filter(u => u.role === 'advertiser').length;

    // Generate name based on role and count
    const newName = newUserRole === 'staker' 
      ? `Staker_${stakerCount + 1}`
      : `${advertiserType}_${advertiserCount + 1}`;

    // Add the user and immediately stake/boost if amount provided
    selectUser(newName, newUserRole, newUserAmount ? parseFloat(newUserAmount) : undefined);

    // Reset form
    setNewUserAmount('1000');
  };

  // Update player stats when formula changes or users change
  React.useEffect(() => {
    if (memory) {
      const stats = users.map(user => calculatePlayerStats(user, memory));
      setPlayerStats(stats);
    }
  }, [memory, users]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Memory Simulator</h2>

      {/* Formula Input */}
      <FormulaInput onFormulaChange={() => {
        if (memory) {
          const stats = users.map(user => calculatePlayerStats(user, memory));
          setPlayerStats(stats);
        }
      }} />

      {/* Memory Info */}
      {memory && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-xl font-semibold mb-2">{memory.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Principle Vault: {memory.principleVault.toFixed(2)} ATTN</p>
              <p>Revenue Vault: {memory.revenueVault.toFixed(2)} ATTN</p>
              <p>Creator Vault: {memory.creatorVault.toFixed(2)} ATTN</p>
              <p>Total Memory Tokens: {memory.totalMemoryTokens.toFixed(2)}</p>
              <p>Token Price: {calculateMemoryTokenPrice(memory.principleVault, memory.revenueVault).toFixed(4)} ATTN</p>
            </div>
          </div>
        </div>
      )}

      {/* Add New User */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">Add New User</h3>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="flex gap-2">
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'staker' | 'advertiser')}
              className="border p-2 rounded flex-1"
            >
              <option value="staker">Staker</option>
              <option value="advertiser">Advertiser / Airdrop / External Revenues</option>
            </select>
          </div>
          
          {newUserRole === 'advertiser' && (
            <div className="flex gap-2">
              <select
                value={advertiserType}
                onChange={(e) => setAdvertiserType(e.target.value as AdvertiserType)}
                className="border p-2 rounded flex-1"
              >
                <option value="Advertiser">Advertiser</option>
                <option value="Airdrop">Airdrop</option>
                <option value="External Revenue">External Revenue</option>
              </select>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="number"
              value={newUserAmount}
              onChange={(e) => setNewUserAmount(e.target.value)}
              placeholder={`Enter ATTN amount to ${newUserRole === 'staker' ? 'stake' : 'boost'} (in ATTN)`}
              className="border p-2 rounded flex-1"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            Add {newUserRole === 'staker' ? 'Staker' : advertiserType}
          </button>
        </form>
      </div>

      {/* Player Chart */}
      <PlayerChart players={playerStats} />
    </div>
  );
} 