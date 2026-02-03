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
  Loader2,
  Wand2,
  FileEdit,
  Users,
  ListChecks,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/store';
import { Editor } from './Editor';
import { Button } from '@/components/common/Button';
import { Input, Textarea, Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Badge, StatusBadge } from '@/components/common/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/common/Dropdown';
import { EmptyState } from '@/components/common/EmptyState';
import type { Scene, SceneBeat, CodexEntry } from '@/types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import debounce from '@/utils/debounce';
import { AIService } from '@/services/ai';

export function WriteView() {
  const {
    currentNovelId,
    currentSceneId,
    scenes,
    chapters,
    acts,
    sceneLabels,
    codexEntries,
    settings,
    updateScene,
    selectScene,
    getRevisions,
    restoreRevision,
    toggleFocusMode,
    focusMode,
    createCodexEntry,
  } = useStore();

  const [showSceneSettings, setShowSceneSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBeatsPanel, setShowBeatsPanel] = useState(false);
  const [sidePanel, setSidePanel] = useState<'none' | 'notes' | 'beats' | 'context'>('none');

  // AI State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAction, setAIAction] = useState<'summarize' | 'continue' | 'rewrite' | 'beats' | 'characters' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');

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

  // AI Handler Functions
  const hasApiKey = Boolean(settings?.aiSettings?.apiKey);

  const openAIAction = (action: typeof aiAction) => {
    if (!hasApiKey) {
      setAiError('Please configure your OpenRouter API key in Settings first.');
      setShowAIModal(true);
      return;
    }
    setAIAction(action);
    setAiError(null);
    setAiResult(null);
    setShowAIModal(true);
  };

  const runAIAction = async () => {
    if (!currentScene || !settings?.aiSettings?.apiKey) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const aiService = new AIService(settings.aiSettings.apiKey, settings.aiSettings);

      // Build simple context
      const novelScenes = scenes.filter(s => s.novelId === currentNovelId && !s.isArchived);
      const sceneIndex = novelScenes.findIndex(s => s.id === currentScene.id);
      const previousScenes = novelScenes.slice(Math.max(0, sceneIndex - 2), sceneIndex);
      const relevantCodex = codexEntries.filter(e => e.novelId === currentNovelId).slice(0, 10);

      let context = '';
      if (previousScenes.length > 0) {
        context += '## Previous Scenes:\n';
        previousScenes.forEach(s => {
          context += `### ${s.title}\n${s.content.replace(/<[^>]*>/g, '').slice(0, 500)}...\n\n`;
        });
      }
      if (relevantCodex.length > 0) {
        context += '## Key Characters/Locations:\n';
        relevantCodex.forEach(e => {
          context += `- ${e.name} (${e.type}): ${e.description?.slice(0, 100) || 'No description'}\n`;
        });
        context += '\n';
      }
      context += `## Current Scene: ${currentScene.title}\n`;
      context += currentScene.content.replace(/<[^>]*>/g, '');

      let prompt = '';
      let systemPrompt = 'You are a helpful writing assistant for novelists.';

      switch (aiAction) {
        case 'summarize':
          systemPrompt = 'You are a concise summarizer for novel scenes. Create brief, useful summaries.';
          prompt = `Summarize this scene in 2-3 sentences:\n\n${currentScene.content.replace(/<[^>]*>/g, '')}`;
          break;
        case 'continue':
          systemPrompt = 'You are a creative writing assistant. Continue the story naturally, matching the existing tone and style.';
          prompt = `Context:\n${context}\n\nContinue writing the scene from where it left off. Write 2-3 paragraphs.`;
          break;
        case 'rewrite':
          if (!selectedText) {
            setAiError('Please select some text in the editor first.');
            setAiLoading(false);
            return;
          }
          systemPrompt = 'You are a skilled editor. Rewrite the given text to improve clarity, flow, and engagement while maintaining the original meaning.';
          prompt = `Context:\n${context}\n\nRewrite this text to improve it:\n\n"${selectedText}"`;
          break;
        case 'beats':
          systemPrompt = 'You are a story structure expert. Generate concise scene beats (story points) that would make this scene compelling.';
          prompt = `Based on this scene, suggest 5-7 key beats (story points/events) that should happen:\n\n${currentScene.content.replace(/<[^>]*>/g, '').slice(0, 2000)}`;
          break;
        case 'characters':
          systemPrompt = 'You are a character analyst. Identify all characters mentioned in the text.';
          prompt = `List all character names mentioned in this scene. For each character, provide:\n- Name\n- Brief description (if inferable)\n\nScene:\n${currentScene.content.replace(/<[^>]*>/g, '')}`;
          break;
      }

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ]);

      setAiResult(response.content);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIResult = () => {
    if (!aiResult || !currentScene) return;

    switch (aiAction) {
      case 'summarize':
        updateScene(currentScene.id, { summary: aiResult });
        break;
      case 'continue':
        // Append to content
        const newContent = currentScene.content + `<p>${aiResult.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
        updateScene(currentScene.id, { content: newContent });
        break;
      case 'rewrite':
        // User needs to manually copy/paste the rewritten text
        navigator.clipboard.writeText(aiResult);
        break;
      case 'beats':
        // Parse beats and add to scene
        const beatLines = aiResult.split('\n').filter(line => line.trim());
        const newBeats: SceneBeat[] = beatLines.slice(0, 10).map((line, index) => ({
          id: uuidv4(),
          content: line.replace(/^[\d\.\-\*]+\s*/, '').trim(),
          order: (currentScene.beats?.length || 0) + index,
          isCompleted: false,
        }));
        updateScene(currentScene.id, { beats: [...(currentScene.beats || []), ...newBeats] });
        break;
    }

    setShowAIModal(false);
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

              {/* AI Dropdown */}
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    AI
                  </Button>
                }
              >
                <DropdownItem
                  icon={<FileEdit className="w-4 h-4" />}
                  onClick={() => openAIAction('summarize')}
                >
                  Summarize Scene
                </DropdownItem>
                <DropdownItem
                  icon={<Wand2 className="w-4 h-4" />}
                  onClick={() => openAIAction('continue')}
                >
                  Continue Writing
                </DropdownItem>
                <DropdownItem
                  icon={<FileEdit className="w-4 h-4" />}
                  onClick={() => {
                    const selection = window.getSelection()?.toString() || '';
                    setSelectedText(selection);
                    openAIAction('rewrite');
                  }}
                >
                  Rewrite Selection
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  icon={<ListChecks className="w-4 h-4" />}
                  onClick={() => openAIAction('beats')}
                >
                  Generate Beats
                </DropdownItem>
                <DropdownItem
                  icon={<Users className="w-4 h-4" />}
                  onClick={() => openAIAction('characters')}
                >
                  Detect Characters
                </DropdownItem>
              </Dropdown>

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

      {/* AI Actions Modal */}
      <Modal
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setAIAction(null);
          setAiResult(null);
          setAiError(null);
        }}
        title={
          aiAction === 'summarize' ? 'Summarize Scene' :
          aiAction === 'continue' ? 'Continue Writing' :
          aiAction === 'rewrite' ? 'Rewrite Selection' :
          aiAction === 'beats' ? 'Generate Scene Beats' :
          aiAction === 'characters' ? 'Detect Characters' :
          'AI Assistant'
        }
        size="lg"
        footer={
          aiResult ? (
            <>
              <Button variant="ghost" onClick={() => {
                setShowAIModal(false);
                setAIAction(null);
                setAiResult(null);
              }}>
                Cancel
              </Button>
              {aiAction === 'rewrite' ? (
                <Button onClick={() => {
                  navigator.clipboard.writeText(aiResult);
                  setShowAIModal(false);
                }}>
                  Copy to Clipboard
                </Button>
              ) : aiAction === 'characters' ? (
                <Button onClick={() => setShowAIModal(false)}>
                  Done
                </Button>
              ) : (
                <Button onClick={applyAIResult}>
                  {aiAction === 'summarize' ? 'Save Summary' :
                   aiAction === 'continue' ? 'Append to Scene' :
                   aiAction === 'beats' ? 'Add Beats' : 'Apply'}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setShowAIModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={runAIAction}
                disabled={aiLoading || !hasApiKey}
                leftIcon={aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {aiLoading ? 'Generating...' : 'Generate'}
              </Button>
            </>
          )
        }
      >
        <div className="space-y-4">
          {!hasApiKey && (
            <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-500 font-medium">API Key Required</p>
                <p className="text-xs text-yellow-500/80">
                  Please configure your OpenRouter API key in Settings to use AI features.
                </p>
              </div>
            </div>
          )}

          {aiError && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-500">{aiError}</span>
            </div>
          )}

          {!aiResult && (
            <div className="text-sm text-[var(--text-secondary)]">
              {aiAction === 'summarize' && (
                <p>Generate a concise summary of this scene. The summary will be saved to the scene metadata.</p>
              )}
              {aiAction === 'continue' && (
                <p>AI will analyze the context and continue writing your scene naturally, matching your style and tone.</p>
              )}
              {aiAction === 'rewrite' && (
                <>
                  <p>Rewrite the selected text to improve clarity, flow, and engagement.</p>
                  {selectedText && (
                    <div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Selected text:</p>
                      <p className="text-[var(--text-primary)]">"{selectedText.slice(0, 200)}{selectedText.length > 200 ? '...' : ''}"</p>
                    </div>
                  )}
                  {!selectedText && (
                    <p className="mt-2 text-yellow-500">No text selected. Select some text in the editor first.</p>
                  )}
                </>
              )}
              {aiAction === 'beats' && (
                <p>Generate story beats (key events/story points) for this scene based on its content.</p>
              )}
              {aiAction === 'characters' && (
                <p>Detect and list all characters mentioned in this scene.</p>
              )}
            </div>
          )}

          {aiResult && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-muted)]">AI Response:</p>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg max-h-80 overflow-y-auto">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{aiResult}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
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
