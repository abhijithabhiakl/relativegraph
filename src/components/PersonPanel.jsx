import { useRef } from 'react';
import { ArrowLeft, X, Users, GitBranch, Heart, Baby, ChevronUp } from 'lucide-react';
import { useFamily } from '../store/familyStore';

export default function PersonPanel({
    personId,
    panelState,
    onClose,
    onReturn,
    onExpand,
    onSelectPerson,
}) {
    const { people, getPersonById } = useFamily();
    const person = getPersonById(personId);
    const touchStartY = useRef(null);
    const isPeek = panelState === 'peek';

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
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectPerson(p.id);
                            }}
                        >
                            {p.firstName} {p.lastName}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // ── Touch swipe detection ──────────────────────────────────────────────
    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (touchStartY.current === null) return;
        const delta = touchStartY.current - e.changedTouches[0].clientY;
        // Swipe up ≥ 30px AND in peek mode → expand
        if (delta >= 30 && isPeek) {
            e.stopPropagation();
            onExpand();
        }
        touchStartY.current = null;
    };

    const personDisplayName = `${person.nickname === 'You' ? '⭐ ' : ''}${person.firstName} ${person.lastName}`;

    return (
        <div
            className={`person-panel ${isPeek ? 'panel-peek' : 'panel-full'}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            // Tap anywhere on the peek strip to expand
            onClick={isPeek ? onExpand : undefined}
            aria-expanded={!isPeek}
        >
            {/* Drag handle - always visible on mobile, indicates the panel is draggable */}
            <div className="panel-drag-handle" aria-hidden="true" />

            {/* ── Peek bar - only visible in peek mode ───────────────────── */}
            <div className="panel-peek-bar" aria-hidden={!isPeek}>
                <span className="panel-peek-name">{personDisplayName}</span>
                {/* Swipe hint - pulsing, non-blocking, disappears once expanded */}
                <div className="panel-swipe-hint">
                    <ChevronUp size={14} strokeWidth={2.5} />
                    <span>Swipe up for details</span>
                </div>
            </div>

            {/* ── Full content - clipped in peek, fully visible when full ── */}
            <div className="panel-full-content">
                <div className="panel-header">
                    {/* Back button - returns to graph (deselects node) */}
                    <button
                        className="panel-back-btn"
                        onClick={(e) => { e.stopPropagation(); onReturn(); }}
                        aria-label="Back to graph"
                    >
                        <ArrowLeft size={17} />
                        <span>Back</span>
                    </button>

                    {/* Close button - hides panel, keeps node selected */}
                    <button
                        className="panel-close"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        aria-label="Close panel"
                    >
                        <X size={18} />
                    </button>
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

            {/* Safe-area spacer for iPhone home bar */}
            <div className="panel-safe-area-bottom" />
        </div>
    );
}
