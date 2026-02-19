import React, { useEffect, useRef } from 'react';
import { TranscriptionItem } from '../types';

interface TranscriptProps {
  items: TranscriptionItem[];
}

const Transcript: React.FC<TranscriptProps> = ({ items }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
        <p className="text-sm">Awaiting audio input...</p>
        <p className="text-xs mt-2">Start the session and describe the machine issue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed shadow-sm
              ${item.sender === 'user' 
                ? 'bg-slate-800 border border-slate-700 text-slate-200' 
                : 'bg-orange-950/30 border border-orange-900/50 text-orange-100'
              }`}
          >
            <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-mono uppercase tracking-wider">
              <span>{item.sender === 'user' ? 'Operator' : 'AI Unit'}</span>
              <span>•</span>
              <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            {item.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default Transcript;
