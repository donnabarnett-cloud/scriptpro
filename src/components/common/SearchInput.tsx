import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import debounce from '@/utils/debounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  debounceMs = 300,
  autoFocus = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const debouncedOnChange = useCallback(
    debounce((val: string) => onChange(val), debounceMs),
    [onChange, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="
          w-full pl-9 pr-8 py-2 text-sm rounded-lg
          bg-[var(--bg-tertiary)] border border-[var(--border-color)]
          text-[var(--text-primary)] placeholder-[var(--text-muted)]
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        "
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
