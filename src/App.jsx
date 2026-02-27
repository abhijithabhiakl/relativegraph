import { useCallback, useState } from 'react';
import { FamilyProvider } from './store/familyStore';
import { AuthProvider } from './auth/AuthContext';
import FamilyTree from './components/FamilyTree';
import PersonPanel from './components/PersonPanel';
import SearchBar from './components/SearchBar';
import EditFAB from './components/EditFAB';
import { Sun, Moon, TreePine } from 'lucide-react';

function LegendItem({ color, label }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function AppContent() {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const handleSelectPerson = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className={`app-root ${darkMode ? 'dark' : 'light'}`}>
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-brand">
          <TreePine size={22} className="brand-icon" />
          <span className="brand-title">RelationTree</span>
          <span className="brand-subtitle">Family Tree</span>
        </div>
        <div className="top-bar-center">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="top-bar-right">
          <button
            className="theme-toggle"
            title="Toggle theme"
            onClick={() => setDarkMode((d) => !d)}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Canvas */}
      <main className="canvas-wrap">
        <FamilyTree
          searchQuery={searchQuery}
          selectedId={selectedId}
          onSelectPerson={handleSelectPerson}
        />
      </main>

      {/* Legend */}
      <div className="legend">
        <div className="legend-title">Generations</div>
        <LegendItem color="#8b5cf6" label="1st (oldest)" />
        <LegendItem color="#3b82f6" label="2nd" />
        <LegendItem color="#10b981" label="3rd" />
        <LegendItem color="#eab308" label="4th" />
        <LegendItem color="#ec4899" label="5th+" />
        <div className="legend-divider" />
        <LegendItem color="#555" label="── Parent–child" />
        <LegendItem color="#a78bfa" label="♥ ─ ─ Spouses" />
      </div>

      {/* Side Panel */}
      {selectedId && (
        <PersonPanel
          personId={selectedId}
          onClose={() => setSelectedId(null)}
          onSelectPerson={(id) => setSelectedId(id)}
        />
      )}

      {/* FAB — passes selectedId so admin toolbar can show Edit/Delete for chosen person */}
      <div className="fab-wrap">
        <EditFAB selectedId={selectedId} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <AppContent />
      </FamilyProvider>
    </AuthProvider>
  );
}
