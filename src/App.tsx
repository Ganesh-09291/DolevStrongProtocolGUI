import { useEffect, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { NetworkTopology } from './components/NetworkTopology';
import { ProtocolProperties } from './components/ProtocolProperties';
import { MessageLog } from './components/MessageLog';

export interface Node {
  id: number;
  isSender: boolean;
  isByzantine: boolean;
  convincedValues: Map<number, number>; // value -> round when convinced
  receivedMessages: Message[];
  finalDecision: number | null; // null represents ⊥
  position?: { x: number; y: number };
}

export interface Message {
  value: number;
  signatures: number[]; // ordered list of node IDs that signed
  fromNode: number;
  toNode: number;
  round: number;
  id: string;
}

export default function App() {
  const [numNodes, setNumNodes] = useState(3);
  const [numByzantine, setNumByzantine] = useState(1);
  const [senderValue, setSenderValue] = useState(7);
  const [currentRound, setCurrentRound] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [messageLog, setMessageLog] = useState<string[]>([]);
  const [isProtocolRunning, setIsProtocolRunning] = useState(false);
  const [protocolComplete, setProtocolComplete] = useState(false);
  const [byzantineNodes, setByzantineNodes] = useState<Set<number>>(new Set([1]));

  // Keep numByzantine <= numNodes and remove invalid node ids from set when numNodes changes
  useEffect(() => {
    if (numByzantine > numNodes) {
      setNumByzantine(numNodes);
    }

    setByzantineNodes(prev => {
      const updated = new Set<number>();
      for (const id of prev) {
        if (id < numNodes) updated.add(id);
      }
      // If the resulting set is smaller than numByzantine, don't auto-add here;
      // initialization will ensure selection matches numByzantine.
      return updated;
    });
  }, [numNodes]);

  // Ensure byzantineNodes size never exceeds numByzantine (when user reduces numByzantine directly)
  useEffect(() => {
    setByzantineNodes(prev => {
      if (prev.size <= numByzantine) return prev;
      // Trim to first numByzantine entries (ascending)
      const arr = Array.from(prev).sort((a, b) => a - b).slice(0, numByzantine);
      return new Set(arr);
    });
  }, [numByzantine]);

  const addLog = (message: string) => {
    setMessageLog(prev => [...prev, `[Round ${currentRound}] ${message}`]);
  };

  const initializeProtocol = () => {
    // Clear logs
    setMessageLog([]);
    
    // Ensure byzantineNodes selection matches numByzantine if user hasn't selected enough
    setByzantineNodes(prev => {
      if (prev.size === numByzantine) return prev;
      const newSet = new Set<number>(Array.from(prev).filter(id => id < numNodes));
      // If still less than requested, auto-select lowest-numbered nodes until count reached
      for (let i = 0; newSet.size < numByzantine && i < numNodes; i++) {
        newSet.add(i);
      }
      return newSet;
    });

    // Create nodes with positions in a circle (use a fresh byzantine snapshot)
    const byzSnapshot = new Set<number>(Array.from(byzantineNodes).filter(i => i < numNodes));
    // If snapshot size < numByzantine, fill with lowest ids
    let idx = 0;
    while (byzSnapshot.size < numByzantine && idx < numNodes) {
      byzSnapshot.add(idx);
      idx++;
    }

    const initialNodes: Node[] = Array.from({ length: numNodes }, (_, i) => {
      const angle = (i * 2 * Math.PI) / numNodes - Math.PI / 2;
      const radius = 150;
      return {
        id: i,
        isSender: i === 0,
        isByzantine: byzSnapshot.has(i),
        convincedValues: new Map(),
        receivedMessages: [],
        finalDecision: null,
        position: {
          x: 300 + radius * Math.cos(angle),
          y: 200 + radius * Math.sin(angle),
        },
      };
    });

    setNodes(initialNodes);
    setAllMessages([]);
    setCurrentRound(0);
    setProtocolComplete(false);
    setIsProtocolRunning(true);

    addLog(`Protocol initialized with ${numNodes} nodes, f=${numByzantine}`);
    if (byzSnapshot.has(0)) {
      addLog(`⚠️ Sender (Node 0) is BYZANTINE!`);
    } else {
      addLog(`Sender (Node 0) is honest, will broadcast value V*=${senderValue}`);
    }
    addLog(`Byzantine nodes: ${Array.from(byzSnapshot).join(', ') || 'None'}`);

    // Round 0: Sender sends value to all nodes
    setTimeout(() => executeRound0(initialNodes, byzSnapshot), 500);
  };

  const executeRound0 = (initialNodes: Node[], byzSnapshot: Set<number>) => {
    const sender = initialNodes[0];
    const newMessages: Message[] = [];

    if (sender.isByzantine) {
      addLog(`Round 0: Byzantine sender sends DIFFERENT values to different nodes!`);
    } else {
      addLog(`Round 0: Sender broadcasts V*=${senderValue} with signature to all nodes`);
    }

    // Sender sends value to all other nodes
    for (let i = 1; i < numNodes; i++) {
      let valueToSend = senderValue;
      
      // If sender is Byzantine, send different values to different nodes
      if (sender.isByzantine) {
        // Byzantine sender strategy (example): change for node 1 only
        if (i === 1) {
          valueToSend = senderValue + 1;
        } else {
          valueToSend = senderValue;
        }
      }
      
      const message: Message = {
        value: valueToSend,
        signatures: [0], // Only sender's signature
        fromNode: 0,
        toNode: i,
        round: 0,
        id: `r0-n0-to-n${i}-v${valueToSend}`,
      };
      newMessages.push(message);
      
      if (sender.isByzantine) {
        addLog(`  ⚠️ Byzantine sender → Node ${i}: V=${valueToSend}, [0]`);
      } else {
        addLog(`  → Node 0 sends (V=${valueToSend}, [0]) to Node ${i}`);
      }
    }

    setAllMessages(newMessages);

    // Update nodes with received messages
    const updatedNodes = initialNodes.map(node => {
      if (node.id === 0) {
        // Sender is convinced of its own value in round 0
        return {
          ...node,
          convincedValues: new Map([[senderValue, 0]])
        };
      }
      
      const receivedMsg = newMessages.find(m => m.toNode === node.id);
      if (receivedMsg) {
        return {
          ...node,
          receivedMessages: [receivedMsg],
          convincedValues: new Map([[receivedMsg.value, 0]])
        };
      }
      return node;
    });

    setNodes(updatedNodes);
    
    // Nodes echo their convinced values from round 0
    setTimeout(() => {
      const round0Echoes: Message[] = [];
      
      updatedNodes.forEach(node => {
        // ALL nodes echo, including sender
        const convincedValues = Array.from(node.convincedValues.keys());
        if (convincedValues.length > 0) {
          const value = convincedValues[0];
          
          if (node.isByzantine) {
            addLog(`  ⚠️ Byzantine Node ${node.id} echoes V=${value}`);
          } else {
            addLog(`  → Node ${node.id} echoes V=${value} (convinced in round 0)`);
          }
          
          for (let i = 0; i < numNodes; i++) {
            if (i !== node.id) {
              const echoMsg: Message = {
                value,
                signatures: node.id === 0 ? [0] : [0, node.id], // Sender just signs with [0]
                fromNode: node.id,
                toNode: i,
                round: 0,
                id: `r0-n${node.id}-to-n${i}-v${value}`,
              };
              round0Echoes.push(echoMsg);
            }
          }
        }
      });
      
      // Add echoes to messages and update nodes
      setAllMessages(prev => [...prev, ...round0Echoes]);
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          receivedMessages: [
            ...node.receivedMessages,
            ...round0Echoes.filter(m => m.toNode === node.id)
          ]
        }))
      );
      
      setCurrentRound(1);
    }, 500);
  };

  const executeNextRound = () => {
    const t = currentRound; // Current round number

    if (t > numByzantine + 1) {
      if (!protocolComplete) {
        completeProtocol();
      }
      return;
    }

    addLog(`Round ${t}: Checking conviction and echoing messages`);

    const newMessages: Message[] = [...allMessages];
    const updatedNodes = nodes.map(node => ({ 
      ...node, 
      receivedMessages: [...node.receivedMessages],
      convincedValues: new Map(node.convincedValues)
    }));

    // Track which nodes echo in this round
    const nodesThatWillEcho = new Set<number>();

    // First pass: Determine which nodes become convinced in this round
    nodes.forEach(node => {
      // Check all received messages
      node.receivedMessages.forEach(msg => {
        const value = msg.value;
        
        // Skip if already convinced of this value
        if (updatedNodes[node.id].convincedValues.has(value)) return;

        // For Byzantine nodes, they can echo anything
        if (node.isByzantine) {
          nodesThatWillEcho.add(node.id);
          return;
        }

        // DOLEV-STRONG CONVICTION RULE:
        // A node is convinced of value V at the END of round r if:
        // 1. Message is signed first by sender (signatures[0] === 0)
        // 2. Message has at least r+1 signatures total
        
        if (msg.signatures[0] !== 0) return; // Must be signed first by sender
        
        // Count unique signatures
        const uniqueSignatures = [...new Set(msg.signatures)];
        
        // At the end of round t, need t+1 signatures
        if (uniqueSignatures.length >= t + 1) {
          // Node becomes convinced!
          updatedNodes[node.id].convincedValues.set(value, t);
          addLog(`  ✓ Node ${node.id} convinced of V=${value} at round ${t} (${uniqueSignatures.length} ≥ ${t+1} sigs)`);
          
          // Mark to echo
          nodesThatWillEcho.add(node.id);
        }
      });
    });

    // Second pass: Nodes echo values they're convinced of
    let echoCount = 0;
    nodes.forEach(node => {
      // Nodes echo if they became convinced in this round OR are Byzantine
      const shouldEcho = nodesThatWillEcho.has(node.id) || node.isByzantine;
      
      if (shouldEcho) {
        // Echo all values this node is convinced of
        const convincedValues = Array.from(updatedNodes[node.id].convincedValues.keys());
        
        convincedValues.forEach(value => {
          // Find a message with this value that convinced the node
          const convincingMsg = node.receivedMessages.find(msg => 
            msg.value === value && 
            msg.signatures[0] === 0
          );
          
          if (convincingMsg || node.id === 0) { // Sender can echo without receiving
            let echoedValue = value;
            
            if (node.isByzantine) {
              // Byzantine nodes might modify values
              echoedValue = value; // Echoing truthfully for now
              addLog(`  ⚠️ Byzantine Node ${node.id} echoes V=${echoedValue}`);
            } else {
              addLog(`  → Node ${node.id} echoes (V=${echoedValue}, [...])`);
            }

            // Echo to all other nodes
            for (let i = 0; i < numNodes; i++) {
              if (i !== node.id) {
                const signatures = node.id === 0 
                  ? [0]  // Sender just signs with [0]
                  : convincingMsg 
                    ? [...convincingMsg.signatures, node.id] 
                    : [0, node.id]; // Default if no convincing message
                
                const newMsg: Message = {
                  value: echoedValue,
                  signatures,
                  fromNode: node.id,
                  toNode: i,
                  round: t,
                  id: `r${t}-n${node.id}-to-n${i}-v${echoedValue}`,
                };
                newMessages.push(newMsg);
                updatedNodes[i].receivedMessages.push(newMsg);
                echoCount++;
              }
            }
          }
        });
      }
    });

    if (echoCount === 0) {
      addLog(`  No new convictions or echoes in this round`);
    }

    setAllMessages(newMessages);
    setNodes(updatedNodes);
    
    if (t >= numByzantine + 1) {
      // Protocol completes after f+1 rounds
      addLog(`Round ${t} complete. Protocol has run for f+1=${numByzantine + 1} rounds.`);
      setTimeout(() => completeProtocol(), 500);
    } else {
      setCurrentRound(t + 1);
    }
  };

  const completeProtocol = () => {
    addLog(`Computing final decisions...`);
    
    // According to Dolev-Strong:
    // If a node is convinced of exactly one value, output that value
    // Otherwise output ⊥
    
    const finalNodes = nodes.map(node => {
      const convincedValues = Array.from(node.convincedValues.keys());
      
      if (node.isByzantine) {
        // Byzantine nodes can decide arbitrarily
        let decision;
        
        if (convincedValues.length === 1) {
          decision = convincedValues[0];
          addLog(`  ⚠️ Byzantine Node ${node.id}: Decides on ${decision} (convinced of 1 value)`);
        } else if (convincedValues.length > 1) {
          decision = convincedValues[Math.floor(Math.random() * convincedValues.length)];
          addLog(`  ⚠️ Byzantine Node ${node.id}: Arbitrarily chooses ${decision} from ${convincedValues.length} values`);
        } else {
          decision = null;
          addLog(`  ⚠️ Byzantine Node ${node.id}: Decides on ⊥ (not convinced of any value)`);
        }
        return { ...node, finalDecision: decision };
      }
      
      // Honest nodes follow the protocol
      if (convincedValues.length === 1) {
        const value = convincedValues[0];
        addLog(`  Node ${node.id}: Decided on ${value} (convinced of 1 value)`);
        return { ...node, finalDecision: value };
      } else {
        addLog(`  Node ${node.id}: Decided on ⊥ (convinced of ${convincedValues.length} values: ${convincedValues.join(', ')})`);
        return { ...node, finalDecision: null };
      }
    });

    setNodes(finalNodes);
    setProtocolComplete(true);
    addLog(`✅ Protocol Complete!`);
    
    // Analyze the result - FIX: Include ALL honest nodes (including sender)
    const honestNodes = finalNodes.filter(n => !n.isByzantine);
    const decisions = honestNodes.map(n => n.finalDecision);
    const uniqueDecisions = [...new Set(decisions)];
    
    if (uniqueDecisions.length === 1) {
      addLog(`🎉 AGREEMENT ACHIEVED: All ${honestNodes.length} honest nodes decided on the same value: ${uniqueDecisions[0] === null ? '⊥' : uniqueDecisions[0]}`);
    } else {
      addLog(`⚠️ Agreement Analysis: Honest nodes decided on ${uniqueDecisions.length} different values`);
      uniqueDecisions.forEach((val, idx) => {
        const count = decisions.filter(d => d === val).length;
        addLog(`  Value ${val === null ? '⊥' : val}: ${count} nodes`);
      });
    }
    
    // Check validity if sender is honest
    const senderIsByzantine = byzantineNodes.has(0);
    if (!senderIsByzantine) {
      const allHonestDecidedSenderValue = honestNodes.every(n => n.finalDecision === senderValue);
      if (allHonestDecidedSenderValue) {
        addLog(`✅ VALIDITY ACHIEVED: All honest nodes decided on sender's value ${senderValue}`);
      } else {
        const wrongCount = honestNodes.filter(n => n.finalDecision !== senderValue).length;
        addLog(`⚠️ Validity Violated: ${wrongCount}/${honestNodes.length} honest nodes did not decide on sender's value ${senderValue}`);
      }
    }
    
    // Dolev-Strong analysis
    addLog(`--- Dolev-Strong Analysis ---`);
    honestNodes.forEach(node => {
      const values = Array.from(node.convincedValues.keys());
      if (values.length > 0) {
        addLog(`  Node ${node.id} convinced of: ${values.join(', ')} (at rounds ${Array.from(node.convincedValues.values()).join(', ')})`);
      } else {
        addLog(`  Node ${node.id} not convinced of any value`);
      }
    });
  };

  const resetProtocol = () => {
    setIsProtocolRunning(false);
    setProtocolComplete(false);
    setCurrentRound(0);
    setNodes([]);
    setAllMessages([]);
    setMessageLog([]);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-[#8b9dc3] mb-2">Dolev-Strong Protocol Simulator</h1>
          <p className="text-[#6b7a99]">Interactive Byzantine Agreement Protocol Demonstration</p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Panel */}
            <ControlPanel
              numNodes={numNodes}
              setNumNodes={setNumNodes}
              numByzantine={numByzantine}
              setNumByzantine={setNumByzantine}
              senderValue={senderValue}
              setSenderValue={setSenderValue}
              onInitialize={initializeProtocol}
              onNextStep={executeNextRound}
              onReset={resetProtocol}
              isProtocolRunning={isProtocolRunning}
              protocolComplete={protocolComplete}
              currentRound={currentRound}
              maxRounds={numByzantine + 1}
              byzantineNodes={byzantineNodes}
              setByzantineNodes={setByzantineNodes}
            />

            {/* Network Topology */}
            <NetworkTopology
              nodes={nodes}
              messages={allMessages}
              currentRound={currentRound}
              isProtocolRunning={isProtocolRunning}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Protocol Properties */}
            <ProtocolProperties
              nodes={nodes}
              senderValue={senderValue}
              byzantineNodes={byzantineNodes}
              isProtocolRunning={isProtocolRunning}
              protocolComplete={protocolComplete}
              numByzantine={numByzantine}
            />

            {/* Message Log */}
            <MessageLog messages={messageLog} />
          </div>
        </div>
      </div>
    </div>
  );
}
