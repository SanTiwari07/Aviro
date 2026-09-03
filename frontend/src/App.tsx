import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Overview from './pages/Overview';
import Reconciliation from './pages/Reconciliation';
import Exceptions from './pages/Exceptions';
import Settlements from './pages/Settlements';
import Ask from './pages/Ask';
import Runs from './pages/Runs';
import Benchmark from './pages/Benchmark';

function App() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <Router>
      <div className="flex h-screen w-full bg-slate-100 overflow-hidden text-slate-800">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
                A
              </span>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-tight">ARIVO</h1>
                <p className="text-[10px] text-indigo-300 font-medium">AI Finance Controller</p>
              </div>
            </div>
            <div className="mt-3 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
              <span>Track 04 Buildathon</span>
              <span className="text-emerald-400 font-mono font-semibold">Ready</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Ledger & Ops
            </div>
            <NavLink to="/" className={navClass}>
              <span>📊</span>
              <span>Overview</span>
            </NavLink>
            <NavLink to="/reconciliation" className={navClass}>
              <span>⚖️</span>
              <span>Reconciliation</span>
            </NavLink>
            <NavLink to="/exceptions" className={navClass}>
              <span>🚨</span>
              <span>Exceptions</span>
            </NavLink>
            <NavLink to="/settlements" className={navClass}>
              <span>🏦</span>
              <span>Settlements</span>
            </NavLink>

            <div className="pt-3 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Intelligence & Audit
            </div>
            <NavLink to="/ask" className={navClass}>
              <span>💬</span>
              <span>Ask Arivo Copilot</span>
            </NavLink>
            <NavLink to="/runs" className={navClass}>
              <span>📜</span>
              <span>Runs History</span>
            </NavLink>
            <NavLink to="/benchmark" className={navClass}>
              <span>🛡️</span>
              <span>Benchmark & AI Safety</span>
            </NavLink>
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between items-center">
              <span>Razorpay Integration</span>
              <span className="text-blue-400 font-mono font-semibold">Test Mode</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>Engine Status</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
          <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shadow-2xs shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">AI Finance Controller Dashboard</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">Authoritative Control Gate</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                Deterministic Rules + Gemini
              </span>
            </div>
          </header>

          <div className="p-6 flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/exceptions" element={<Exceptions />} />
              <Route path="/settlements" element={<Settlements />} />
              <Route path="/ask" element={<Ask />} />
              <Route path="/runs" element={<Runs />} />
              <Route path="/benchmark" element={<Benchmark />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
