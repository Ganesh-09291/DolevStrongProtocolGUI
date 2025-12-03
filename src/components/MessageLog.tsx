import { MessageSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface MessageLogProps {
  messages: string[];
}

export function MessageLog({ messages }: MessageLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-[#1a2942] rounded-lg border border-[#2a3f5f] p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-[#8b9dc3]" />
        <h2 className="text-[#8b9dc3]">Message Log</h2>
      </div>
      
      <div className="bg-[#0f1923] rounded-lg border border-[#2a3f5f] p-4 h-[400px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-[#4a5a7a] text-center py-8">
            No messages yet. Start the protocol to see activity.
          </div>
        ) : (
          <div className="space-y-2 font-mono text-sm">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className="text-[#8b9dc3] hover:bg-[#1a2942] p-2 rounded transition-colors"
              >
                {msg}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
