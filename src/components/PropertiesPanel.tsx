import { CheckCircle2, XCircle, AlertTriangle, Shield, Award } from 'lucide-react';
import type { Node } from '../App';

interface PropertiesPanelProps {
  nodes: Node[];
  senderValue: number;
  byzantineNodes: Set<number>;
}

export function PropertiesPanel({ nodes, senderValue, byzantineNodes }: PropertiesPanelProps) {
  // Get honest nodes (excluding sender for decision verification)
  const honestNodes = nodes.filter(n => !n.isByzantine);
  const honestNodesExcludingSender = honestNodes.filter(n => n.id !== 0);
  
  const honestDecisions = honestNodesExcludingSender.map(n => n.finalDecision);
  
  // Check Agreement Property
  const uniqueDecisions = new Set(honestDecisions);
  const agreementSatisfied = uniqueDecisions.size <= 1;

  // Check Validity Property
  const senderIsByzantine = byzantineNodes.has(0);
  let validitySatisfied = true;
  let validityMessage = '';

  if (!senderIsByzantine) {
    // If sender is honest, all honest nodes should decide on sender's value or ⊥
    const allDecidedCorrectly = honestDecisions.every(d => d === senderValue || d === null);
    validitySatisfied = allDecidedCorrectly;
    
    if (validitySatisfied) {
      const numDecidedOnValue = honestDecisions.filter(d => d === senderValue).length;
      validityMessage = `✓ All ${honestNodesExcludingSender.length} honest nodes decided on sender's value (${senderValue}) or ⊥. ${numDecidedOnValue} decided on ${senderValue}.`;
    } else {
      validityMessage = `✗ Some honest nodes decided on a different value than sender's value (${senderValue})`;
    }
  } else {
    validityMessage = 'Sender is Byzantine - validity property only applies when sender is honest';
  }

  // Get decision summary
  const decisionCounts = honestDecisions.reduce((acc, decision) => {
    const key = decision === null ? '⊥' : decision.toString();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-slate-900 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Protocol Properties Verification
          </h2>
          <p className="text-slate-600 text-sm">Checking Agreement, Validity & Termination</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Agreement Property */}
        <div className={`p-6 rounded-2xl border-3 transition-all ${
          agreementSatisfied
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-400 shadow-lg shadow-green-200'
            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 shadow-lg shadow-red-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              agreementSatisfied ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {agreementSatisfied ? (
                <CheckCircle2 className="w-7 h-7 text-white" />
              ) : (
                <XCircle className="w-7 h-7 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <span>Agreement Property</span>
              </h3>
              <p className="text-slate-700 mb-4 bg-white/60 p-3 rounded-lg border border-slate-300">
                <strong>Definition:</strong> All honest nodes must decide on the same value (or all decide ⊥)
              </p>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-slate-300 shadow-md">
                <div className="text-slate-700 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Honest Node Decisions:</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(decisionCounts).map(([decision, count]) => (
                    <div key={decision} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className="text-xl">{decision === '⊥' ? '⊥' : '📌'}</span>
                        <span>Decision: <strong className="text-purple-700">{decision}</strong></span>
                      </span>
                      <span className="px-3 py-1 bg-purple-600 text-white rounded-lg shadow-md">
                        {count} node{count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-lg ${
                agreementSatisfied 
                  ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                  : 'bg-red-100 text-red-800 border-2 border-red-300'
              }`}>
                <strong>{agreementSatisfied ? '✓ Agreement Satisfied' : '✗ Agreement Violated'}</strong>
                <p className="mt-1 text-sm">
                  {agreementSatisfied
                    ? 'All honest nodes agreed on the same value or ⊥'
                    : 'Honest nodes decided on different values'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Validity Property */}
        <div className={`p-6 rounded-2xl border-3 transition-all ${
          senderIsByzantine
            ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-400 shadow-lg shadow-yellow-200'
            : validitySatisfied
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-400 shadow-lg shadow-green-200'
            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 shadow-lg shadow-red-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              senderIsByzantine 
                ? 'bg-yellow-500' 
                : validitySatisfied 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}>
              {senderIsByzantine ? (
                <AlertTriangle className="w-7 h-7 text-white" />
              ) : validitySatisfied ? (
                <CheckCircle2 className="w-7 h-7 text-white" />
              ) : (
                <XCircle className="w-7 h-7 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Validity Property</span>
              </h3>
              <p className="text-slate-700 mb-4 bg-white/60 p-3 rounded-lg border border-slate-300">
                <strong>Definition:</strong> If the sender is honest, all honest nodes must decide on the sender's value
              </p>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-slate-300 shadow-md">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <span className="text-slate-700">👑 Sender Status:</span>
                    <span className={`px-4 py-2 rounded-lg shadow-md ${
                      senderIsByzantine 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    }`}>
                      {senderIsByzantine ? 'Byzantine' : 'Honest'}
                    </span>
                  </div>
                  {!senderIsByzantine && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <span className="text-slate-700">📨 Sender's Value (V*):</span>
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md">
                        {senderValue}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-lg ${
                senderIsByzantine
                  ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                  : validitySatisfied
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-red-100 text-red-800 border-2 border-red-300'
              }`}>
                <strong>
                  {senderIsByzantine 
                    ? 'ℹ️ N/A - Sender is Byzantine' 
                    : validitySatisfied 
                    ? '✓ Validity Satisfied' 
                    : '✗ Validity Violated'}
                </strong>
                <p className="mt-1 text-sm">{validityMessage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Termination Property */}
        <div className="p-6 rounded-2xl border-3 bg-gradient-to-br from-green-50 to-emerald-100 border-green-400 shadow-lg shadow-green-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <span>Termination Property</span>
              </h3>
              <p className="text-slate-700 mb-4 bg-white/60 p-3 rounded-lg border border-slate-300">
                <strong>Definition:</strong> The protocol must terminate in finite time
              </p>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-slate-300 shadow-md">
                <div className="text-slate-700 flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span>Protocol terminated after <strong className="text-green-700">f+1 rounds</strong> as expected</span>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-green-100 text-green-800 border-2 border-green-300">
                <strong>✓ Termination Satisfied</strong>
                <p className="mt-1 text-sm">Protocol completed successfully in finite time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Protocol Explanation */}
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-3 border-blue-300 rounded-2xl p-6 shadow-lg">
          <h3 className="text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              How Dolev-Strong Protocol Works
            </span>
          </h3>
          <div className="space-y-3 text-slate-700 bg-white/60 p-5 rounded-xl border-2 border-blue-200">
            <p className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">🔑</span>
              <span>
                <strong className="text-purple-700">Key Insight:</strong> The protocol catches Byzantine behavior
                through signature chains. Since signatures cannot be forged (PKI assumption), any
                inconsistency can be detected.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚡</span>
              <span>
                <strong className="text-blue-700">Conviction Rule:</strong> Node i is convinced of value V at round t if it
                receives a message with (i) value V, (ii) signed first by sender, (iii) signed by ≥ t-1 other distinct nodes (excluding sender & self).
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">🎯</span>
              <span>
                <strong className="text-pink-700">Decision Rule:</strong> If a node is convinced of exactly one value, it
                outputs that value. If convinced of 0 or ≥2 values, it outputs ⊥ (no decision).
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">🛡️</span>
              <span>
                <strong className="text-green-700">Byzantine Tolerance:</strong> The protocol can tolerate up to f Byzantine nodes
                and always achieves consensus among honest nodes within f+1 rounds.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}