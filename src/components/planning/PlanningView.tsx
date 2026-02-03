import React, { useState } from 'react';
import { Grid3X3, Table, List, Plus, Archive, Filter } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Tabs, Tab } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { GridView } from './GridView';
import { MatrixView } from './MatrixView';
import { OutlineView } from './OutlineView';
import { SceneArchive } from './SceneArchive';

export function PlanningView() {
  const {
    currentNovelId,
    planningView,
    setPlanningView,
    acts,
    chapters,
    scenes,
    sceneLabels,
    createAct,
  } = useStore();

  const [showArchive, setShowArchive] = useState(false);
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [filterPOV, setFilterPOV] = useState<string | null>(null);

  if (!currentNovelId) {
    return (
      <EmptyState
        icon={<Grid3X3 className="w-6 h-6" />}
        title="No novel selected"
        description="Create or select a novel to start planning"
      />
    );
  }

  const activeScenes = scenes.filter((s) => !s.isArchived);
  const archivedScenes = scenes.filter((s) => s.isArchived);

  // Apply filters
  const filteredScenes = activeScenes.filter((scene) => {
    if (filterLabels.length > 0 && !filterLabels.some((l) => scene.labels.includes(l))) {
      return false;
    }
    if (filterPOV && scene.povCharacterId !== filterPOV) {
      return false;
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Planning</h2>

          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
            <button
              onClick={() => setPlanningView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                planningView === 'grid'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setPlanningView('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                planningView === 'matrix'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Table className="w-4 h-4" />
              Matrix
            </button>
            <button
              onClick={() => setPlanningView('outline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                planningView === 'outline'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-4 h-4" />
              Outline
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <LabelFilter
            labels={sceneLabels}
            selectedLabels={filterLabels}
            onChange={setFilterLabels}
          />

          {/* Archive */}
          <Button
            variant={showArchive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowArchive(!showArchive)}
            leftIcon={<Archive className="w-4 h-4" />}
          >
            Archive ({archivedScenes.length})
          </Button>

          {/* Add Act */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => createAct(currentNovelId, {})}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Act
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {showArchive ? (
          <SceneArchive scenes={archivedScenes} />
        ) : (
          <>
            {planningView === 'grid' && (
              <GridView
                acts={acts}
                chapters={chapters}
                scenes={filteredScenes}
                labels={sceneLabels}
              />
            )}
            {planningView === 'matrix' && (
              <MatrixView
                acts={acts}
                chapters={chapters}
                scenes={filteredScenes}
                labels={sceneLabels}
              />
            )}
            {planningView === 'outline' && (
              <OutlineView
                acts={acts}
                chapters={chapters}
                scenes={filteredScenes}
                labels={sceneLabels}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface LabelFilterProps {
  labels: { id: string; name: string; color: string }[];
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
}

function LabelFilter({ labels, selectedLabels, onChange }: LabelFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleLabel = (labelId: string) => {
    if (selectedLabels.includes(labelId)) {
      onChange(selectedLabels.filter((l) => l !== labelId));
    } else {
      onChange([...selectedLabels, labelId]);
    }
  };

  return (
    <div className="relative">
      <Button
        variant={selectedLabels.length > 0 ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        leftIcon={<Filter className="w-4 h-4" />}
      >
        {selectedLabels.length > 0 ? `${selectedLabels.length} filters` : 'Filter'}
      </Button>
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg z-50 p-2">
          <p className="text-xs text-[var(--text-muted)] mb-2 px-2">Filter by label</p>
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left ${
                selectedLabels.includes(label.id) ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span className="flex-1">{label.name}</span>
              {selectedLabels.includes(label.id) && (
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          {selectedLabels.length > 0 && (
            <>
              <div className="border-t border-[var(--border-color)] my-2" />
              <button
                onClick={() => onChange([])}
                className="w-full px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
