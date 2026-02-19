import React, { useState } from 'react';
import Header from './components/Header';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import { useLiveSession } from './hooks/useLiveSession';
import { ConnectionState } from './types';

const App: React.FC = () => {
  const { connect, disconnect, connectionState, transcripts, volume, error } = useLiveSession();
  
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  const handleToggleConnection = () => {
    if (isConnected || isConnecting) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-orange-500/30">
      <Header />
      
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 gap-6">
        
        {/* Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full ${
               isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
               isConnecting ? 'bg-yellow-500 animate-ping' : 
               'bg-red-500'
             }`} />
             <div>
               <p className="text-sm font-semibold text-slate-200">
                 {isConnected ? 'LIVE CONNECTION ACTIVE' : 
                  isConnecting ? 'ESTABLISHING LINK...' : 
                  'DISCONNECTED'}
               </p>
               <p className="text-xs text-slate-500 font-mono">
                 {isConnected ? 'Latency: <50ms' : 'Standby Mode'}
               </p>
             </div>
          </div>

          <button
            onClick={handleToggleConnection}
            disabled={isConnecting}
            className={`
              px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg flex items-center gap-2
              ${isConnected 
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
                : 'bg-orange-600 text-white hover:bg-orange-500 hover:shadow-orange-600/20'
              }
              ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isConnected ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
                Terminate Session
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Initiate Diagnostic
              </>
            )}
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5 text-red-500">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-sm">Connection Error</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
          
          {/* Left Panel: Visualization & Controls */}
          <div className="lg:col-span-2 flex flex-col gap-6">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
               {/* Decorative background grid */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
               
               <div className="relative z-10 flex flex-col gap-4">
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest">Audio Stream Processor</h3>
                   <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono">
                     {volume > 0.05 ? 'RX/TX BUSY' : 'IDLE'}
                   </span>
                 </div>
                 
                 <Visualizer volume={volume} state={connectionState} />
                 
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                     <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Focus Area</span>
                     <span className="text-orange-400 text-sm font-mono">HYDRAULICS / PNEUMATICS</span>
                   </div>
                   <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Model</span>
                      <span className="text-slate-300 text-sm font-mono">Gemini 2.5 Flash Audio</span>
                   </div>
                 </div>
               </div>
             </div>

             {/* Quick Actions (Fake) */}
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {['Emergency Stop', 'Reset Cycle', 'Pressure Check', 'Pattern Align'].map(action => (
                 <button key={action} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 py-3 px-2 rounded-lg text-xs font-semibold transition-colors">
                   {action}
                 </button>
               ))}
             </div>
          </div>

          {/* Right Panel: Transcript */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden h-[600px] lg:h-auto">
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z" clipRule="evenodd" />
                </svg>
                Operation Log
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-950/30">
              <Transcript items={transcripts} />
            </div>
          </div>
          
        </div>
      </main>
      
      <footer className="py-4 text-center text-slate-600 text-xs border-t border-slate-900">
        <p>SandCast Diagnostics Tool • Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
