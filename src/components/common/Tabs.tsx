import React from 'react';

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className = '' }: TabsProps) {
  return (
    <div className={`flex border-b border-[var(--border-color)] ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<TabProps>(child)) {
          return React.cloneElement(child, {
            isActive: child.props.value === value,
            onClick: () => onChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  count?: number;
}

export function Tab({
  label,
  icon,
  isActive = false,
  onClick,
  disabled = false,
  count,
}: TabProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2.5 text-sm font-medium
        border-b-2 -mb-px transition-colors
        ${
          isActive
            ? 'border-indigo-500 text-indigo-500'
            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span
          className={`
            px-1.5 py-0.5 text-xs rounded-full
            ${isActive ? 'bg-indigo-500/20 text-indigo-500' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}
          `}
        >
          {count}
        </span>
      )}
    </button>
  );
}
