import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Overview from './pages/Overview';
import Reconciliation from './pages/Reconciliation';
import Ask from './pages/Ask';
import Exceptions from './pages/Exceptions';
import Settlements from './pages/Settlements';

function App() {
  return (
    <Router>
      <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-accent text-white flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight">ARIVO</h1>
            <p className="text-xs text-blue-200 mt-1">AI Finance Controller</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link to="/" className="block px-4 py-2 rounded text-sm hover:bg-brand">Overview</Link>
            <Link to="/reconciliation" className="block px-4 py-2 rounded text-sm hover:bg-brand">Reconciliation</Link>
            <Link to="/exceptions" className="block px-4 py-2 rounded text-sm hover:bg-brand">Exceptions</Link>
            <Link to="/settlements" className="block px-4 py-2 rounded text-sm hover:bg-brand">Settlements</Link>
            <Link to="/ask" className="block px-4 py-2 rounded text-sm hover:bg-brand">Ask Arivo</Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          <header className="h-16 border-b border-border bg-white flex items-center px-8 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          </header>
          
          <div className="p-8 flex-1">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/exceptions" element={<Exceptions />} />
              <Route path="/settlements" element={<Settlements />} />
              <Route path="/ask" element={<Ask />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
