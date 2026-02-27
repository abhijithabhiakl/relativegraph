import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
    return (
        <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
                type="text"
                placeholder="Search family members…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {value && (
                <button className="search-clear" onClick={() => onChange('')}>
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
