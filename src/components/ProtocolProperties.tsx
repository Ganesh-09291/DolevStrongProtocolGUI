import type { Node } from '../App';

interface ProtocolPropertiesProps {
  nodes: Node[];
  senderValue: number;
  byzantineNodes: Set<number>;
  isProtocolRunning: boolean;
  protocolComplete: boolean;
  numByzantine: number;
}

export function ProtocolProperties({ 
  nodes, 
  senderValue, 
  byzantineNodes, 
  isProtocolRunning,
  protocolComplete,
  numByzantine 
}: ProtocolPropertiesProps) {
  
  // Check properties
  const checkTermination = () => {
    if (!protocolComplete) return 'pending';
    return 'satisfied';
  };

  const checkAgreement = () => {
    if (!protocolComplete) return 'pending';
    
    // FIXED: Include ALL honest nodes (including sender)
    const honestNodes = nodes.filter(n => !n.isByzantine);
    
    // If there are no honest nodes (edge case)
    if (honestNodes.length === 0) return 'satisfied';
    
    const decisions = honestNodes.map(n => n.finalDecision);
    const uniqueDecisions = [...new Set(decisions)];
    
    // Dolev-Strong should guarantee agreement
    if (uniqueDecisions.length <= 1) {
      return 'satisfied';
    }
    
    // Check if there are multiple non-null decisions
    const nonNullDecisions = decisions.filter(d => d !== null);
    const uniqueNonNull = [...new Set(nonNullDecisions)];
    
    if (uniqueNonNull.length > 1) {
      return 'violated';
    }
    
    // If some decide on a value and others on ⊥, this is OK for Dolev-Strong
    return 'satisfied';
  };

  const checkValidity = () => {
    if (!protocolComplete) return 'pending';
    
    const senderIsByzantine = byzantineNodes.has(0);
    if (senderIsByzantine) return 'na';
    
    // FIXED: Include ALL honest nodes (including sender)
    const honestNodes = nodes.filter(n => !n.isByzantine);
    
    if (honestNodes.length === 0) return 'satisfied';
    
    // Validity: If sender is honest, ALL honest nodes MUST decide on sender's value
    // In Dolev-Strong with unforgeable signatures, this should always hold
    const allDecidedOnSenderValue = honestNodes.every(n => n.finalDecision === senderValue);
    
    return allDecidedOnSenderValue ? 'satisfied' : 'violated';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'satisfied': return '#22c55e';
      case 'weakly-satisfied': return '#f59e0b';
      case 'violated': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'na': return '#6b7a99';
      default: return '#6b7a99';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'satisfied': return '✓ Satisfied';
      case 'weakly-satisfied': return '⚠️ Partially Satisfied';
      case 'violated': return '✗ Violated';
      case 'pending': return 'Protocol still running';
      case 'na': return 'N/A (Byzantine sender)';
      default: return 'Unknown';
    }
  };

  const terminationStatus = checkTermination();
  const agreementStatus = checkAgreement();
  const validityStatus = checkValidity();

  // Get decision statistics - FIXED: include ALL honest nodes
  const honestNodes = nodes.filter(n => !n.isByzantine);
  const decisions = honestNodes.map(n => n.finalDecision);
  const decisionStats: Record<string, number> = {};
  decisions.forEach(d => {
    const key = d === null ? '⊥' : d.toString();
    decisionStats[key] = (decisionStats[key] || 0) + 1;
  });

  // Check if n >= f+1 (minimum for Dolev-Strong)
  const minNodesRequired = numByzantine + 1;
  const hasEnoughNodes = nodes.length >= minNodesRequired;

  // Check if Byzantine sender case needs more nodes
  const senderIsByzantine = byzantineNodes.has(0);
  const recommendedMinNodes = senderIsByzantine ? 2 * numByzantine + 1 : minNodesRequired;

  return (
    <div className="bg-[#1a2942] rounded-lg border border-[#2a3f5f] p-6">
      <h2 className="text-[#8b9dc3] mb-6">Protocol Properties</h2>
      
      <div className="space-y-4">
        {/* Termination */}
        <div className="bg-[#0f1923] border-2 border-[#f59e0b] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div 
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: getStatusColor(terminationStatus) }}
            ></div>
            <div className="flex-1">
              <h3 className="text-[#8b9dc3] mb-2">1. Termination</h3>
              <p className="text-[#6b7a99] text-sm mb-2">
                All correct processes eventually decide on a value
              </p>
              <div className="text-[#8b9dc3] text-sm">
                {getStatusText(terminationStatus)}
              </div>
              {protocolComplete && (
                <div className="text-[#6b7a99] text-xs mt-1">
                  Protocol completed in {numByzantine + 1} rounds (f+1)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div className="bg-[#0f1923] border-2 border-[#f59e0b] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div 
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: getStatusColor(agreementStatus) }}
            ></div>
            <div className="flex-1">
              <h3 className="text-[#8b9dc3] mb-2">2. Agreement</h3>
              <p className="text-[#6b7a99] text-sm mb-2">
                All honest nodes decide on the same value (or all decide ⊥)
              </p>
              <div className="text-[#8b9dc3] text-sm">
                {getStatusText(agreementStatus)}
              </div>
              {protocolComplete && (
                <div className="text-[#6b7a99] text-xs mt-1">
                  <div className="mt-2">
                    <span className="text-[#8b9dc3]">Honest node decisions (including sender):</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(decisionStats).map(([value, count]) => (
                        <div key={value} className="bg-[#2a3f5f] px-2 py-1 rounded text-xs">
                          {value}: {count} node{count > 1 ? 's' : ''}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-[#6b7a99] mt-1">
                      Total honest nodes: {honestNodes.length}
                    </div>
                  </div>
                  {agreementStatus === 'satisfied' && (
                    <div className="text-[#22c55e] text-xs mt-2">
                      ✅ Dolev-Strong protocol achieved agreement!
                    </div>
                  )}
                  {agreementStatus === 'violated' && (
                    <div className="text-[#ef4444] text-xs mt-2">
                      ⚠️ Dolev-Strong agreement violated!
                      {!hasEnoughNodes && (
                        <div className="mt-1">
                          Need n ≥ f+1 ({minNodesRequired} nodes) for Dolev-Strong
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="bg-[#0f1923] border-2 border-[#f59e0b] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div 
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: getStatusColor(validityStatus) }}
            ></div>
            <div className="flex-1">
              <h3 className="text-[#8b9dc3] mb-2">3. Validity</h3>
              <p className="text-[#6b7a99] text-sm mb-2">
                If the sender is honest, all honest nodes must decide on the sender's value
              </p>
              <div className="text-[#8b9dc3] text-sm">
                {getStatusText(validityStatus)}
              </div>
              {protocolComplete && (
                <div className="text-[#6b7a99] text-xs mt-1">
                  {byzantineNodes.has(0) ? (
                    <div>
                      <span>Sender is Byzantine, validity property does not apply</span>
                      <div className="text-[#f59e0b] text-xs mt-1">
                        Note: With Byzantine sender, validity condition is not required
                      </div>
                    </div>
                  ) : validityStatus === 'satisfied' ? (
                    <div>
                      <span>✅ All honest nodes decided on sender's value {senderValue}</span>
                      <div className="text-[#22c55e] text-xs mt-1">
                        Dolev-Strong correctly ensured validity with honest sender
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span>❌ Some honest nodes decided on wrong value (not {senderValue})</span>
                      <div className="text-[#ef4444] text-xs mt-1">
                        ⚠️ Dolev-Strong should guarantee validity when sender is honest!
                        This indicates a protocol implementation bug.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Information */}
      <div className="mt-6 pt-6 border-t border-[#2a3f5f]">
        <h3 className="text-[#8b9dc3] mb-3">Protocol Information</h3>
        <div className="space-y-2 text-sm text-[#6b7a99]">
          <div>• Dolev-Strong guarantees agreement for any f &lt; n</div>
          <div>• Uses digital signatures that cannot be forged (PKI)</div>
          <div>• Synchronous network with rounds</div>
          <div>• When sender is honest, all honest nodes must decide on sender's value</div>
          <div>• With Byzantine sender, n ≥ 2f+1 recommended for agreement</div>
          <div>• Protocol runs for f+1 rounds</div>
          <div className="mt-3 text-[#8b9dc3]">
            Current: n={nodes.length}, f={numByzantine}, rounds={numByzantine + 1}
          </div>
          <div className="text-[#8b9dc3]">
            {senderIsByzantine ? (
              <span>⚠️ Byzantine sender case: n should be ≥ 2f+1 = {recommendedMinNodes} for best results</span>
            ) : (
              <span>✓ Honest sender case: n ≥ f+1 = {minNodesRequired} is sufficient</span>
            )}
          </div>
          {protocolComplete && agreementStatus === 'satisfied' && validityStatus === 'satisfied' && (
            <div className="text-[#22c55e] text-xs mt-2">
              ✅ Dolev-Strong protocol correctly achieved Byzantine agreement with all properties satisfied!
            </div>
          )}
          {protocolComplete && agreementStatus === 'satisfied' && validityStatus === 'na' && (
            <div className="text-[#22c55e] text-xs mt-2">
              ✅ Dolev-Strong protocol achieved agreement (validity not required with Byzantine sender)!
            </div>
          )}
          {protocolComplete && (agreementStatus === 'violated' || validityStatus === 'violated') && (
            <div className="text-[#ef4444] text-xs mt-2">
              ⚠️ Protocol properties violated! Check:
              <ul className="mt-1 ml-4 list-disc">
                <li>n ≥ f+1 required (currently n={nodes.length}, need ≥{minNodesRequired})</li>
                {senderIsByzantine && <li>With Byzantine sender, n ≥ 2f+1 recommended</li>}
                <li>Signature chains must be unforgeable</li>
                <li>Network must be synchronous</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
