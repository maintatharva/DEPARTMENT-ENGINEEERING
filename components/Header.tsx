import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-md flex items-center justify-center shadow-lg shadow-orange-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.033a17.355 17.355 0 011.88-5.225 1.65 1.65 0 00-1.555-2.755 17.355 17.355 0 01-5.258 1.88l-3.033 2.496m0 0l-5.877 5.877A2.652 2.652 0 005.75 21l5.877-5.877m-5.877 0V9a2.25 2.25 0 012.25-2.25h1.5m-1.5 0a2.25 2.25 0 012.25-2.25v-1.5m0 1.5A2.25 2.25 0 0013.5 7v1.5m0 0H15" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SandCast <span className="text-orange-500">Expert</span></h1>
            <p className="text-xs text-slate-400 font-mono">INDUSTRIAL MAINTENANCE AI v2.5</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-500 font-bold uppercase tracking-wider">System Online</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
