import { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { initialFamilyData } from '../data/familyData';
import { exampleFamilyData } from '../data/exampleFamilyData';
import { useAuth } from '../auth/AuthContext';

// ─── Save Helper ──────────────────────────────────────────────────────────────
const saveToServer = (state, token) => {
    if (!token) return; // Only save if we have a token
    fetch('/api/tree', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(state)
    }).catch(err => console.error('Failed to save', err));
};

// ─── Shared Logic ─────────────────────────────────────────────────────────────
const normalizeName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const normalizePersonNames = (person) => ({
    ...person,
    firstName: normalizeName(person.firstName),
    middleName: normalizeName(person.middleName),
    lastName: normalizeName(person.lastName),
});

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
    let newState;
    switch (action.type) {
        case 'INIT_DATA':
            return action.data; // Don't trigger save
        case 'ADD_PERSON':
            newState = { ...state, people: [...state.people, normalizePersonNames(action.person)] };
            break;
        case 'UPDATE_PERSON':
            newState = {
                ...state,
                people: state.people.map((p) =>
                    p.id === action.person.id ? normalizePersonNames(action.person) : p
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

    // Fire-and-forget save
    saveToServer(newState, action.token);
    return newState;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, null);
    const [isExampleMode, setIsExampleMode] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetch('/api/tree')
            .then(res => res.json())
            .then(data => {
                dispatch({ type: 'INIT_DATA', data: data || initialFamilyData });
            })
            .catch(() => {
                dispatch({ type: 'INIT_DATA', data: initialFamilyData });
            });
    }, []);

    const activePeople = isExampleMode ? exampleFamilyData.people : (state?.people || []);

    // Helpers
    const toggleExampleMode = () => setIsExampleMode((prev) => !prev);

    // Only allow mutations if NOT in example mode
    const addPerson = (person) => { if (!isExampleMode) dispatch({ type: 'ADD_PERSON', person, token }) };
    const updatePerson = (person) => { if (!isExampleMode) dispatch({ type: 'UPDATE_PERSON', person, token }) };
    const deletePerson = (id) => { if (!isExampleMode) dispatch({ type: 'DELETE_PERSON', id, token }) };

    const exportJSON = () => {
        if (!state) return;
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
                dispatch({ type: 'IMPORT_DATA', data, token });
                if (isExampleMode) setIsExampleMode(false);
            } catch (_) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const getPersonById = (id) => activePeople.find((p) => p.id === id);

    if (!state) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-color, #e2e8f0)' }}>Loading family tree...</div>;
    }

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
