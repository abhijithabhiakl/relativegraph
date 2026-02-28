import { useState } from 'react';
import { Lock, LogOut, UserPlus, Download, Upload, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFamily } from '../store/familyStore';
import { exampleFamilyData } from '../data/exampleFamilyData';
import LoginModal from './LoginModal';
import PersonForm from './PersonForm';

export default function EditFAB({ selectedId, isMobilePanelOpen }) {
    const { isAdmin, logout } = useAuth();
    const { getPersonById, deletePerson, exportJSON, importJSON, isExampleMode, toggleExampleMode } = useFamily();
    const [showLogin, setShowLogin] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editPerson, setEditPerson] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const selectedPerson = selectedId ? getPersonById(selectedId) : null;

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) importJSON(file);
        };
        input.click();
    };

    const handleDeleteConfirmed = () => {
        if (selectedPerson) {
            deletePerson(selectedPerson.id);
            setShowDeleteConfirm(false);
        }
    };

    if (!isAdmin) {
        return (
            <>
                <button
                    className="fab fab-lock"
                    title="Admin Login"
                    onClick={() => setShowLogin(true)}
                >
                    <Lock size={22} />
                </button>
                {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            </>
        );
    }

    return (
        <>
            <div className={`fab-toolbar ${isMobilePanelOpen ? 'mobile-hidden' : ''}`}>
                <span className="fab-admin-tag">
                    {isExampleMode ? '✓ Reference Mode' : '✓ Admin'}
                </span>
                {/* Person-specific actions — shown when a node is selected */}
                {selectedPerson && !isExampleMode && (
                    <>
                        <div className="fab-toolbar-divider" />
                        <button
                            className="fab-tool-btn accent"
                            title={`Edit ${selectedPerson.firstName}`}
                            onClick={() => setEditPerson(selectedPerson)}
                        >
                            <Edit2 size={16} />
                            <span>Edit {selectedPerson.firstName}</span>
                        </button>

                        {showDeleteConfirm ? (
                            <div className="fab-delete-confirm">
                                <AlertTriangle size={14} />
                                <span>Delete {selectedPerson.firstName}?</span>
                                <button
                                    type="button"
                                    className="btn-danger-sm"
                                    onClick={handleDeleteConfirmed}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    className="btn-ghost-sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                className="fab-tool-btn danger"
                                title={`Delete ${selectedPerson.firstName}`}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 size={16} />
                                <span>Delete</span>
                            </button>
                        )}
                        <div className="fab-toolbar-divider" />
                    </>
                )}

                {/* Global admin actions */}
                {!isExampleMode && (
                    <button
                        className="fab-tool-btn"
                        title="Add Family Member"
                        onClick={() => setShowAddForm(true)}
                    >
                        <UserPlus size={18} />
                        <span>Add</span>
                    </button>
                )}
                <button
                    className="fab-tool-btn"
                    title={isExampleMode ? "Exit Example Tree" : "Show Example Tree"}
                    onClick={toggleExampleMode}
                    style={{
                        color: isExampleMode ? '#f59e0b' : '#06b6d4',
                        borderColor: isExampleMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.3)'
                    }}
                >
                    <span>{isExampleMode ? "Exit Example" : "Show Example"}</span>
                </button>
                <button className="fab-tool-btn" title="Export JSON" onClick={exportJSON}>
                    <Download size={18} />
                    <span>Export</span>
                </button>
                <button className="fab-tool-btn" title="Import JSON" onClick={handleImport}>
                    <Upload size={18} />
                    <span>Import</span>
                </button>
                <button className="fab-tool-btn danger" title="Logout" onClick={logout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>

            {showAddForm && <PersonForm onClose={() => setShowAddForm(false)} />}
            {editPerson && <PersonForm person={editPerson} onClose={() => setEditPerson(null)} />}
        </>
    );
}
