import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export function Badge({
  children,
  color = '#6366f1',
  variant = 'subtle',
  size = 'sm',
  onRemove,
}: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: color,
          color: 'white',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: `1px solid ${color}`,
          color: color,
        };
      case 'subtle':
      default:
        return {
          backgroundColor: `${color}20`,
          color: color,
        };
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${sizeStyles[size]}
      `}
      style={getVariantStyles()}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'outline' | 'draft' | 'revision' | 'final' | 'custom' | string;
  customLabel?: string;
  customColor?: string;
}

export function StatusBadge({ status, customLabel, customColor }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    outline: { label: 'Outline', color: '#6366f1' },
    draft: { label: 'Draft', color: '#f59e0b' },
    revision: { label: 'Revision', color: '#8b5cf6' },
    final: { label: 'Final', color: '#22c55e' },
    custom: { label: customLabel || 'Custom', color: customColor || '#6b7280' },
  };

  const config = statusConfig[status] || statusConfig.custom;

  return (
    <Badge color={config.color} variant="subtle" size="sm">
      {config.label}
    </Badge>
  );
}
