'use client';

import { SimulationProvider } from './context/SimulationContext';
import { MemorySimulator } from './components/MemorySimulator';

export default function Home() {
  return (
    <SimulationProvider>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center py-8">
            ATTN Staking Simulator
          </h1>
          <MemorySimulator />
        </div>
      </main>
    </SimulationProvider>
  );
} 