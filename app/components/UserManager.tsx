import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';

export function UserManager() {
  const { currentUser, selectUser } = useSimulation();
  const [address, setAddress] = useState('');

  const handleSelectUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    selectUser(address);
    setAddress('');
  };

  return (
    <div className="p-4 border-b">
      <h2 className="text-2xl font-bold mb-4">User Manager</h2>
      
      {/* User Selection Form */}
      <form onSubmit={handleSelectUser} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Address"
            className="border p-2 rounded flex-1"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Select User
          </button>
        </div>
      </form>

      {/* Current User Info */}
      {currentUser && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Current User</h3>
          <p>Address: {currentUser.address}</p>
          <p>ATTN Balance: {currentUser.attnBalance.toFixed(2)}</p>
          <div className="mt-2">
            <h4 className="font-semibold">Memory Tokens:</h4>
            {Object.entries(currentUser.memoryTokens).map(([memoryId, amount]) => (
              <p key={memoryId}>
                Memory {memoryId}: {amount.toFixed(2)} tokens
              </p>
            ))}
          </div>
          <div className="mt-2">
            <h4 className="font-semibold">Stake Positions:</h4>
            {currentUser.stakePositions.map((position) => (
              <p key={position.memoryId}>
                Memory {position.memoryId}: {position.attnAmount.toFixed(2)} ATTN staked
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 