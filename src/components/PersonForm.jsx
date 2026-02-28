import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Trash2, AlertTriangle, Search } from 'lucide-react';
import { useFamily } from '../store/familyStore';
import { v4 as uuidv4 } from 'uuid';

export default function PersonForm({ person, onClose }) {
    const { people, addPerson, updatePerson, deletePerson } = useFamily();
    const isEdit = Boolean(person);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Controlled state for multi-select relationships
    const [selectedParents, setSelectedParents] = useState(
        isEdit ? (person.parentIds || []) : []
    );
    const [selectedSpouses, setSelectedSpouses] = useState(
        isEdit ? (person.spouseIds || []) : []
    );
    const [relSearch, setRelSearch] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: isEdit
            ? {
                firstName: person.firstName,
                middleName: person.middleName || '',
                lastName: person.lastName,
                nickname: person.nickname || '',
                gender: person.gender,
                birthYear: person.birthYear || '',
                deathYear: person.deathYear || '',
                notes: person.notes || '',
                photoUrl: person.photoUrl || '',
            }
            : {
                firstName: '',
                middleName: '',
                lastName: '',
                nickname: '',
                gender: 'male',
                birthYear: '',
                deathYear: '',
                notes: '',
                photoUrl: '',
            },
    });

    const onSubmit = (data) => {
        const parsed = {
            ...data,
            id: isEdit ? person.id : uuidv4(),
            birthYear: data.birthYear ? parseInt(data.birthYear) : null,
            deathYear: data.deathYear ? parseInt(data.deathYear) : null,
            parentIds: selectedParents,
            spouseIds: selectedSpouses,
        };
        if (isEdit) {
            updatePerson(parsed);
        } else {
            addPerson(parsed);
        }
        onClose();
    };

    const handleDelete = () => {
        deletePerson(person.id);
        onClose();
    };

    const backdropRef = useRef();

    const otherPeople = people
        .filter((p) => !isEdit || p.id !== person.id)
        .filter((p) => {
            if (!relSearch.trim()) return true;
            const full = `${p.firstName} ${p.lastName}`.toLowerCase();
            return full.includes(relSearch.toLowerCase());
        });

    const toggleId = (id, list, setList, max) => {
        if (list.includes(id)) {
            setList(list.filter((x) => x !== id));
        } else {
            if (max && list.length >= max) return;
            setList([...list, id]);
        }
    };

    const PersonPickerSection = ({ label, ids, setIds, max }) => (
        <div className="form-group">
            <label>
                {label}{' '}
                {max && <span className="form-hint">(max {max})</span>}
            </label>
            <div className="rel-search-wrap">
                <Search size={13} className="rel-search-icon" />
                <input
                    type="text"
                    className="rel-search-input"
                    placeholder="Search people…"
                    value={relSearch}
                    onChange={(e) => setRelSearch(e.target.value)}
                />
            </div>
            <div className="person-picker">
                {otherPeople.length === 0 && (
                    <div className="person-pick-empty">No matches</div>
                )}
                {otherPeople.map((p) => {
                    const checked = ids.includes(p.id);
                    return (
                        <label key={p.id} className={`person-pick-item ${checked ? 'selected' : ''}`}>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleId(p.id, ids, setIds, max)}
                            />
                            {p.firstName} {p.lastName}
                            {p.nickname && p.nickname !== 'You' && (
                                <span className="pick-nick"> ({p.nickname})</span>
                            )}
                        </label>
                    );
                })}
            </div>
            {ids.length > 0 && (
                <div className="selected-ids">
                    {ids.map((id) => {
                        const p = people.find((x) => x.id === id);
                        return p ? (
                            <span key={id} className="selected-tag">
                                {p.firstName} {p.lastName}
                                <button type="button" onClick={() => toggleId(id, ids, setIds)}>×</button>
                            </span>
                        ) : null;
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div
            className="modal-backdrop"
            ref={backdropRef}
            onClick={(e) => e.target === backdropRef.current && onClose()}
        >
            <div className="modal person-form-modal">
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Person' : 'Add New Family Member'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="person-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input {...register('firstName', { required: 'Required' })} placeholder="First name" />
                            {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Middle Name</label>
                            <input {...register('middleName')} placeholder="Middle name" />
                        </div>
                        <div className="form-group">
                            <label>Last Name *</label>
                            <input {...register('lastName', { required: 'Required' })} placeholder="Last name" />
                            {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nickname / Known As</label>
                            <input {...register('nickname')} placeholder="e.g. Achan, Ammachi" />
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <select {...register('gender')}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>


                    <div className="form-row">
                        <div className="form-group">
                            <label>Birth Year</label>
                            <input type="number" {...register('birthYear')} placeholder="e.g. 1952" min="1800" max="2030" />
                        </div>
                        <div className="form-group">
                            <label>Death Year <span className="form-hint">(blank if alive)</span></label>
                            <input type="number" {...register('deathYear')} placeholder="e.g. 2005" min="1800" max="2030" />
                        </div>
                    </div>



                    <PersonPickerSection
                        label="Parents"
                        ids={selectedParents}
                        setIds={setSelectedParents}
                        max={2}
                    />
                    <PersonPickerSection
                        label="Spouse(s)"
                        ids={selectedSpouses}
                        setIds={setSelectedSpouses}
                    />

                    <div className="form-group">
                        <label>Photo URL <span className="form-hint">(optional)</span></label>
                        <input {...register('photoUrl')} placeholder="https://..." />
                    </div>

                    <div className="form-group">
                        <label>Notes / Stories</label>
                        <textarea {...register('notes')} rows={3} placeholder="Any interesting facts, stories, or details..." />
                    </div>

                    <div className="form-actions">
                        <div>
                            {isEdit && (
                                showDeleteConfirm ? (
                                    <div className="delete-confirm">
                                        <AlertTriangle size={16} />
                                        <span>Are you sure?</span>
                                        <button type="button" className="btn-danger-sm" onClick={handleDelete}>Yes, Delete</button>
                                        <button type="button" className="btn-ghost-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                    </div>
                                ) : (
                                    <button type="button" className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                )
                            )}
                        </div>
                        <div className="form-actions-right">
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <Save size={16} /> {isEdit ? 'Save Changes' : 'Add Person'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
