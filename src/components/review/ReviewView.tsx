import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Target,
  Activity,
  Eye,
} from 'lucide-react';
import { useStore } from '@/store';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import { ProgressBar, CircularProgress } from '@/components/common/ProgressBar';
import { Tabs, Tab } from '@/components/common/Tabs';
import type { Scene, CodexEntry } from '@/types';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

export function ReviewView() {
  const {
    currentNovelId,
    novels,
    acts,
    chapters,
    scenes,
    codexEntries,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'pacing' | 'wordcount'>('overview');

  const currentNovel = novels.find((n) => n.id === currentNovelId);

  if (!currentNovelId || !currentNovel) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-6 h-6" />}
        title="No novel selected"
        description="Create or select a novel to view analytics"
      />
    );
  }

  const activeScenes = scenes.filter((s) => !s.isArchived);
  const characters = codexEntries.filter((e) => e.type === 'character');
  const totalWordCount = activeScenes.reduce((sum, s) => sum + s.wordCount, 0);
  const targetWordCount = currentNovel.targetWordCount || 80000;
  const progress = Math.min((totalWordCount / targetWordCount) * 100, 100);

  // Calculate scene statistics
  const sceneStats = {
    total: activeScenes.length,
    outline: activeScenes.filter((s) => s.status === 'outline').length,
    draft: activeScenes.filter((s) => s.status === 'draft').length,
    revision: activeScenes.filter((s) => s.status === 'revision').length,
    final: activeScenes.filter((s) => s.status === 'final').length,
  };

  // Average words per scene
  const avgWordsPerScene = activeScenes.length > 0
    ? Math.round(totalWordCount / activeScenes.length)
    : 0;

  // Words per chapter
  const chapterWordCounts = chapters.map((chapter) => {
    const chapterScenes = activeScenes.filter((s) => s.chapterId === chapter.id);
    return {
      chapter,
      wordCount: chapterScenes.reduce((sum, s) => sum + s.wordCount, 0),
      sceneCount: chapterScenes.length,
    };
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Analytics & Review</h2>
        <p className="text-sm text-[var(--text-muted)]">{currentNovel.title}</p>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)}>
          <Tab value="overview" label="Overview" icon={<BarChart3 className="w-4 h-4" />} />
          <Tab value="characters" label="Characters" icon={<Users className="w-4 h-4" />} />
          <Tab value="pacing" label="Pacing" icon={<Activity className="w-4 h-4" />} />
          <Tab value="wordcount" label="Word Count" icon={<FileText className="w-4 h-4" />} />
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            totalWordCount={totalWordCount}
            targetWordCount={targetWordCount}
            progress={progress}
            sceneStats={sceneStats}
            avgWordsPerScene={avgWordsPerScene}
            characterCount={characters.length}
            chapterCount={chapters.length}
            actCount={acts.length}
          />
        )}
        {activeTab === 'characters' && (
          <CharactersTab
            characters={characters}
            scenes={activeScenes}
            chapters={chapters}
          />
        )}
        {activeTab === 'pacing' && (
          <PacingTab
            acts={acts}
            chapters={chapters}
            scenes={activeScenes}
          />
        )}
        {activeTab === 'wordcount' && (
          <WordCountTab
            chapterWordCounts={chapterWordCounts}
            totalWordCount={totalWordCount}
            targetWordCount={targetWordCount}
          />
        )}
      </div>
    </div>
  );
}

interface OverviewTabProps {
  totalWordCount: number;
  targetWordCount: number;
  progress: number;
  sceneStats: {
    total: number;
    outline: number;
    draft: number;
    revision: number;
    final: number;
  };
  avgWordsPerScene: number;
  characterCount: number;
  chapterCount: number;
  actCount: number;
}

