import React, { useState } from 'react';
import { setPriceFormula, recalculatePositions } from '../utils/memory';
import { Parser } from 'expr-eval';
import { useSimulation } from '../context/SimulationContext';

const parser = new Parser();

interface FormulaInputProps {
  onFormulaChange: () => void;
}

export function FormulaInput({ onFormulaChange }: FormulaInputProps) {
  const { memories, users, setUsers, setMemories } = useSimulation();
  const [formula, setFormula] = useState('0.005 * (tvl^0.6) + 0.1');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Check if we can update the curve (only if no players exist)
  const canUpdateCurve = users.length === 1 && users[0].role === 'creator';

  const validateFormula = (formula: string): boolean => {
    try {
      // Test the formula with a sample value
      const testFormula = formula.replace(/\s+/g, ''); // Remove whitespace
      parser.parse(testFormula);
      parser.evaluate(testFormula, { tvl: 100 });
      return true;
    } catch (err) {
      console.error('Formula validation error:', err);
      return false;
    }
  };

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormula = e.target.value;
    setFormula(newFormula);
    
    const valid = validateFormula(newFormula);
    setIsValid(valid);
    if (!valid) {
      setError('Invalid formula. Please check your syntax.');
    } else {
      setError(null);
    }
  };

  const handleRecalculate = () => {
    if (isValid && memories[0] && canUpdateCurve) {
      const cleanFormula = formula.replace(/\s+/g, ''); // Remove whitespace
      setPriceFormula(cleanFormula);
      // Recalculate all positions with the new formula
      const { updatedUsers, updatedMemory } = recalculatePositions(memories[0], users);
      setUsers(updatedUsers);
      // Update the memory with new total memory tokens
      setMemories([updatedMemory]);
      onFormulaChange();
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-2">Bonding Curve Formula</h3>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={formula}
            onChange={handleFormulaChange}
            placeholder="Enter formula using 'tvl' variable"
            className={`border p-2 rounded flex-1 ${error ? 'border-red-500' : ''}`}
          />
          <button
            onClick={handleRecalculate}
            disabled={!isValid || !canUpdateCurve}
            className={`px-4 py-2 rounded ${
              isValid && canUpdateCurve
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!canUpdateCurve ? "Can't update curve after players have been added" : ""}
          >
            Update Curve
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        {!canUpdateCurve && (
          <p className="text-yellow-600 text-sm">
            Note: Curve can only be updated before adding any players
          </p>
        )}
        <p className="text-sm text-gray-600">
          Available operations: +, -, *, /, ^ (power)
          <br />
          Use 'tvl' to represent the total value locked (principle + revenue)
        </p>
        <div className="text-sm text-gray-600">
          <p className="font-medium">Example formulas:</p>
          <ul className="list-disc list-inside">
            <li>0.005 * (tvl^0.6) + 0.1 (power curve)</li>
            <li>0.1 + tvl * 0.001 (linear)</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 