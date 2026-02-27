import { memo } from 'react';
import { Handle, Position } from 'reactflow';

// ─── Generation palette — neutral, beautiful, no personal bias ────────────────
// Cycles every 7 generations if the tree goes very deep
const GEN_PALETTE = [
    { bg: '#1a0e2e', border: '#7c3aed', text: '#c4b5fd', dot: '#8b5cf6' }, // Gen 0 — deep violet
    { bg: '#0e1a2e', border: '#2563eb', text: '#93c5fd', dot: '#3b82f6' }, // Gen 1 — royal blue
    { bg: '#0e2a1a', border: '#059669', text: '#6ee7b7', dot: '#10b981' }, // Gen 2 — emerald
    { bg: '#1a1a0e', border: '#ca8a04', text: '#fde68a', dot: '#eab308' }, // Gen 3 — gold
    { bg: '#2a0e1a', border: '#db2777', text: '#f9a8d4', dot: '#ec4899' }, // Gen 4 — rose
    { bg: '#0e2a2a', border: '#0e7490', text: '#67e8f9', dot: '#06b6d4' }, // Gen 5 — cyan
    { bg: '#2a1a0e', border: '#c2410c', text: '#fed7aa', dot: '#f97316' }, // Gen 6 — orange
];

function getInitials(firstName, lastName) {
    return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

function PersonNode({ data }) {
    const { person, onSelect, isSelected, isHighlighted, isSearching, generation } = data;
    const colors = GEN_PALETTE[(generation || 0) % GEN_PALETTE.length];
    const isDead = Boolean(person.deathYear);
    const isYou = person.nickname === 'You';

    const opacity = isSearching && !isHighlighted ? 0.2 : 1;

    const years = (() => {
        if (!person.birthYear) return '';
        if (isDead) return `${person.birthYear} – ${person.deathYear}`;
        return `b. ${person.birthYear}`;
    })();

    return (
        <div
            className={`person-node ${isSelected ? 'selected' : ''} ${isDead ? 'deceased' : ''} ${isYou ? 'is-you' : ''}`}
            style={{
                borderColor: isSelected ? '#fff' : colors.border,
                background: `linear-gradient(145deg, ${colors.bg}, rgba(0,0,0,0.55))`,
                opacity,
                '--dot-color': colors.dot,
                boxShadow: isSelected
                    ? `0 0 0 2px #fff, 0 0 20px ${colors.dot}55`
                    : isYou
                        ? `0 0 0 2px ${colors.border}, 0 0 16px ${colors.dot}44`
                        : undefined,
            }}
            onClick={() => onSelect(person.id)}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

            <div className="person-node-avatar" style={{ background: colors.border }}>
                {person.photoUrl ? (
                    <img src={person.photoUrl} alt={person.firstName} />
                ) : (
                    <span>{getInitials(person.firstName, person.lastName)}</span>
                )}
                {isDead && <div className="deceased-overlay">✝</div>}
            </div>

            <div className="person-node-info">
                <div className="person-node-name">
                    {isYou ? '⭐ ' : ''}{person.firstName}
                    {person.nickname && person.nickname !== 'You' ? ` "${person.nickname}"` : ''}
                </div>
                <div className="person-node-lastname" style={{ color: colors.text }}>
                    {person.lastName}
                </div>
                {years && <div className="person-node-years">{years}</div>}
            </div>

            <div className="person-node-side-dot" style={{ background: colors.dot }} />

            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
}

export default memo(PersonNode);
