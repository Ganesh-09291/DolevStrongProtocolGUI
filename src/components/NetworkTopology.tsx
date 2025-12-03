import type { Node, Message } from '../App';
import { useState } from 'react';

interface NetworkTopologyProps {
  nodes: Node[];
  messages: Message[];
  currentRound: number;
  isProtocolRunning: boolean;
}

export function NetworkTopology({ nodes, messages, currentRound, isProtocolRunning }: NetworkTopologyProps) {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  return (
    <div className="bg-[#1a2942] rounded-lg border border-[#2a3f5f] p-6">
      <h2 className="text-[#8b9dc3] mb-6">Network Topology</h2>
      
      <div className="bg-[#0f1923] rounded-lg border border-[#2a3f5f] relative" style={{ height: '400px' }}>
        {!isProtocolRunning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[#4a5a7a] text-lg mb-2">Click "Start Protocol" to begin</div>
            <div className="text-[#3a4a6a] text-sm">Configure nodes and Byzantine failures above</div>
          </div>
        ) : (
          <svg width="100%" height="100%" viewBox="0 0 600 400">
            {/* Draw edges (connections between nodes) */}
            {nodes.map(fromNode => 
              nodes.filter(n => n.id !== fromNode.id).map(toNode => (
                <line
                  key={`edge-${fromNode.id}-${toNode.id}`}
                  x1={fromNode.position?.x}
                  y1={fromNode.position?.y}
                  x2={toNode.position?.x}
                  y2={toNode.position?.y}
                  stroke="#2a3f5f"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))
            )}

            {/* Draw active message paths */}
            {messages
              .filter(msg => msg.round === currentRound - 1 || msg.round === currentRound)
              .slice(-20) // Show last 20 messages for performance
              .map((msg, idx) => {
                const fromNode = nodes.find(n => n.id === msg.fromNode);
                const toNode = nodes.find(n => n.id === msg.toNode);
                if (!fromNode?.position || !toNode?.position) return null;

                return (
                  <g key={`msg-${msg.id}-${idx}`}>
                    <line
                      x1={fromNode.position.x}
                      y1={fromNode.position.y}
                      x2={toNode.position.x}
                      y2={toNode.position.y}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                  </g>
                );
              })}

            {/* Draw nodes */}
            {nodes.map(node => {
              if (!node.position) return null;

              const isSelected = selectedNode === node.id;
              const nodeColor = node.isByzantine 
                ? '#ef4444' 
                : node.isSender 
                ? '#f59e0b' 
                : '#22c55e';
              
              const nodeRadius = node.isSender ? 25 : 20;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  className="cursor-pointer"
                >
                  {/* Node glow effect when convinced */}
                  {node.convincedValues.size > 0 && !node.isByzantine && (
                    <circle
                      cx={node.position.x}
                      cy={node.position.y}
                      r={nodeRadius + 8}
                      fill={nodeColor}
                      opacity="0.2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={node.position.x}
                      cy={node.position.y}
                      r={nodeRadius + 5}
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="2"
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={nodeRadius}
                    fill={nodeColor}
                    stroke="#1a2942"
                    strokeWidth="3"
                  />

                  {/* Node ID */}
                  <text
                    x={node.position.x}
                    y={node.position.y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {node.id}
                  </text>

                  {/* Sender crown */}
                  {node.isSender && (
                    <text
                      x={node.position.x}
                      y={node.position.y - 30}
                      textAnchor="middle"
                      fontSize="20"
                    >
                      👑
                    </text>
                  )}

                  {/* Node label */}
                  <text
                    x={node.position.x}
                    y={node.position.y + nodeRadius + 18}
                    textAnchor="middle"
                    fill="#8b9dc3"
                    fontSize="12"
                  >
                    Node {node.id}
                  </text>

                  {/* Convinced indicator */}
                  {node.convincedValues.size > 0 && !node.isByzantine && (
                    <text
                      x={node.position.x}
                      y={node.position.y + nodeRadius + 32}
                      textAnchor="middle"
                      fill="#fbbf24"
                      fontSize="10"
                    >
                      ✓ {node.convincedValues.size} value(s)
                    </text>
                  )}

                  {/* Final decision */}
                  {node.finalDecision !== null && (
                    <g>
                      <rect
                        x={node.position.x - 20}
                        y={node.position.y - nodeRadius - 25}
                        width="40"
                        height="20"
                        fill="#8b5cf6"
                        rx="4"
                      />
                      <text
                        x={node.position.x}
                        y={node.position.y - nodeRadius - 11}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {node.finalDecision}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Node info panel */}
        {selectedNode !== null && isProtocolRunning && (
          <div className="absolute bottom-4 right-4 bg-[#1a2942] border border-[#2a3f5f] rounded-lg p-4 max-w-xs">
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;

              return (
                <div className="space-y-2">
                  <div className="text-[#8b9dc3] font-semibold">
                    Node {node.id} {node.isSender && '(Sender)'}
                  </div>
                  <div className="text-sm text-[#6b7a99]">
                    Status: {node.isByzantine ? '🔴 Byzantine' : '🟢 Honest'}
                  </div>
                  {!node.isByzantine && (
                    <>
                      <div className="text-sm text-[#6b7a99]">
                        Convinced of: {node.convincedValues.size === 0 
                          ? 'None yet' 
                          : Array.from(node.convincedValues.keys()).join(', ')}
                      </div>
                      <div className="text-sm text-[#6b7a99]">
                        Messages: {node.receivedMessages.length}
                      </div>
                      {node.finalDecision !== null && (
                        <div className="text-sm text-[#8b5cf6] font-semibold">
                          Decision: {node.finalDecision}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend */}
      {isProtocolRunning && (
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#f59e0b]"></div>
            <span className="text-[#6b7a99]">Sender</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#22c55e]"></div>
            <span className="text-[#6b7a99]">Honest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#ef4444]"></div>
            <span className="text-[#6b7a99]">Byzantine</span>
          </div>
        </div>
      )}
    </div>
  );
}
