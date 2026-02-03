import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Clock,
  Tag,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  History,
  Settings2,
  AlignJustify,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';
import { useStore } from '@/store';
import { Editor } from './Editor';
import { Button } from '@/components/common/Button';
import { Input, Textarea, Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Badge, StatusBadge } from '@/components/common/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/common/Dropdown';
import { EmptyState } from '@/components/common/EmptyState';
import type { Scene, SceneBeat } from '@/types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import debounce from '@/utils/debounce';

export function WriteView() {
  const {
    currentNovelId,
    currentSceneId,
    scenes,
    chapters,
    sceneLabels,
    codexEntries,
    updateScene,
    selectScene,
    getRevisions,
    restoreRevision,
    toggleFocusMode,
    focusMode,
  } = useStore();

  const [showSceneSettings, setShowSceneSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBeatsPanel, setShowBeatsPanel] = useState(false);
  const [sidePanel, setSidePanel] = useState<'none' | 'notes' | 'beats' | 'context'>('none');

  const currentScene = scenes.find((s) => s.id === currentSceneId);
  const currentChapter = chapters.find((c) => c.id === currentScene?.chapterId);

  // Get adjacent scenes for navigation
  const chapterScenes = scenes
    .filter((s) => s.chapterId === currentScene?.chapterId && !s.isArchived)
    .sort((a, b) => a.order - b.order);
  const currentIndex = chapterScenes.findIndex((s) => s.id === currentSceneId);
  const prevScene = currentIndex > 0 ? chapterScenes[currentIndex - 1] : null;
  const nextScene = currentIndex < chapterScenes.length - 1 ? chapterScenes[currentIndex + 1] : null;

  const debouncedUpdate = useCallback(
    debounce((content: string) => {
      if (currentSceneId) {
        updateScene(currentSceneId, { content });
      }
    }, 1000),
    [currentSceneId, updateScene]
  );

  const handleContentChange = (content: string) => {
    debouncedUpdate(content);
  };

  if (!currentNovelId) {
    return (
      <EmptyState
        icon={<FileText className="w-6 h-6" />}
        title="No novel selected"
        description="Create or select a novel to start writing"
      />
    );
  }

  if (!currentScene) {
    return (
      <EmptyState
        icon={<FileText className="w-6 h-6" />}
        title="No scene selected"
        description="Select a scene from the sidebar to start writing"
      />
    );
  }

  const revisions = getRevisions(currentScene.id);

  return (
    <div className="h-full flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Scene Header */}
        {!focusMode && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-3 min-w-0">
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => prevScene && selectScene(prevScene.id)}
                  disabled={!prevScene}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => nextScene && selectScene(nextScene.id)}
                  disabled={!nextScene}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Scene Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[var(--text-primary)] truncate">
                    {currentScene.title}
                  </h2>
                  <StatusBadge status={currentScene.status} />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {currentChapter?.title} &bull; {currentScene.wordCount.toLocaleString()} words
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Side Panel Toggles */}
              <Button
                variant={sidePanel === 'beats' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSidePanel(sidePanel === 'beats' ? 'none' : 'beats')}
                leftIcon={<AlignJustify className="w-4 h-4" />}
              >
                Beats
              </Button>
              <Button
                variant={sidePanel === 'notes' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSidePanel(sidePanel === 'notes' ? 'none' : 'notes')}
              >
                Notes
              </Button>

              {/* AI Button */}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                AI
              </Button>

              {/* History */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
                leftIcon={<History className="w-4 h-4" />}
              >
                History
              </Button>

              {/* Focus Mode */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFocusMode}
                leftIcon={<Maximize2 className="w-4 h-4" />}
              />

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSceneSettings(true)}
                leftIcon={<Settings2 className="w-4 h-4" />}
              />
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            content={currentScene.content}
            onChange={handleContentChange}
            placeholder="Start writing your scene..."
          />
        </div>
      </div>

      {/* Side Panel */}
      {sidePanel !== 'none' && !focusMode && (
        <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
          {sidePanel === 'beats' && (
            <BeatsPanel
              beats={currentScene.beats || []}
              onUpdate={(beats) => updateScene(currentScene.id, { beats })}
            />
          )}
          {sidePanel === 'notes' && (
            <NotesPanel
              notes={currentScene.notes || ''}
              onUpdate={(notes) => updateScene(currentScene.id, { notes })}
            />
          )}
        </div>
      )}

      {/* Scene Settings Modal */}
      <SceneSettingsModal
        isOpen={showSceneSettings}
        onClose={() => setShowSceneSettings(false)}
        scene={currentScene}
        labels={sceneLabels}
        codexEntries={codexEntries}
        onUpdate={(data) => updateScene(currentScene.id, data)}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        revisions={revisions}
        onRestore={restoreRevision}
      />
    </div>
  );
}

