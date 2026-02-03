import React from 'react';
import { Archive, RotateCcw, Trash2, FileText } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import type { Scene } from '@/types';
import { format } from 'date-fns';

interface SceneArchiveProps {
  scenes: Scene[];
}

export function SceneArchive({ scenes }: SceneArchiveProps) {
  const { restoreScene, deleteScene, chapters } = useStore();

  if (scenes.length === 0) {
    return (
      <EmptyState
        icon={<Archive className="w-6 h-6" />}
        title="No archived scenes"
        description="Archived scenes will appear here"
      />
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Archive className="w-5 h-5 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Archived Scenes ({scenes.length})
          </h2>
        </div>

        <div className="space-y-3">
          {scenes.map((scene) => {
            const chapter = chapters.find((c) => c.id === scene.chapterId);

            return (
              <div
                key={scene.id}
                className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]"
              >
                <FileText className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--text-primary)]">{scene.title}</h3>
                    <StatusBadge status={scene.status} />
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {chapter?.title || 'Unknown chapter'} &bull; {scene.wordCount.toLocaleString()} words
                  </p>
                  {scene.summary && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
                      {scene.summary}
                    </p>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Archived {format(new Date(scene.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => restoreScene(scene.id)}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteScene(scene.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
