import { X, Users, GitBranch, Heart, Baby } from 'lucide-react';
import { useFamily } from '../store/familyStore';

export default function PersonPanel({ personId, onClose, onSelectPerson }) {
    const { people, getPersonById } = useFamily();
    const person = getPersonById(personId);

    if (!person) return null;

    const isDead = Boolean(person.deathYear);
    const age = (() => {
        if (!person.birthYear) return null;
        const endYear = person.deathYear || new Date().getFullYear();
        return endYear - person.birthYear;
    })();

    const parents = (person.parentIds || []).map(getPersonById).filter(Boolean);
    const spouses = (person.spouseIds || []).map(getPersonById).filter(Boolean);
    const children = people.filter((p) => (p.parentIds || []).includes(personId));
    const siblings = people.filter(
        (p) =>
            p.id !== personId &&
            (p.parentIds || []).some((pid) => (person.parentIds || []).includes(pid))
    );

    const RelList = ({ items, label, icon: Icon }) => {
        if (!items.length) return null;
        return (
            <div className="panel-rel-group">
                <div className="panel-rel-label">
                    <Icon size={14} />
                    <span>{label}</span>
                </div>
                <div className="panel-rel-list">
                    {items.map((p) => (
                        <button
                            key={p.id}
                            className="panel-rel-chip"
                            onClick={() => onSelectPerson(p.id)}
                        >
                            {p.firstName} {p.lastName}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="person-panel">
            <div className="panel-header">
                <button className="panel-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="panel-avatar-wrap">
                <div className="panel-avatar">
                    {person.photoUrl ? (
                        <img src={person.photoUrl} alt={person.firstName} />
                    ) : (
                        <span>
                            {(person.firstName || '?')[0]}{(person.lastName || '?')[0]}
                        </span>
                    )}
                    {isDead && <div className="panel-avatar-cross">✝</div>}
                </div>
            </div>

            <div className="panel-name">
                {person.nickname === 'You' ? '⭐ ' : ''}
                {person.firstName} {person.lastName}
                {person.nickname && person.nickname !== 'You' && (
                    <span className="panel-nickname">"{person.nickname}"</span>
                )}
            </div>

            <div className="panel-meta">
                <span className="meta-pill">
                    {person.gender === 'male' ? '♂' : person.gender === 'female' ? '♀' : '⚧'}{' '}
                    {person.gender}
                </span>
                {person.birthYear && (
                    <span className="meta-pill">
                        {isDead
                            ? `${person.birthYear} – ${person.deathYear}`
                            : `Born ${person.birthYear}`}
                    </span>
                )}
                {age !== null && (
                    <span className="meta-pill">{isDead ? `Lived ${age} yrs` : `Age ${age}`}</span>
                )}
                {isDead && <span className="meta-pill deceased-pill">Deceased</span>}
            </div>

            <div className="panel-relations">
                <RelList items={parents} label="Parents" icon={Users} />
                <RelList items={spouses} label="Spouse(s)" icon={Heart} />
                <RelList items={children} label="Children" icon={Baby} />
                <RelList items={siblings} label="Siblings" icon={GitBranch} />
            </div>

            {person.notes && (
                <div className="panel-notes">
                    <div className="panel-notes-label">Notes</div>
                    <p>{person.notes}</p>
                </div>
            )}
        </div>
    );
}