// Beats Panel Component
interface BeatsPanelProps {
  beats: SceneBeat[];
  onUpdate: (beats: SceneBeat[]) => void;
}

function BeatsPanel({ beats, onUpdate }: BeatsPanelProps) {
  const [newBeat, setNewBeat] = useState('');

  const addBeat = () => {
    if (newBeat.trim()) {
      const beat: SceneBeat = {
        id: uuidv4(),
        content: newBeat.trim(),
        order: beats.length,
        isCompleted: false,
      };
      onUpdate([...beats, beat]);
      setNewBeat('');
    }
  };

  const toggleBeat = (id: string) => {
    onUpdate(
      beats.map((b) => (b.id === id ? { ...b, isCompleted: !b.isCompleted } : b))
    );
  };

  const deleteBeat = (id: string) => {
    onUpdate(beats.filter((b) => b.id !== id));
  };

  const updateBeatContent = (id: string, content: string) => {
    onUpdate(
      beats.map((b) => (b.id === id ? { ...b, content } : b))
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Scene Beats</h3>
        <p className="text-xs text-[var(--text-muted)]">Director-style instructions for your scene</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {beats.map((beat, index) => (
          <div
            key={beat.id}
            className={`group flex items-start gap-2 p-2 rounded-lg ${beat.isCompleted ? 'opacity-50' : ''}`}
          >
            <button
              onClick={() => toggleBeat(beat.id)}
              className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 ${
                beat.isCompleted
                  ? 'bg-green-500 border-green-500'
                  : 'border-[var(--border-color)] hover:border-indigo-500'
              }`}
            >
              {beat.isCompleted && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <input
              value={beat.content}
              onChange={(e) => updateBeatContent(beat.id, e.target.value)}
              className={`flex-1 bg-transparent text-sm ${beat.isCompleted ? 'line-through' : ''}`}
            />
            <button
              onClick={() => deleteBeat(beat.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[var(--border-color)]">
        <div className="flex gap-2">
          <Input
            value={newBeat}
            onChange={(e) => setNewBeat(e.target.value)}
            placeholder="Add a beat..."
            onKeyDown={(e) => e.key === 'Enter' && addBeat()}
            className="text-sm"
          />
          <Button onClick={addBeat} size="sm">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

// Notes Panel Component
interface NotesPanelProps {
  notes: string;
  onUpdate: (notes: string) => void;
}

function NotesPanel({ notes, onUpdate }: NotesPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Scene Notes</h3>
        <p className="text-xs text-[var(--text-muted)]">Private notes for this scene</p>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={notes}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Add notes about this scene..."
          className="w-full h-full bg-transparent resize-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
        />
      </div>
    </div>
  );
}

// Scene Settings Modal
interface SceneSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene;
  labels: { id: string; name: string; color: string }[];
  codexEntries: { id: string; name: string; type: string }[];
  onUpdate: (data: Partial<Scene>) => void;
}

function SceneSettingsModal({ isOpen, onClose, scene, labels, codexEntries, onUpdate }: SceneSettingsModalProps) {
  const [title, setTitle] = useState(scene.title);
  const [subtitle, setSubtitle] = useState(scene.subtitle || '');
  const [status, setStatus] = useState(scene.status);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(scene.labels);
  const [excludeFromAI, setExcludeFromAI] = useState(scene.excludeFromAI);
  const [povCharacterId, setPovCharacterId] = useState(scene.povCharacterId || '');
  const [locationId, setLocationId] = useState(scene.locationId || '');

  useEffect(() => {
    setTitle(scene.title);
    setSubtitle(scene.subtitle || '');
    setStatus(scene.status);
    setSelectedLabels(scene.labels);
    setExcludeFromAI(scene.excludeFromAI);
    setPovCharacterId(scene.povCharacterId || '');
    setLocationId(scene.locationId || '');
  }, [scene]);

  const handleSave = () => {
    onUpdate({
      title,
      subtitle: subtitle || undefined,
      status,
      labels: selectedLabels,
      excludeFromAI,
      povCharacterId: povCharacterId || undefined,
      locationId: locationId || undefined,
    });
    onClose();
  };

  const characters = codexEntries.filter((e) => e.type === 'character');
  const locations = codexEntries.filter((e) => e.type === 'location');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scene Settings"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Subtitle (Time/Location)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g., 'Morning, at the castle'"
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Scene['status'])}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'draft', label: 'Draft' },
            { value: 'revision', label: 'Revision' },
            { value: 'final', label: 'Final' },
          ]}
        />
        <Select
          label="POV Character"
          value={povCharacterId}
          onChange={(e) => setPovCharacterId(e.target.value)}
          options={[
            { value: '', label: 'None' },
            ...characters.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Select
          label="Location"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          options={[
            { value: '', label: 'None' },
            ...locations.map((l) => ({ value: l.id, label: l.name })),
          ]}
        />
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Labels
          </label>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <button
                key={label.id}
                onClick={() => {
                  if (selectedLabels.includes(label.id)) {
                    setSelectedLabels(selectedLabels.filter((l) => l !== label.id));
                  } else {
                    setSelectedLabels([...selectedLabels, label.id]);
                  }
                }}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedLabels.includes(label.id)
                    ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)]'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${label.color}30`,
                  color: label.color,
                  ...(selectedLabels.includes(label.id) ? { ringColor: label.color } : {}),
                }}
              >
                {label.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="excludeFromAI"
            checked={excludeFromAI}
            onChange={(e) => setExcludeFromAI(e.target.checked)}
            className="rounded border-[var(--border-color)]"
          />
          <label htmlFor="excludeFromAI" className="text-sm text-[var(--text-secondary)]">
            Exclude from AI context
          </label>
        </div>
      </div>
    </Modal>
  );
}

// History Modal
interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisions: { id: string; createdAt: Date; wordCount: number; content: string }[];
  onRestore: (id: string) => Promise<void>;
}

function HistoryModal({ isOpen, onClose, revisions, onRestore }: HistoryModalProps) {
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);

  const handleRestore = async () => {
    if (selectedRevision) {
      await onRestore(selectedRevision);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revision History"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRestore} disabled={!selectedRevision}>
            Restore Selected
          </Button>
        </>
      }
    >
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {revisions.length === 0 ? (
          <p className="text-[var(--text-muted)] text-center py-8">No revision history yet</p>
        ) : (
          revisions.map((revision) => (
            <button
              key={revision.id}
              onClick={() => setSelectedRevision(revision.id)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                selectedRevision === revision.id
                  ? 'bg-indigo-500/10 border-indigo-500'
                  : 'hover:bg-[var(--bg-hover)]'
              } border border-[var(--border-color)]`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text-primary)]">
                  {format(new Date(revision.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {revision.wordCount} words
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                {revision.content.replace(/<[^>]*>/g, '').slice(0, 150)}...
              </p>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
