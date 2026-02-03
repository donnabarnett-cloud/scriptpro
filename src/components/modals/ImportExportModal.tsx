import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  File,
  FileCode,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { useStore } from '@/store';
import {
  importDocx,
  importMarkdown,
  exportToDocx,
  exportToMarkdown,
  exportToHtml,
  type NovelExportData,
} from '@/services/documents';
import type { ExportOptions, ImportOptions } from '@/types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
}

export function ImportExportModal({ isOpen, onClose, mode }: ImportExportModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'import' ? 'Import Document' : 'Export Novel'}
      size="lg"
    >
      {mode === 'import' ? <ImportContent onClose={onClose} /> : <ExportContent onClose={onClose} />}
    </Modal>
  );
}

function ImportContent({ onClose }: { onClose: () => void }) {
  const { novels, currentNovelId, createAct, createChapter, createScene, loadNovelData } = useStore();
  const currentNovel = novels.find(n => n.id === currentNovelId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{ acts: number; chapters: number; scenes: number } | null>(null);

  const [options, setOptions] = useState<ImportOptions>({
    format: 'docx',
    createChapters: true,
    createScenes: true,
    chapterDelimiter: '# ',
    sceneDelimiter: '***',
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect format
      if (file.name.endsWith('.docx')) {
        setOptions(prev => ({ ...prev, format: 'docx' }));
      } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        setOptions(prev => ({ ...prev, format: 'markdown' }));
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        setOptions(prev => ({ ...prev, format: 'html' }));
      }
      setStatus('idle');
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !currentNovel) return;

    setStatus('importing');
    setError(null);

    try {
      let result;

      if (options.format === 'docx') {
        result = await importDocx(selectedFile, currentNovel.id, options);
      } else if (options.format === 'markdown') {
        result = await importMarkdown(selectedFile, currentNovel.id, options);
      } else {
        throw new Error('Unsupported format');
      }

      // Create the imported structure
      for (const actData of result.acts) {
        const act = await createAct(currentNovel.id, {
          title: actData.title,
          description: actData.description,
          order: actData.order,
          color: actData.color,
        });

        const actChapters = result.chapters.filter(c => c.actId === actData.novelId);
        for (const chapterData of actChapters) {
          const chapter = await createChapter(currentNovel.id, act.id, {
            title: chapterData.title,
            description: chapterData.description,
            order: chapterData.order,
          });

          const chapterScenes = result.scenes.filter(s => s.chapterId === chapterData.novelId);
          for (const sceneData of chapterScenes) {
            await createScene(currentNovel.id, chapter.id, {
              title: sceneData.title,
              content: sceneData.content,
              order: sceneData.order,
              wordCount: sceneData.wordCount,
              status: 'draft',
              excludeFromAI: false,
              isArchived: false,
              labels: [],
              markers: [],
              sections: [],
              manualReferences: [],
              beats: [],
            });
          }
        }
      }

      // If no acts were created (simple import), create structure directly
      if (result.acts.length === 0) {
        // Create default act
        const act = await createAct(currentNovel.id, {
          title: 'Imported Content',
          order: 0,
        });

        for (const chapterData of result.chapters) {
          const chapter = await createChapter(currentNovel.id, act.id, {
            title: chapterData.title,
            order: chapterData.order,
          });

          const chapterScenes = result.scenes.filter(s => s.chapterId === chapterData.actId);
          for (const sceneData of chapterScenes) {
            await createScene(currentNovel.id, chapter.id, {
              title: sceneData.title,
              content: sceneData.content,
              order: sceneData.order,
              wordCount: sceneData.wordCount,
              status: 'draft',
              excludeFromAI: false,
              isArchived: false,
              labels: [],
              markers: [],
              sections: [],
              manualReferences: [],
              beats: [],
            });
          }
        }
      }

      setImportStats({
        acts: result.acts.length || 1,
        chapters: result.chapters.length,
        scenes: result.scenes.length,
      });

      // Reload novel data
      await loadNovelData(currentNovel.id);

      setStatus('success');
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Import failed');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {!currentNovel && (
        <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-yellow-500">Please select a novel first to import content into.</span>
        </div>
      )}

      {/* File Selection */}
      <Card className="p-4">
        <h4 className="font-medium text-[var(--text-primary)] mb-3">Select File</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.md,.markdown,.html,.htm"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
        >
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500" />
              <span className="text-[var(--text-primary)]">{selectedFile.name}</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)]">Click to select a file</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Supports .docx, .md, .markdown, .html
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Import Options */}
      <Card className="p-4">
        <h4 className="font-medium text-[var(--text-primary)] mb-3">Import Options</h4>
        <div className="space-y-4">
          <Select
            label="Format"
            value={options.format}
            onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as ImportOptions['format'] }))}
            options={[
              { value: 'docx', label: 'Word Document (.docx)' },
              { value: 'markdown', label: 'Markdown (.md)' },
              { value: 'html', label: 'HTML (.html)' },
            ]}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.createChapters}
              onChange={(e) => setOptions(prev => ({ ...prev, createChapters: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Create chapters from headings</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.createScenes}
              onChange={(e) => setOptions(prev => ({ ...prev, createScenes: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Create scenes from breaks (***)</span>
          </label>
        </div>
      </Card>

      {/* Status */}
      {status === 'success' && importStats && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-500">
            Successfully imported {importStats.acts} act(s), {importStats.chapters} chapter(s), and {importStats.scenes} scene(s)
          </span>
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleImport}
          disabled={!selectedFile || !currentNovel || status === 'importing'}
          leftIcon={status === 'importing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        >
          {status === 'importing' ? 'Importing...' : 'Import'}
        </Button>
      </div>
    </div>
  );
}

function ExportContent({ onClose }: { onClose: () => void }) {
  const { novels, currentNovelId, acts, chapters, scenes, codexEntries } = useStore();
  const currentNovel = novels.find(n => n.id === currentNovelId);

  const [status, setStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<ExportOptions>({
    format: 'docx',
    includeCodex: false,
    includeNotes: false,
    includeSummaries: false,
    chapterBreaks: true,
    sceneBreaks: true,
    frontMatter: true,
  });

  const handleExport = async () => {
    if (!currentNovel) return;

    setStatus('exporting');
    setError(null);

    try {
      const exportData: NovelExportData = {
        novel: currentNovel,
        acts: acts.filter(a => a.novelId === currentNovel.id),
        chapters: chapters.filter(c => c.novelId === currentNovel.id),
        scenes: scenes.filter(s => s.novelId === currentNovel.id),
        codexEntries: options.includeCodex
          ? codexEntries.filter(e => e.novelId === currentNovel.id)
          : undefined,
      };

      switch (options.format) {
        case 'docx':
          await exportToDocx(exportData, options);
          break;
        case 'markdown':
          await exportToMarkdown(exportData, options);
          break;
        case 'html':
          await exportToHtml(exportData, options);
          break;
        default:
          throw new Error('Unsupported format');
      }

      setStatus('success');
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setStatus('error');
    }
  };

  const getFormatIcon = () => {
    switch (options.format) {
      case 'docx':
        return <File className="w-5 h-5" />;
      case 'markdown':
        return <FileCode className="w-5 h-5" />;
      case 'html':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // Calculate stats
  const novelScenes = currentNovel
    ? scenes.filter(s => s.novelId === currentNovel.id && !s.isArchived)
    : [];
  const totalWords = novelScenes.reduce((sum, s) => sum + (s.wordCount || 0), 0);
  const novelChapters = currentNovel
    ? chapters.filter(c => c.novelId === currentNovel.id)
    : [];

  return (
    <div className="space-y-6">
      {!currentNovel && (
        <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-yellow-500">Please select a novel first to export.</span>
        </div>
      )}

      {/* Novel Info */}
      {currentNovel && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            {getFormatIcon()}
            <div>
              <h4 className="font-medium text-[var(--text-primary)]">{currentNovel.title}</h4>
              <p className="text-sm text-[var(--text-muted)]">
                {novelChapters.length} chapters · {novelScenes.length} scenes · {totalWords.toLocaleString()} words
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Export Options */}
      <Card className="p-4">
        <h4 className="font-medium text-[var(--text-primary)] mb-3">Export Options</h4>
        <div className="space-y-4">
          <Select
            label="Format"
            value={options.format}
            onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as ExportOptions['format'] }))}
            options={[
              { value: 'docx', label: 'Word Document (.docx)' },
              { value: 'markdown', label: 'Markdown (.md)' },
              { value: 'html', label: 'HTML (.html)' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.frontMatter}
                onChange={(e) => setOptions(prev => ({ ...prev, frontMatter: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-[var(--text-secondary)]">Include title page</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.chapterBreaks}
                onChange={(e) => setOptions(prev => ({ ...prev, chapterBreaks: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-[var(--text-secondary)]">Chapter headings</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.sceneBreaks}
                onChange={(e) => setOptions(prev => ({ ...prev, sceneBreaks: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-[var(--text-secondary)]">Scene breaks (***)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeNotes}
                onChange={(e) => setOptions(prev => ({ ...prev, includeNotes: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-[var(--text-secondary)]">Include notes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeSummaries}
                onChange={(e) => setOptions(prev => ({ ...prev, includeSummaries: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-[var(--text-secondary)]">Include summaries</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeCodex}
                onChange={(e) => setOptions(prev => ({ ...prev, includeCodex: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-[var(--text-secondary)]">Include codex appendix</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Status */}
      {status === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-500">Export completed! Check your downloads folder.</span>
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          disabled={!currentNovel || status === 'exporting'}
          leftIcon={status === 'exporting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        >
          {status === 'exporting' ? 'Exporting...' : 'Export'}
        </Button>
      </div>
    </div>
  );
}

export default ImportExportModal;
