import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  GripVertical,
  Edit2,
  Trash2,
  Archive,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/common/Dropdown';
import type { Act, Chapter, Scene, SceneLabel } from '@/types';

interface OutlineViewProps {
  acts: Act[];
  chapters: Chapter[];
  scenes: Scene[];
  labels: SceneLabel[];
}

export function OutlineView({ acts, chapters, scenes, labels }: OutlineViewProps) {
  const {
    createChapter,
    createScene,
    deleteAct,
    deleteChapter,
    deleteScene,
    archiveScene,
    selectScene,
    setActiveView,
    currentNovelId,
  } = useStore();

  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set(acts.map((a) => a.id)));
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(chapters.map((c) => c.id)));
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

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

  const toggleScene = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  const handleSceneClick = (sceneId: string) => {
    selectScene(sceneId);
    setActiveView('write');
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-2">
        {acts.sort((a, b) => a.order - b.order).map((act) => {
          const actChapters = chapters
            .filter((c) => c.actId === act.id)
            .sort((a, b) => a.order - b.order);
          const isExpanded = expandedActs.has(act.id);
          const actWordCount = scenes
            .filter((s) => actChapters.some((c) => c.id === s.chapterId))
            .reduce((sum, s) => sum + s.wordCount, 0);

          return (
            <div key={act.id} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
              {/* Act Header */}
              <div
                className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer"
                onClick={() => toggleAct(act.id)}
              >
                <button className="p-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </button>
                {isExpanded ? (
                  <FolderOpen className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Folder className="w-5 h-5 text-indigo-500" />
                )}
                <span className="font-semibold text-[var(--text-primary)] flex-1">{act.title}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {actChapters.length} chapters &bull; {actWordCount.toLocaleString()} words
                </span>
                <Dropdown
                  trigger={
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                    >
                      <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                  }
                  align="right"
                >
                  <DropdownItem
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => currentNovelId && createChapter(currentNovelId, act.id, {})}
                  >
                    Add Chapter
                  </DropdownItem>
                  <DropdownItem icon={<Edit2 className="w-4 h-4" />}>Edit Act</DropdownItem>
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

              {/* Act Description */}
              {isExpanded && act.description && (
                <div className="px-12 py-2 bg-[var(--bg-primary)] text-sm text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                  {act.description}
                </div>
              )}

              {/* Chapters */}
              {isExpanded && (
                <div className="bg-[var(--bg-primary)]">
                  {actChapters.map((chapter) => {
                    const chapterScenes = scenes
                      .filter((s) => s.chapterId === chapter.id)
                      .sort((a, b) => a.order - b.order);
                    const isChapterExpanded = expandedChapters.has(chapter.id);
                    const chapterWordCount = chapterScenes.reduce((sum, s) => sum + s.wordCount, 0);

                    return (
                      <div key={chapter.id} className="border-b border-[var(--border-color)] last:border-b-0">
                        {/* Chapter Header */}
                        <div
                          className="flex items-center gap-2 p-3 pl-8 hover:bg-[var(--bg-hover)] cursor-pointer"
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          <button className="p-1">
                            {isChapterExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                            )}
                          </button>
                          {isChapterExpanded ? (
                            <FolderOpen className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Folder className="w-5 h-5 text-amber-500" />
                          )}
                          <span className="font-medium text-[var(--text-primary)] flex-1">
                            {chapter.title}
                          </span>
                          <span className="text-sm text-[var(--text-muted)]">
                            {chapterScenes.length} scenes &bull; {chapterWordCount.toLocaleString()} words
                          </span>
                          <Dropdown
                            trigger={
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                              >
                                <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
                              </button>
                            }
                            align="right"
                          >
                            <DropdownItem
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => currentNovelId && createScene(currentNovelId, chapter.id, {})}
                            >
                              Add Scene
                            </DropdownItem>
                            <DropdownItem icon={<Edit2 className="w-4 h-4" />}>Edit Chapter</DropdownItem>
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

                        {/* Scenes */}
                        {isChapterExpanded && (
                          <div className="pl-14">
                            {chapterScenes.map((scene) => {
                              const isSceneExpanded = expandedScenes.has(scene.id);
                              const sceneLabels = labels.filter((l) => scene.labels.includes(l.id));

                              return (
                                <div
                                  key={scene.id}
                                  className="border-t border-[var(--border-color)] first:border-t-0"
                                >
                                  {/* Scene Header */}
                                  <div className="flex items-center gap-2 p-3 hover:bg-[var(--bg-hover)] group">
                                    <button
                                      onClick={() => toggleScene(scene.id)}
                                      className="p-1"
                                    >
                                      {isSceneExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                                      )}
                                    </button>
                                    <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                                    <button
                                      onClick={() => handleSceneClick(scene.id)}
                                      className="flex-1 text-left"
                                    >
                                      <span className="text-sm text-[var(--text-primary)] hover:text-indigo-500">
                                        {scene.title}
                                      </span>
                                    </button>
                                    <StatusBadge status={scene.status} />
                                    <span className="text-xs text-[var(--text-muted)]">
                                      {scene.wordCount.toLocaleString()} words
                                    </span>
                                    {sceneLabels.length > 0 && (
                                      <div className="flex gap-1">
                                        {sceneLabels.slice(0, 2).map((label) => (
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
                                        {sceneLabels.length > 2 && (
                                          <span className="text-[10px] text-[var(--text-muted)]">
                                            +{sceneLabels.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <Dropdown
                                      trigger={
                                        <button
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-1 rounded hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100"
                                        >
                                          <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
                                        </button>
                                      }
                                      align="right"
                                    >
                                      <DropdownItem icon={<Edit2 className="w-4 h-4" />}>
                                        Edit Scene
                                      </DropdownItem>
                                      <DropdownItem
                                        icon={<Archive className="w-4 h-4" />}
                                        onClick={() => archiveScene(scene.id)}
                                      >
                                        Archive
                                      </DropdownItem>
                                      <DropdownDivider />
                                      <DropdownItem
                                        icon={<Trash2 className="w-4 h-4" />}
                                        danger
                                        onClick={() => deleteScene(scene.id)}
                                      >
                                        Delete Scene
                                      </DropdownItem>
                                    </Dropdown>
                                  </div>

                                  {/* Scene Details */}
                                  {isSceneExpanded && (
                                    <div className="pl-12 pr-4 pb-3 space-y-2">
                                      {scene.subtitle && (
                                        <p className="text-xs text-[var(--text-muted)] italic">
                                          {scene.subtitle}
                                        </p>
                                      )}
                                      {scene.summary && (
                                        <p className="text-sm text-[var(--text-secondary)]">
                                          {scene.summary}
                                        </p>
                                      )}
                                      {scene.beats && scene.beats.length > 0 && (
                                        <div className="space-y-1">
                                          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                            Beats
                                          </p>
                                          <ul className="space-y-1">
                                            {scene.beats.map((beat) => (
                                              <li
                                                key={beat.id}
                                                className={`flex items-center gap-2 text-sm ${
                                                  beat.isCompleted
                                                    ? 'line-through text-[var(--text-muted)]'
                                                    : 'text-[var(--text-secondary)]'
                                                }`}
                                              >
                                                <div
                                                  className={`w-2 h-2 rounded-full ${
                                                    beat.isCompleted ? 'bg-green-500' : 'bg-[var(--border-color)]'
                                                  }`}
                                                />
                                                {beat.content}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {!scene.summary && (!scene.beats || scene.beats.length === 0) && (
                                        <p className="text-sm text-[var(--text-muted)] italic">
                                          No summary or beats yet
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {chapterScenes.length === 0 && (
                              <div className="p-4 text-center">
                                <p className="text-sm text-[var(--text-muted)]">No scenes yet</p>
                                <button
                                  onClick={() => currentNovelId && createScene(currentNovelId, chapter.id, {})}
                                  className="text-sm text-indigo-500 hover:underline mt-1"
                                >
                                  Add scene
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {actChapters.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="text-sm text-[var(--text-muted)]">No chapters yet</p>
                      <button
                        onClick={() => currentNovelId && createChapter(currentNovelId, act.id, {})}
                        className="text-sm text-indigo-500 hover:underline mt-1"
                      >
                        Add chapter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
