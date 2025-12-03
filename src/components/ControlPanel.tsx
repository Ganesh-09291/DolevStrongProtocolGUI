import { Plus, Minus, Play, SkipForward, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  numNodes: number;
  setNumNodes: (n: number) => void;
  numByzantine: number;
  setNumByzantine: (n: number) => void;
  senderValue: number;
  setSenderValue: (v: number) => void;
  onInitialize: () => void;
  onNextStep: () => void;
  onReset: () => void;
  isProtocolRunning: boolean;
  protocolComplete: boolean;
  currentRound: number;
  maxRounds: number;
  byzantineNodes: Set<number>;
  setByzantineNodes: (nodes: Set<number>) => void;
}

export function ControlPanel({
  numNodes,
  setNumNodes,
  numByzantine,
  setNumByzantine,
  senderValue,
  setSenderValue,
  onInitialize,
  onNextStep,
  onReset,
  isProtocolRunning,
  protocolComplete,
  currentRound,
  maxRounds,
  byzantineNodes,
  setByzantineNodes,
}: ControlPanelProps) {
  
  // ✔ Updated: Byzantine max = numNodes
  const handleNodesChange = (delta: number) => {
    const newValue = Math.max(3, Math.min(10, numNodes + delta));
    setNumNodes(newValue);

    // Clamp byzantine count if needed
    if (numByzantine > newValue) {
      setNumByzantine(newValue);
    }

    // Remove byzantine nodes outside new range
    setByzantineNodes(prev => {
      const updated = new Set<number>();
      for (let id of prev) {
        if (id < newValue) updated.add(id);
      }
      return updated;
    });
  };

  // ✔ Updated: Byzantine change limited only by total nodes
  const handleByzantineChange = (delta: number) => {
    const newValue = Math.max(0, Math.min(numNodes, numByzantine + delta));
    setNumByzantine(newValue);

    // Clear selection if user reduces Byzantine count
    if (newValue < byzantineNodes.size) {
      setByzantineNodes(new Set());
    }
  };

  return (
    <div className="bg-[#1a2942] rounded-lg border border-[#2a3f5f] p-6">
      <h2 className="text-[#8b9dc3] mb-6">Control Panel</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">

        {/* Total Nodes */}
        <div>
          <label className="block text-[#6b7a99] text-sm mb-2">Total Nodes: {numNodes}</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleNodesChange(-1)}
              disabled={isProtocolRunning || numNodes <= 3}
              className="flex-1 bg-[#243447] hover:bg-[#2a3f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleNodesChange(1)}
              disabled={isProtocolRunning || numNodes >= 10}
              className="flex-1 bg-[#243447] hover:bg-[#2a3f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Byzantine Nodes */}
        <div>
          <label className="block text-[#6b7a99] text-sm mb-2">Byzantine Nodes: {numByzantine}</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleByzantineChange(-1)}
              disabled={isProtocolRunning || numByzantine <= 0}
              className="flex-1 bg-[#243447] hover:bg-[#2a3f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* ✔ Updated: disable only if numByzantine = numNodes */}
            <button
              onClick={() => handleByzantineChange(1)}
              disabled={isProtocolRunning || numByzantine >= numNodes}
              className="flex-1 bg-[#243447] hover:bg-[#2a3f5f] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Max Rounds */}
      <div className="mb-6">
        <label className="block text-[#6b7a99] text-sm mb-2">Max Rounds (f+1)</label>
        <div className="bg-[#243447] text-white py-3 px-4 rounded text-center">
          {numByzantine + 1}
        </div>
      </div>

      {/* Select Byzantine Nodes */}
      {!isProtocolRunning && numByzantine > 0 && (
        <div className="mb-6">
          <label className="block text-[#6b7a99] text-sm mb-3">
            Select Byzantine Nodes ({byzantineNodes.size}/{numByzantine})
          </label>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Array.from({ length: numNodes }, (_, i) => i).map((nodeId) => {
              const isSelected = byzantineNodes.has(nodeId);
              const canSelect = isSelected || byzantineNodes.size < numByzantine;

              return (
                <button
                  key={nodeId}
                  onClick={() => {
                    const newSet = new Set(byzantineNodes);
                    if (isSelected) newSet.delete(nodeId);
                    else if (canSelect) newSet.add(nodeId);
                    setByzantineNodes(newSet);
                  }}
                  disabled={!canSelect && !isSelected}
                  className={`w-full py-2 px-4 rounded text-left transition-colors ${
                    isSelected
                      ? "bg-[#ef4444] text-white"
                      : canSelect
                      ? "bg-[#243447] hover:bg-[#2a3f5f] text-white"
                      : "bg-[#1a2942] text-[#4a5a7a] cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      Node {nodeId} {nodeId === 0 ? "(Sender)" : ""}
                    </span>
                    {isSelected && <span>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Start / Next / Reset Buttons */}
      <div className="space-y-3">
        {!isProtocolRunning ? (
          <button
            onClick={onInitialize}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white py-4 rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Protocol
          </button>
        ) : (
          <>
            {!protocolComplete && (
              <button
                onClick={onNextStep}
                disabled={currentRound > maxRounds}
                className="w-full bg-[#6b7a99] hover:bg-[#7b8aaa] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Next Step
              </button>
            )}

            <button
              onClick={onReset}
              className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white py-4 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </>
        )}
      </div>

      {/* Fault Type */}
      {isProtocolRunning && (
        <div className="mt-6 pt-6 border-t border-[#2a3f5f]">
          <label className="block text-[#6b7a99] text-sm mb-2">Faulty Tolerance</label>
          <div className="bg-[#243447] text-white py-3 px-4 rounded text-center">
            {byzantineNodes.size} / {numByzantine}
          </div>
        </div>
      )}
    </div>
  );
}
