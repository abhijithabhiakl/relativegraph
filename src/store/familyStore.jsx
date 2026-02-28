import { createContext, useContext, useReducer, useState } from 'react';
import { initialFamilyData } from '../data/familyData';
import { exampleFamilyData } from '../data/exampleFamilyData';

const STORAGE_KEY = 'relationtree_family_data';

// ─── Initializer ──────────────────────────────────────────────────────────────
const loadFromStorage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (_) { }
    return initialFamilyData;
};

// ─── Save Helper ──────────────────────────────────────────────────────────────
const saveToStorage = (state) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { }
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
    let newState;
    switch (action.type) {
        case 'ADD_PERSON':
            newState = { ...state, people: [...state.people, action.person] };
            break;
        case 'UPDATE_PERSON':
            newState = {
                ...state,
                people: state.people.map((p) =>
                    p.id === action.person.id ? action.person : p
                ),
            };
            break;
        case 'DELETE_PERSON': {
            const idToRemove = action.id;
            newState = {
                ...state,
                people: state.people
                    .filter((p) => p.id !== idToRemove)
                    .map((p) => ({
                        ...p,
                        parentIds: p.parentIds.filter((id) => id !== idToRemove),
                        spouseIds: p.spouseIds.filter((id) => id !== idToRemove),
                    })),
            };
            break;
        }
        case 'IMPORT_DATA':
            newState = action.data;
            break;
        case 'RESET_TO_SEED':
            newState = initialFamilyData;
            break;
        default:
            return state;
    }
    saveToStorage(newState);
    return newState;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, null, loadFromStorage);
    const [isExampleMode, setIsExampleMode] = useState(false);

    const activePeople = isExampleMode ? exampleFamilyData.people : state.people;

    // Helpers
    const toggleExampleMode = () => setIsExampleMode((prev) => !prev);

    // Only allow mutations if NOT in example mode
    const addPerson = (person) => { if (!isExampleMode) dispatch({ type: 'ADD_PERSON', person }) };
    const updatePerson = (person) => { if (!isExampleMode) dispatch({ type: 'UPDATE_PERSON', person }) };
    const deletePerson = (id) => { if (!isExampleMode) dispatch({ type: 'DELETE_PERSON', id }) };

    const exportJSON = () => {
        // Always export the real saved state, not the example mock
        const blob = new Blob([JSON.stringify(state, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-tree-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                dispatch({ type: 'IMPORT_DATA', data });
                if (isExampleMode) setIsExampleMode(false); // turn off example mode if importing
            } catch (_) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const getPersonById = (id) => activePeople.find((p) => p.id === id);

    return (
        <FamilyContext.Provider
            value={{
                people: activePeople,
                isExampleMode,
                toggleExampleMode,
                addPerson,
                updatePerson,
                deletePerson,
                exportJSON,
                importJSON,
                getPersonById
            }}
        >
            {children}
        </FamilyContext.Provider>
    );
}

export const useFamily = () => {
    const ctx = useContext(FamilyContext);
    if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
    return ctx;
};
