import React, { useState } from 'react';
import {
  BookOpen,
  PenTool,
  Map,
  BookMarked,
  MessageSquare,
  BarChart3,
  Settings,
  Settings2,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  MoreHorizontal,
  Trash2,
  Copy,
  Edit2,
  Archive,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/common/Dropdown';
import { NovelSettingsModal } from '@/components/modals/NovelSettingsModal';
import type { Act, Chapter, Scene } from '@/types';

export function Sidebar() {
  const {
    novels,
    currentNovelId,
    acts,
    chapters,
    scenes,
    activeView,
    setActiveView,
    sidebarOpen,
    toggleSidebar,
    selectScene,
    currentSceneId,
    createAct,
    createChapter,
    createScene,
    deleteAct,
    deleteChapter,
    deleteScene,
  } = useStore();

  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const [showNovelSettings, setShowNovelSettings] = useState(false);

  const navItems = [
    { id: 'write', label: 'Write', icon: PenTool },
    { id: 'plan', label: 'Plan', icon: Map },
    { id: 'codex', label: 'Codex', icon: BookMarked },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'review', label: 'Review', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  if (!sidebarOpen) {
    return (
      <div className="w-16 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">
        <div className="p-3 border-b border-[var(--border-color)]">
          <BookOpen className="w-6 h-6 text-indigo-500 mx-auto" />
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as typeof activeView)}
              className={`
                w-full p-3 rounded-lg flex items-center justify-center
                transition-colors
                ${activeView === item.id
                  ? 'bg-indigo-500/10 text-indigo-500'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-lg text-[var(--text-primary)]">ScriptPro</span>
        </div>
      </div>

      {/* Novel Info */}
      {currentNovel && (
        <div className="px-4 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[var(--text-primary)] truncate">{currentNovel.title}</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {currentNovel.wordCount.toLocaleString()} words
              </p>
            </div>
            <button
              onClick={() => setShowNovelSettings(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Novel Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Novel Settings Modal */}
      {currentNovel && (
        <NovelSettingsModal
          isOpen={showNovelSettings}
          onClose={() => setShowNovelSettings(false)}
          novelId={currentNovel.id}
        />
      )}

      {/* Navigation */}
      <nav className="p-2 border-b border-[var(--border-color)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as typeof activeView)}
            className={`
              w-full px-3 py-2 rounded-lg flex items-center gap-3 text-sm
              transition-colors
              ${activeView === item.id
                ? 'bg-indigo-500/10 text-indigo-500'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Structure Tree */}
      {currentNovel && (activeView === 'write' || activeView === 'plan') && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Structure
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createAct(currentNovel.id, {})}
                className="!p-1"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <StructureTree
              acts={acts}
              chapters={chapters}
              scenes={scenes.filter((s) => !s.isArchived)}
              currentSceneId={currentSceneId}
              novelId={currentNovel.id}
              onSelectScene={selectScene}
              onCreateChapter={createChapter}
              onCreateScene={createScene}
              onDeleteAct={deleteAct}
              onDeleteChapter={deleteChapter}
              onDeleteScene={deleteScene}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface StructureTreeProps {
  acts: Act[];
  chapters: Chapter[];
  scenes: Scene[];
  currentSceneId: string | null;
  novelId: string;
  onSelectScene: (id: string | null) => void;
  onCreateChapter: (novelId: string, actId: string, data: Partial<Chapter>) => Promise<Chapter>;
  onCreateScene: (novelId: string, chapterId: string, data: Partial<Scene>) => Promise<Scene>;
  onDeleteAct: (id: string) => Promise<void>;
  onDeleteChapter: (id: string) => Promise<void>;
  onDeleteScene: (id: string) => Promise<void>;
}

function StructureTree({
  acts,
  chapters,
  scenes,
  currentSceneId,
  novelId,
  onSelectScene,
  onCreateChapter,
  onCreateScene,
  onDeleteAct,
  onDeleteChapter,
  onDeleteScene,
}: StructureTreeProps) {
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set(acts.map((a) => a.id)));
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(chapters.map((c) => c.id)));

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

  return (
    <div className="space-y-1">
      {acts.sort((a, b) => a.order - b.order).map((act) => {
        const actChapters = chapters.filter((c) => c.actId === act.id).sort((a, b) => a.order - b.order);
        const isExpanded = expandedActs.has(act.id);

        return (
          <div key={act.id}>
            <div className="group flex items-center">
              <button
                onClick={() => toggleAct(act.id)}
                className="p-1 rounded hover:bg-[var(--bg-hover)]"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                )}
              </button>
              <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-hover)] cursor-pointer">
                <Folder className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-[var(--text-primary)] truncate flex-1">{act.title}</span>
              </div>
              <Dropdown
                trigger={
                  <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)]">
                    <MoreHorizontal className="w-3 h-3 text-[var(--text-muted)]" />
                  </button>
                }
                align="right"
              >
                <DropdownItem icon={<Plus className="w-4 h-4" />} onClick={() => onCreateChapter(novelId, act.id, {})}>
                  Add Chapter
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<Trash2 className="w-4 h-4" />} danger onClick={() => onDeleteAct(act.id)}>
                  Delete Act
                </DropdownItem>
              </Dropdown>
            </div>

            {isExpanded && (
              <div className="ml-4">
                {actChapters.map((chapter) => {
                  const chapterScenes = scenes.filter((s) => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
                  const isChapterExpanded = expandedChapters.has(chapter.id);

                  return (
                    <div key={chapter.id}>
                      <div className="group flex items-center">
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="p-1 rounded hover:bg-[var(--bg-hover)]"
                        >
                          {isChapterExpanded ? (
                            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                          )}
                        </button>
                        <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-hover)] cursor-pointer">
                          <Folder className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-[var(--text-primary)] truncate flex-1">{chapter.title}</span>
                        </div>
                        <Dropdown
                          trigger={
                            <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)]">
                              <MoreHorizontal className="w-3 h-3 text-[var(--text-muted)]" />
                            </button>
                          }
                          align="right"
                        >
                          <DropdownItem icon={<Plus className="w-4 h-4" />} onClick={() => onCreateScene(novelId, chapter.id, {})}>
                            Add Scene
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem icon={<Trash2 className="w-4 h-4" />} danger onClick={() => onDeleteChapter(chapter.id)}>
                            Delete Chapter
                          </DropdownItem>
                        </Dropdown>
                      </div>

                      {isChapterExpanded && (
                        <div className="ml-4">
                          {chapterScenes.map((scene) => (
                            <div key={scene.id} className="group flex items-center">
                              <div className="w-4" />
                              <button
                                onClick={() => onSelectScene(scene.id)}
                                className={`
                                  flex-1 flex items-center gap-2 px-2 py-1 rounded text-left
                                  ${currentSceneId === scene.id
                                    ? 'bg-indigo-500/10 text-indigo-500'
                                    : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                                  }
                                `}
                              >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm truncate flex-1">{scene.title}</span>
                                <span className="text-xs text-[var(--text-muted)]">
                                  {scene.wordCount}
                                </span>
                              </button>
                              <Dropdown
                                trigger={
                                  <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)]">
                                    <MoreHorizontal className="w-3 h-3 text-[var(--text-muted)]" />
                                  </button>
                                }
                                align="right"
                              >
                                <DropdownItem icon={<Archive className="w-4 h-4" />} onClick={() => {}}>
                                  Archive
                                </DropdownItem>
                                <DropdownDivider />
                                <DropdownItem icon={<Trash2 className="w-4 h-4" />} danger onClick={() => onDeleteScene(scene.id)}>
                                  Delete Scene
                                </DropdownItem>
                              </Dropdown>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
