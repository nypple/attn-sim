import React from 'react';
import { PlayerStats } from '../types';
import { useSimulation } from '../context/SimulationContext';

interface PlayerChartProps {
  players: PlayerStats[];
}

export function PlayerChart({ players }: PlayerChartProps) {
  const { redeemPosition } = useSimulation();

  const getRoleStyle = (role: string, hasRedeemed: boolean) => {
    if (hasRedeemed) {
      return 'bg-red-100 text-red-800';
    }
    switch (role) {
      case 'creator':
        return 'bg-purple-100 text-purple-800';
      case 'staker':
        return 'bg-green-100 text-green-800';
      case 'advertiser':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAPY = (profitLoss: number, stakedAmount: number) => {
    if (stakedAmount === 0) return 0;
    return (profitLoss / stakedAmount) * 100;
  };

  const calculateHoldingPercentage = (playerTokens: number, totalTokens: number) => {
    if (totalTokens === 0) return 0;
    return (playerTokens / totalTokens) * 100;
  };

  const calculateAveragePrice = (stakedAmount: number, memoryTokens: number) => {
    if (memoryTokens === 0) return 0;
    return stakedAmount / memoryTokens;
  };

  // Calculate total memory tokens across all players
  const totalMemoryTokens = players.reduce((sum, player) => sum + (player.memoryTokens ?? 0), 0);

  const getRoleLabel = (role: string, address: string, hasRedeemed: boolean) => {
    if (hasRedeemed) {
      return 'Redeemed';
    }
    if (role === 'advertiser') {
      // Extract the type from the address (e.g., "Advertiser_1" -> "Advertiser")
      const type = address.split('_')[0];
      return type;
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleRedeem = (player: PlayerStats) => {
    if (player.role === 'staker' && player.memoryTokens > 0) {
      redeemPosition('1', player.address); // Pass both memory ID and player address
    }
  };

  const canRedeem = (player: PlayerStats) => {
    return player.role === 'staker' && player.memoryTokens > 0;
  };

  const hasRedeemed = (player: PlayerStats) => {
    return player.role === 'staker' && player.stakedAmount > 0 && player.memoryTokens === 0;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Player Chart</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-right">Memory Tokens</th>
              <th className="px-4 py-2 text-right">Staked Amount</th>
              <th className="px-4 py-2 text-right">Injected Amount</th>
              <th className="px-4 py-2 text-right">Avg Token Price</th>
              <th className="px-4 py-2 text-right">Potential Redemption</th>
              <th className="px-4 py-2 text-right">Profit/Loss (APY)</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const stakedAmount = player.stakedAmount ?? 0;
              const memoryTokens = player.memoryTokens ?? 0;
              const potentialRedemption = player.potentialRedemption?.total ?? 0;
              const profitLoss = potentialRedemption - stakedAmount;
              const apy = player.role !== 'creator' ? calculateAPY(profitLoss, stakedAmount) : null;
              const holdingPercentage = calculateHoldingPercentage(memoryTokens, totalMemoryTokens);
              const avgPrice = calculateAveragePrice(stakedAmount, memoryTokens);
              const redeemed = hasRedeemed(player);
              
              return (
                <tr key={player.address} className="border-t">
                  <td className="px-4 py-2">{player.address}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getRoleStyle(player.role, redeemed)}`}>
                      {getRoleLabel(player.role, player.address, redeemed)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {memoryTokens.toFixed(2)}
                    {holdingPercentage > 0 && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({holdingPercentage.toFixed(2)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{stakedAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    {player.role === 'advertiser' ? player.injectedAmount.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {player.role === 'staker' && memoryTokens > 0 ? (
                      <span className="text-sm text-gray-600">
                        {avgPrice.toFixed(4)} ATTN
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {player.potentialRedemption ? (
                      <div className="flex flex-col items-end">
                        <div className="text-sm text-gray-600">
                          Principle: {player.potentialRedemption.principle.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Revenue: {player.potentialRedemption.revenue.toFixed(2)}
                        </div>
                        <div className="font-medium">
                          Total: {player.potentialRedemption.total.toFixed(2)}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${
                    profitLoss > 0 
                      ? 'text-green-600' 
                      : profitLoss < 0 
                      ? 'text-red-600' 
                      : ''
                  }`}>
                    {profitLoss.toFixed(2)}
                    {apy !== null && (
                      <span className="ml-2 text-sm">
                        ({apy > 0 ? '+' : ''}{apy.toFixed(2)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {canRedeem(player) && (
                      <button
                        onClick={() => handleRedeem(player)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        title="Redeem position"
                      >
                        Redeem
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 