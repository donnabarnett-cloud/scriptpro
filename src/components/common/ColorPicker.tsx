import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  showCustom?: boolean;
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#6b7280', '#374151', '#1f2937',
];

export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  showCustom = true,
}: ColorPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              transition-transform hover:scale-110
              ${value === color ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-white' : ''}
            `}
            style={{ backgroundColor: color }}
          >
            {value === color && <Check className="w-4 h-4 text-white" />}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="flex items-center gap-2">
          {showCustomInput ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-2 py-1 text-sm rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Custom color...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
