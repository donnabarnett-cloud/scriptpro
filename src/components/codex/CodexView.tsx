import React, { useState, useMemo } from 'react';
import {
  Users,
  MapPin,
  Package,
  BookOpen,
  GitBranch,
  MoreHorizontal,
  Plus,
  Search,
  Grid3X3,
  List,
  Filter,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Tabs, Tab } from '@/components/common/Tabs';
import { CodexEntryDetail } from './CodexEntryDetail';
import { CodexEntryModal } from './CodexEntryModal';
import type { CodexEntry, CodexEntryType } from '@/types';

const ENTRY_TYPE_CONFIG: Record<CodexEntryType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  character: { label: 'Characters', icon: Users, color: '#6366f1' },
  location: { label: 'Locations', icon: MapPin, color: '#22c55e' },
  object: { label: 'Objects', icon: Package, color: '#f59e0b' },
  lore: { label: 'Lore', icon: BookOpen, color: '#8b5cf6' },
  subplot: { label: 'Subplots', icon: GitBranch, color: '#ec4899' },
  other: { label: 'Other', icon: MoreHorizontal, color: '#6b7280' },
};

export function CodexView() {
  const {
    currentNovelId,
    codexEntries,
    codexCategories,
    codexFilter,
    setCodexFilter,
    currentCodexEntryId,
    selectCodexEntry,
    createCodexEntry,
  } = useStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<CodexEntryType>('character');

  const filteredEntries = useMemo(() => {
    return codexEntries.filter((entry) => {
      if (codexFilter.type !== 'all' && entry.type !== codexFilter.type) {
        return false;
      }
      if (codexFilter.category && entry.categoryId !== codexFilter.category) {
        return false;
      }
      if (codexFilter.tags.length > 0 && !codexFilter.tags.some((tag) => entry.tags.includes(tag))) {
        return false;
      }
      if (codexFilter.search) {
        const searchLower = codexFilter.search.toLowerCase();
        return (
          entry.name.toLowerCase().includes(searchLower) ||
          entry.aliases.some((a) => a.toLowerCase().includes(searchLower)) ||
          entry.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [codexEntries, codexFilter]);

  const entriesByType = useMemo(() => {
    const grouped: Record<CodexEntryType, CodexEntry[]> = {
      character: [],
      location: [],
      object: [],
      lore: [],
      subplot: [],
      other: [],
    };
    filteredEntries.forEach((entry) => {
      grouped[entry.type].push(entry);
    });
    return grouped;
  }, [filteredEntries]);

  const currentEntry = codexEntries.find((e) => e.id === currentCodexEntryId);

  const handleCreateEntry = (type: CodexEntryType) => {
    setCreateType(type);
    setShowCreateModal(true);
  };

  if (!currentNovelId) {
    return (
      <EmptyState
        icon={<BookOpen className="w-6 h-6" />}
        title="No novel selected"
        description="Create or select a novel to access the Codex"
      />
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Codex</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {codexEntries.length} entries
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <SearchInput
            value={codexFilter.search}
            onChange={(value) => setCodexFilter({ search: value })}
            placeholder="Search entries..."
          />
        </div>

        {/* Type Filters */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => setCodexFilter({ type: 'all' })}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                codexFilter.type === 'all'
                  ? 'bg-indigo-500/10 text-indigo-500'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="flex-1 text-left">All Entries</span>
              <span className="text-xs">{codexEntries.length}</span>
            </button>

            {(Object.keys(ENTRY_TYPE_CONFIG) as CodexEntryType[]).map((type) => {
              const config = ENTRY_TYPE_CONFIG[type];
              const count = entriesByType[type].length;

              return (
                <button
                  key={type}
                  onClick={() => setCodexFilter({ type })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    codexFilter.type === type
                      ? 'bg-indigo-500/10 text-indigo-500'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span style={{ color: config.color }}><config.icon className="w-4 h-4" /></span>
                  <span className="flex-1 text-left">{config.label}</span>
                  <span className="text-xs">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Categories */}
          {codexCategories.length > 0 && (
            <div className="p-2 border-t border-[var(--border-color)]">
              <p className="px-3 py-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Categories
              </p>
              {codexCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setCodexFilter({ category: category.id })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    codexFilter.category === category.id
                      ? 'bg-indigo-500/10 text-indigo-500'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color || '#6b7280' }}
                  />
                  <span className="flex-1 text-left">{category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Entry Buttons */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ENTRY_TYPE_CONFIG) as CodexEntryType[]).slice(0, 4).map((type) => {
              const config = ENTRY_TYPE_CONFIG[type];
              return (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCreateEntry(type)}
                  className="justify-start"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {config.label.slice(0, -1)}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">
              {filteredEntries.length} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${
                  viewMode === 'grid'
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${
                  viewMode === 'list'
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Entries Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-6 h-6" />}
              title="No entries found"
              description={codexFilter.search ? 'Try a different search term' : 'Create your first entry'}
              action={
                codexFilter.search
                  ? undefined
                  : {
                      label: 'Add Character',
                      onClick: () => handleCreateEntry('character'),
                    }
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEntries.map((entry) => (
                <CodexCard
                  key={entry.id}
                  entry={entry}
                  isSelected={entry.id === currentCodexEntryId}
                  onClick={() => selectCodexEntry(entry.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <CodexListItem
                  key={entry.id}
                  entry={entry}
                  isSelected={entry.id === currentCodexEntryId}
                  onClick={() => selectCodexEntry(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {currentEntry && (
        <CodexEntryDetail
          entry={currentEntry}
          onClose={() => selectCodexEntry(null)}
        />
      )}

      {/* Create Modal */}
      <CodexEntryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        type={createType}
      />
    </div>
  );
}

interface CodexCardProps {
  entry: CodexEntry;
  isSelected: boolean;
  onClick: () => void;
}

function CodexCard({ entry, isSelected, onClick }: CodexCardProps) {
  const config = ENTRY_TYPE_CONFIG[entry.type];

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border transition-colors
        ${isSelected
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {entry.thumbnail ? (
          <img
            src={entry.thumbnail}
            alt={entry.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <span style={{ color: config.color }}><config.icon className="w-6 h-6" /></span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--text-primary)] truncate">{entry.name}</h3>
          <p className="text-xs text-[var(--text-muted)]">{config.label.slice(0, -1)}</p>
          {entry.aliases.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
              aka {entry.aliases.join(', ')}
            </p>
          )}
        </div>
      </div>
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {entry.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} size="sm">
              {tag}
            </Badge>
          ))}
          {entry.tags.length > 3 && (
            <span className="text-xs text-[var(--text-muted)]">+{entry.tags.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}

interface CodexListItemProps {
  entry: CodexEntry;
  isSelected: boolean;
  onClick: () => void;
}

function CodexListItem({ entry, isSelected, onClick }: CodexListItemProps) {
  const config = ENTRY_TYPE_CONFIG[entry.type];

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left flex items-center gap-4 p-3 rounded-lg border transition-colors
        ${isSelected
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]'
        }
      `}
    >
      {entry.thumbnail ? (
        <img
          src={entry.thumbnail}
          alt={entry.name}
          className="w-10 h-10 rounded-lg object-cover"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <span style={{ color: config.color }}><config.icon className="w-5 h-5" /></span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[var(--text-primary)]">{entry.name}</h3>
          <span className="text-xs text-[var(--text-muted)]">{config.label.slice(0, -1)}</span>
        </div>
        {entry.description && (
          <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">
            {entry.description}
          </p>
        )}
      </div>
      {entry.tags.length > 0 && (
        <div className="flex gap-1">
          {entry.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
    </button>
  );
}
