import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Edit2 } from 'lucide-react';
import { useStore } from '@/store';
import { StatusBadge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input, Textarea, Select } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { Act, Chapter, Scene, SceneLabel } from '@/types';

interface MatrixViewProps {
  acts: Act[];
  chapters: Chapter[];
  scenes: Scene[];
  labels: SceneLabel[];
}

export function MatrixView({ acts, chapters, scenes, labels }: MatrixViewProps) {
  const { updateScene, selectScene, setActiveView, codexEntries } = useStore();
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set(acts.map((a) => a.id)));
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(chapters.map((c) => c.id)));
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  const toggleAct = (actId: string) => {
    const newExpanded = new Set(expandedActs);
    if (newExpanded.has(actId)) {
      newExpanded.delete(actId);
    } else {
      newExpanded.add(actId);
    }
    setExpandedActs(newExpanded);
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleSceneClick = (scene: Scene) => {
    selectScene(scene.id);
    setActiveView('write');
  };

  const characters = codexEntries.filter((e) => e.type === 'character');
  const locations = codexEntries.filter((e) => e.type === 'location');

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10">
          <tr>
            <th className="text-left p-3 border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] w-64">
              Structure
            </th>
            <th className="text-left p-3 border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] w-24">
              Status
            </th>
            <th className="text-left p-3 border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] w-24">
              Words
            </th>
            <th className="text-left p-3 border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] w-32">
              POV
            </th>
            <th className="text-left p-3 border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] w-32">
              Location
            </th>
            <th className="text-left p-3 border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)]">
              Summary
            </th>
            <th className="text-left p-3 border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] w-32">
              Labels
            </th>
          </tr>
        </thead>
        <tbody>
          {acts.sort((a, b) => a.order - b.order).map((act) => {
            const actChapters = chapters
              .filter((c) => c.actId === act.id)
              .sort((a, b) => a.order - b.order);
            const isActExpanded = expandedActs.has(act.id);
            const actWordCount = scenes
              .filter((s) => actChapters.some((c) => c.id === s.chapterId))
              .reduce((sum, s) => sum + s.wordCount, 0);

            return (
              <React.Fragment key={act.id}>
                {/* Act Row */}
                <tr className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]">
                  <td className="p-3 border-b border-[var(--border-color)]">
                    <button
                      onClick={() => toggleAct(act.id)}
                      className="flex items-center gap-2 font-semibold text-[var(--text-primary)]"
                    >
                      {isActExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      {act.title}
                    </button>
                  </td>
                  <td className="p-3 border-b border-[var(--border-color)]"></td>
                  <td className="p-3 border-b border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                    {actWordCount.toLocaleString()}
                  </td>
                  <td className="p-3 border-b border-[var(--border-color)]" colSpan={4}></td>
                </tr>

                {/* Chapters and Scenes */}
                {isActExpanded &&
                  actChapters.map((chapter) => {
                    const chapterScenes = scenes
                      .filter((s) => s.chapterId === chapter.id)
                      .sort((a, b) => a.order - b.order);
                    const isChapterExpanded = expandedChapters.has(chapter.id);
                    const chapterWordCount = chapterScenes.reduce(
                      (sum, s) => sum + s.wordCount,
                      0
                    );

                    return (
                      <React.Fragment key={chapter.id}>
                        {/* Chapter Row */}
                        <tr className="hover:bg-[var(--bg-hover)]">
                          <td className="p-3 border-b border-[var(--border-color)] pl-8">
                            <button
                              onClick={() => toggleChapter(chapter.id)}
                              className="flex items-center gap-2 font-medium text-[var(--text-primary)]"
                            >
                              {isChapterExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              {chapter.title}
                            </button>
                          </td>
                          <td className="p-3 border-b border-[var(--border-color)]"></td>
                          <td className="p-3 border-b border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                            {chapterWordCount.toLocaleString()}
                          </td>
                          <td className="p-3 border-b border-[var(--border-color)]">
                            {chapter.povCharacterId && (
                              <span className="text-sm text-[var(--text-secondary)]">
                                {characters.find((c) => c.id === chapter.povCharacterId)?.name}
                              </span>
                            )}
                          </td>
                          <td className="p-3 border-b border-[var(--border-color)]" colSpan={3}></td>
                        </tr>

                        {/* Scene Rows */}
                        {isChapterExpanded &&
                          chapterScenes.map((scene) => {
                            const povCharacter = characters.find(
                              (c) => c.id === scene.povCharacterId
                            );
                            const location = locations.find(
                              (l) => l.id === scene.locationId
                            );
                            const sceneLabels = labels.filter((l) =>
                              scene.labels.includes(l.id)
                            );

                            return (
                              <tr
                                key={scene.id}
                                className="hover:bg-[var(--bg-hover)] cursor-pointer group"
                              >
                                <td
                                  className="p-3 border-b border-[var(--border-color)] pl-14"
                                  onClick={() => handleSceneClick(scene)}
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text-primary)]">
                                      {scene.title}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingScene(scene);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-tertiary)]"
                                    >
                                      <Edit2 className="w-3 h-3 text-[var(--text-muted)]" />
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 border-b border-[var(--border-color)]">
                                  <StatusBadge status={scene.status} />
                                </td>
                                <td className="p-3 border-b border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                                  {scene.wordCount.toLocaleString()}
                                </td>
                                <td className="p-3 border-b border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                                  {povCharacter?.name || '-'}
                                </td>
                                <td className="p-3 border-b border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                                  {location?.name || '-'}
                                </td>
                                <td className="p-3 border-b border-[var(--border-color)]">
                                  <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                                    {scene.summary || '-'}
                                  </p>
                                </td>
                                <td className="p-3 border-b border-[var(--border-color)]">
                                  <div className="flex flex-wrap gap-1">
                                    {sceneLabels.map((label) => (
                                      <span
                                        key={label.id}
                                        className="px-1.5 py-0.5 text-[10px] rounded-full"
                                        style={{
                                          backgroundColor: `${label.color}30`,
                                          color: label.color,
                                        }}
                                      >
                                        {label.name}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Quick Edit Modal */}
      {editingScene && (
        <QuickEditModal
          scene={editingScene}
          labels={labels}
          characters={characters}
          locations={locations}
          onClose={() => setEditingScene(null)}
          onSave={(data) => {
            updateScene(editingScene.id, data);
            setEditingScene(null);
          }}
        />
      )}
    </div>
  );
}

interface QuickEditModalProps {
  scene: Scene;
  labels: SceneLabel[];
  characters: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Partial<Scene>) => void;
}

function QuickEditModal({
  scene,
  labels,
  characters,
  locations,
  onClose,
  onSave,
}: QuickEditModalProps) {
  const [title, setTitle] = useState(scene.title);
  const [summary, setSummary] = useState(scene.summary || '');
  const [status, setStatus] = useState(scene.status);
  const [povCharacterId, setPovCharacterId] = useState(scene.povCharacterId || '');
  const [locationId, setLocationId] = useState(scene.locationId || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(scene.labels);

  const handleSave = () => {
    onSave({
      title,
      summary: summary || undefined,
      status,
      povCharacterId: povCharacterId || undefined,
      locationId: locationId || undefined,
      labels: selectedLabels,
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Scene"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
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
        <Textarea
          label="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief summary of the scene..."
          rows={3}
        />
        <div className="grid grid-cols-2 gap-4">
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
        </div>
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
                }}
              >
                {label.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