function OverviewTab({
  totalWordCount,
  targetWordCount,
  progress,
  sceneStats,
  avgWordsPerScene,
  characterCount,
  chapterCount,
  actCount,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Overall Progress</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {totalWordCount.toLocaleString()} / {targetWordCount.toLocaleString()} words
            </p>
          </div>
          <CircularProgress value={progress} size={80} strokeWidth={6} />
        </div>
        <ProgressBar value={totalWordCount} max={targetWordCount} size="lg" color="#6366f1" />
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Scenes"
          value={sceneStats.total}
          color="#6366f1"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Chapters"
          value={chapterCount}
          color="#22c55e"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Acts"
          value={actCount}
          color="#f59e0b"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Characters"
          value={characterCount}
          color="#ec4899"
        />
      </div>

      {/* Scene Status Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Scene Status</h3>
        <div className="space-y-3">
          <StatusBar label="Outline" count={sceneStats.outline} total={sceneStats.total} color="#6366f1" />
          <StatusBar label="Draft" count={sceneStats.draft} total={sceneStats.total} color="#f59e0b" />
          <StatusBar label="Revision" count={sceneStats.revision} total={sceneStats.total} color="#8b5cf6" />
          <StatusBar label="Final" count={sceneStats.final} total={sceneStats.total} color="#22c55e" />
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-[var(--text-muted)]">Avg. Words per Scene</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{avgWordsPerScene.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--text-muted)]">Avg. Words per Chapter</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {chapterCount > 0 ? Math.round(totalWordCount / chapterCount).toLocaleString() : 0}
          </p>
        </Card>
      </div>
    </div>
  );
}

interface CharactersTabProps {
  characters: CodexEntry[];
  scenes: Scene[];
  chapters: { id: string; title: string }[];
}

function CharactersTab({ characters, scenes, chapters }: CharactersTabProps) {
  // Calculate character appearances based on POV scenes
  const characterAppearances = useMemo(() => {
    return characters.map((char) => {
      const povScenes = scenes.filter((s) => s.povCharacterId === char.id);
      const mentionedScenes = scenes.filter((s) =>
        s.content.toLowerCase().includes(char.name.toLowerCase()) ||
        char.aliases.some((alias) => s.content.toLowerCase().includes(alias.toLowerCase()))
      );

      return {
        character: char,
        povScenes: povScenes.length,
        mentionedScenes: mentionedScenes.length,
        totalScenes: new Set([...povScenes.map((s) => s.id), ...mentionedScenes.map((s) => s.id)]).size,
      };
    }).sort((a, b) => b.totalScenes - a.totalScenes);
  }, [characters, scenes]);

  if (characters.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-6 h-6" />}
        title="No characters yet"
        description="Add characters to your Codex to see appearance analytics"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Character Heatmap */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Character Appearances</h3>
        <div className="space-y-3">
          {characterAppearances.slice(0, 10).map(({ character, povScenes, mentionedScenes, totalScenes }) => (
            <div key={character.id} className="flex items-center gap-4">
              <div className="w-32 truncate">
                <span className="text-sm font-medium text-[var(--text-primary)]">{character.name}</span>
              </div>
              <div className="flex-1">
                <div className="flex h-6 rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                  <div
                    className="bg-indigo-500 flex items-center justify-center"
                    style={{ width: `${(povScenes / scenes.length) * 100}%` }}
                  >
                    {povScenes > 0 && (
                      <span className="text-[10px] text-white font-medium">{povScenes} POV</span>
                    )}
                  </div>
                  <div
                    className="bg-indigo-300"
                    style={{ width: `${((mentionedScenes - povScenes) / scenes.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-20 text-right">
                <span className="text-sm text-[var(--text-muted)]">{totalScenes} scenes</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Characters per Scene */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Character Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {characterAppearances.slice(0, 8).map(({ character, totalScenes }) => (
            <div key={character.id} className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${character.color || '#6366f1'}30` }}
              >
                <span className="text-lg font-bold" style={{ color: character.color || '#6366f1' }}>
                  {character.name.charAt(0)}
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{character.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{totalScenes} appearances</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface PacingTabProps {
  acts: { id: string; title: string; order: number }[];
  chapters: { id: string; title: string; actId: string; order: number }[];
  scenes: Scene[];
}

function PacingTab({ acts, chapters, scenes }: PacingTabProps) {
  // Calculate pacing data
  const pacingData = useMemo(() => {
    return acts.map((act) => {
      const actChapters = chapters.filter((c) => c.actId === act.id);
      const actScenes = scenes.filter((s) => actChapters.some((c) => c.id === s.chapterId));
      const wordCount = actScenes.reduce((sum, s) => sum + s.wordCount, 0);

      return {
        act,
        chapters: actChapters.map((chapter) => {
          const chapterScenes = scenes.filter((s) => s.chapterId === chapter.id);
          return {
            chapter,
            scenes: chapterScenes,
            wordCount: chapterScenes.reduce((sum, s) => sum + s.wordCount, 0),
          };
        }),
        wordCount,
        sceneCount: actScenes.length,
      };
    });
  }, [acts, chapters, scenes]);

  const totalWords = scenes.reduce((sum, s) => sum + s.wordCount, 0);

  return (
    <div className="space-y-6">
      {/* Act Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Act Distribution</h3>
        <div className="flex h-12 rounded-lg overflow-hidden">
          {pacingData.map(({ act, wordCount }, index) => {
            const percentage = totalWords > 0 ? (wordCount / totalWords) * 100 : 0;
            const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'];
            return (
              <div
                key={act.id}
                className="flex items-center justify-center transition-all hover:brightness-110"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[index % colors.length],
                  minWidth: percentage > 5 ? '60px' : '20px',
                }}
              >
                {percentage > 10 && (
                  <span className="text-xs text-white font-medium">
                    {act.title} ({Math.round(percentage)}%)
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
          <span>Beginning</span>
          <span>Middle</span>
          <span>End</span>
        </div>
      </Card>

      {/* Scene Length Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Scene Length Timeline</h3>
        <div className="relative h-48">
          <div className="absolute inset-0 flex items-end gap-0.5">
            {scenes.slice(0, 50).map((scene, index) => {
              const maxHeight = 180;
              const maxWords = Math.max(...scenes.map((s) => s.wordCount));
              const height = maxWords > 0 ? (scene.wordCount / maxWords) * maxHeight : 0;

              return (
                <div
                  key={scene.id}
                  className="flex-1 min-w-[4px] bg-indigo-500 hover:bg-indigo-400 rounded-t transition-colors cursor-pointer"
                  style={{ height: `${height}px` }}
                  title={`${scene.title}: ${scene.wordCount} words`}
                />
              );
            })}
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
          Each bar represents a scene (showing first 50 scenes)
        </p>
      </Card>

      {/* Detailed Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Detailed Breakdown</h3>
        <div className="space-y-4">
          {pacingData.map(({ act, chapters: chapterData, wordCount }) => (
            <div key={act.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[var(--text-primary)]">{act.title}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {wordCount.toLocaleString()} words
                </span>
              </div>
              <div className="pl-4 space-y-1">
                {chapterData.map(({ chapter, wordCount: chapterWords }) => (
                  <div key={chapter.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{chapter.title}</span>
                    <span className="text-[var(--text-muted)]">{chapterWords.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface WordCountTabProps {
  chapterWordCounts: {
    chapter: { id: string; title: string };
    wordCount: number;
    sceneCount: number;
  }[];
  totalWordCount: number;
  targetWordCount: number;
}

function WordCountTab({ chapterWordCounts, totalWordCount, targetWordCount }: WordCountTabProps) {
  const maxChapterWords = Math.max(...chapterWordCounts.map((c) => c.wordCount));

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Word Count Progress</h3>
        <div className="flex items-end gap-4 mb-4">
          <div>
            <span className="text-4xl font-bold text-[var(--text-primary)]">
              {totalWordCount.toLocaleString()}
            </span>
            <span className="text-lg text-[var(--text-muted)]"> / {targetWordCount.toLocaleString()}</span>
          </div>
        </div>
        <ProgressBar
          value={totalWordCount}
          max={targetWordCount}
          size="lg"
          color="#6366f1"
          showLabel
        />
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {(targetWordCount - totalWordCount).toLocaleString()} words remaining to reach your goal
        </p>
      </Card>

      {/* Word Count by Chapter */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Words by Chapter</h3>
        <div className="space-y-3">
          {chapterWordCounts.map(({ chapter, wordCount, sceneCount }) => (
            <div key={chapter.id} className="flex items-center gap-4">
              <div className="w-40 truncate">
                <span className="text-sm font-medium text-[var(--text-primary)]">{chapter.title}</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">({sceneCount} scenes)</span>
              </div>
              <div className="flex-1">
                <div className="h-6 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-lg flex items-center px-2"
                    style={{ width: `${maxChapterWords > 0 ? (wordCount / maxChapterWords) * 100 : 0}%` }}
                  >
                    {wordCount > 500 && (
                      <span className="text-xs text-white font-medium">{wordCount.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-20 text-right">
                <span className="text-sm text-[var(--text-muted)]">{wordCount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">Total Chapters</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{chapterWordCounts.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">Avg per Chapter</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {chapterWordCounts.length > 0
              ? Math.round(totalWordCount / chapterWordCounts.length).toLocaleString()
              : 0}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">Progress</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {Math.round((totalWordCount / targetWordCount) * 100)}%
          </p>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="w-20">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="flex-1">
        <div className="h-6 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full flex items-center px-2"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          >
            {percentage > 15 && (
              <span className="text-xs text-white font-medium">{count}</span>
            )}
          </div>
        </div>
      </div>
      <div className="w-16 text-right">
        <span className="text-sm text-[var(--text-muted)]">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
