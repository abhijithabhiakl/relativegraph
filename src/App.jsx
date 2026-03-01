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
  // null = no panel, 'peek' = partial bottom-sheet, 'full' = fully expanded
  const [panelState, setPanelState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const handleSelectPerson = useCallback((id) => {
    if (id === null) {
      setSelectedId(null);
      setPanelState(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev === id) {
        // Tapping the same selected node again → dismiss panel
        setPanelState(null);
        return null;
      }
      // Desktop: open fully; mobile: start in peek mode
      setPanelState(window.innerWidth > 640 ? 'full' : 'peek');
      return id;
    });
  }, []);

  // "Back to Graph" - deselects node + closes panel entirely
  const handleReturn = useCallback(() => {
    setSelectedId(null);
    setPanelState(null);
  }, []);

  // Expand peek → full when user swipes up or taps the peek strip
  const handleExpand = useCallback(() => {
    setPanelState('full');
  }, []);

  const showPanel = panelState !== null;

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
        <LegendItem color="#e4094b" label="♥ ─ ─ Spouses" />
      </div>

      {/* Side Panel / Mobile Bottom Sheet */}
      {selectedId && showPanel && (
        <PersonPanel
          personId={selectedId}
          panelState={panelState}
          onClose={() => setPanelState(null)}
          onReturn={handleReturn}
          onExpand={handleExpand}
          onSelectPerson={handleSelectPerson}
        />
      )}

      {/* FAB - hide when panel is visible on mobile */}
      <div className="fab-wrap">
        <EditFAB selectedId={selectedId} isMobilePanelOpen={showPanel} />
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
