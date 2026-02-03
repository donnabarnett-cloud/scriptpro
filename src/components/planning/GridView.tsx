import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, GripVertical, FileText, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/common/Dropdown';
import type { Act, Chapter, Scene, SceneLabel } from '@/types';

interface GridViewProps {
  acts: Act[];
  chapters: Chapter[];
  scenes: Scene[];
  labels: SceneLabel[];
}

export function GridView({ acts, chapters, scenes, labels }: GridViewProps) {
  const {
    createChapter,
    createScene,
    deleteAct,
    deleteChapter,
    deleteScene,
    archiveScene,
    moveScene,
    moveChapter,
    updateAct,
    updateChapter,
    selectScene,
    currentNovelId,
    setActiveView,
  } = useStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'scene' | 'chapter' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;

    if (scenes.find((s) => s.id === id)) {
      setActiveType('scene');
    } else if (chapters.find((c) => c.id === id)) {
      setActiveType('chapter');
    }
    setActiveId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeType === 'scene') {
      const activeScene = scenes.find((s) => s.id === activeId);
      const overScene = scenes.find((s) => s.id === overId);

      if (activeScene && overScene && activeScene.id !== overScene.id) {
        moveScene(activeScene.id, overScene.chapterId, overScene.order);
      }
    }

    setActiveId(null);
    setActiveType(null);
  };

  const activeScene = activeId ? scenes.find((s) => s.id === activeId) : null;
  const activeChapter = activeId ? chapters.find((c) => c.id === activeId) : null;

  const handleSceneClick = (sceneId: string) => {
    selectScene(sceneId);
    setActiveView('write');
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto overflow-y-auto p-4">
        <div className="flex gap-4 min-w-max">
          {acts.sort((a, b) => a.order - b.order).map((act) => {
            const actChapters = chapters
              .filter((c) => c.actId === act.id)
              .sort((a, b) => a.order - b.order);

            return (
              <div key={act.id} className="w-80 flex-shrink-0">
                {/* Act Header */}
                <div
                  className="flex items-center justify-between p-3 rounded-t-lg mb-2"
                  style={{ backgroundColor: act.color || '#6366f1' + '30' }}
                >
                  <h3 className="font-semibold text-[var(--text-primary)]">{act.title}</h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => currentNovelId && createChapter(currentNovelId, act.id, {})}
                      className="!p-1"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Dropdown
                      trigger={
                        <button className="p-1 rounded hover:bg-[var(--bg-hover)]">
                          <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                      }
                      align="right"
                    >
                      <DropdownItem icon={<Edit2 className="w-4 h-4" />} onClick={() => {}}>
                        Edit Act
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        icon={<Trash2 className="w-4 h-4" />}
                        danger
                        onClick={() => deleteAct(act.id)}
                      >
                        Delete Act
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>

                {/* Chapters */}
                <div className="space-y-3">
                  {actChapters.map((chapter) => {
                    const chapterScenes = scenes
                      .filter((s) => s.chapterId === chapter.id)
                      .sort((a, b) => a.order - b.order);

                    return (
                      <div
                        key={chapter.id}
                        className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]"
                      >
                        {/* Chapter Header */}
                        <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)]">
                          <span className="font-medium text-sm text-[var(--text-primary)]">
                            {chapter.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => currentNovelId && createScene(currentNovelId, chapter.id, {})}
                              className="!p-1"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Dropdown
                              trigger={
                                <button className="p-1 rounded hover:bg-[var(--bg-hover)]">
                                  <MoreHorizontal className="w-3 h-3 text-[var(--text-muted)]" />
                                </button>
                              }
                              align="right"
                            >
                              <DropdownItem icon={<Edit2 className="w-4 h-4" />} onClick={() => {}}>
                                Edit Chapter
                              </DropdownItem>
                              <DropdownDivider />
                              <DropdownItem
                                icon={<Trash2 className="w-4 h-4" />}
                                danger
                                onClick={() => deleteChapter(chapter.id)}
                              >
                                Delete Chapter
                              </DropdownItem>
                            </Dropdown>
                          </div>
                        </div>

                        {/* Scenes */}
                        <SortableContext
                          items={chapterScenes.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="p-2 space-y-2 min-h-[60px]">
                            {chapterScenes.map((scene) => (
                              <SortableSceneCard
                                key={scene.id}
                                scene={scene}
                                labels={labels}
                                onClick={() => handleSceneClick(scene.id)}
                                onDelete={() => deleteScene(scene.id)}
                                onArchive={() => archiveScene(scene.id)}
                              />
                            ))}
                            {chapterScenes.length === 0 && (
                              <div className="text-xs text-[var(--text-muted)] text-center py-4">
                                No scenes yet
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </div>
                    );
                  })}
                  {actChapters.length === 0 && (
                    <div className="text-sm text-[var(--text-muted)] text-center py-8 bg-[var(--bg-secondary)] rounded-lg border border-dashed border-[var(--border-color)]">
                      No chapters yet
                      <br />
                      <button
                        onClick={() => currentNovelId && createChapter(currentNovelId, act.id, {})}
                        className="text-indigo-500 hover:underline mt-1"
                      >
                        Add chapter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Act Column */}
          <div className="w-80 flex-shrink-0">
            <button
              onClick={() => currentNovelId && useStore.getState().createAct(currentNovelId, {})}
              className="w-full h-32 rounded-lg border-2 border-dashed border-[var(--border-color)] hover:border-indigo-500 hover:bg-[var(--bg-hover)] transition-colors flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:text-indigo-500"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm">Add Act</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeScene && (
          <SceneCard scene={activeScene} labels={labels} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface SceneCardProps {
  scene: Scene;
  labels: SceneLabel[];
  onClick?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  isDragging?: boolean;
}

function SceneCard({ scene, labels, onClick, onDelete, onArchive, isDragging }: SceneCardProps) {
  const sceneLabels = labels.filter((l) => scene.labels.includes(l.id));

  return (
    <div
      className={`
        group bg-[var(--bg-tertiary)] rounded-lg p-2 border border-[var(--border-color)]
        cursor-pointer hover:border-indigo-500 transition-colors
        ${isDragging ? 'shadow-lg opacity-90' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
              {scene.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={scene.status} />
            <span className="text-xs text-[var(--text-muted)]">
              {scene.wordCount} words
            </span>
          </div>
          {sceneLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
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
          )}
        </div>
        <Dropdown
          trigger={
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-[var(--bg-hover)] opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
          }
          align="right"
        >
          <DropdownItem icon={<Edit2 className="w-4 h-4" />} onClick={() => {}}>
            Edit
          </DropdownItem>
          {onArchive && (
            <DropdownItem
              icon={<FileText className="w-4 h-4" />}
              onClick={() => {
                onArchive();
              }}
            >
              Archive
            </DropdownItem>
          )}
          <DropdownDivider />
          {onDelete && (
            <DropdownItem
              icon={<Trash2 className="w-4 h-4" />}
              danger
              onClick={() => {
                onDelete();
              }}
            >
              Delete
            </DropdownItem>
          )}
        </Dropdown>
      </div>
    </div>
  );
}

function SortableSceneCard(props: SceneCardProps) {
  const { scene } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SceneCard {...props} />
    </div>
  );
}
