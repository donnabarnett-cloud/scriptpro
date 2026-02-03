import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1 min-w-[180px]
            bg-[var(--bg-secondary)] border border-[var(--border-color)]
            rounded-lg shadow-lg py-1
            animate-fade-in
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
                onClick: () => {
                  if ((child.props as { onClick?: () => void }).onClick) {
                    (child.props as { onClick?: () => void }).onClick?.();
                  }
                  setIsOpen(false);
                },
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export function DropdownItem({ onClick, children, icon, danger = false, disabled = false }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-sm text-left
        ${danger ? 'text-red-500 hover:bg-red-500/10' : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors
      `}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-[var(--border-color)]" />;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  placeholder?: string;
  className?: string;
}

export function SelectDropdown({ value, onChange, options, placeholder = 'Select...', className = '' }: SelectDropdownProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Dropdown
      className={className}
      trigger={
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
          <span className="text-sm">
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.icon}
                {selected.label}
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
      }
    >
      {options.map((option) => (
        <DropdownItem
          key={option.value}
          onClick={() => onChange(option.value)}
          icon={option.icon}
        >
          {option.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
