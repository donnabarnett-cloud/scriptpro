import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Type,
  Cpu,
  Download,
  Upload,
  Key,
  RefreshCw,
  Trash2,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Input, Textarea, Select } from '@/components/common/Input';
import { Modal, ConfirmModal } from '@/components/common/Modal';
import { Card } from '@/components/common/Card';
import { Tabs, Tab } from '@/components/common/Tabs';
import { TagInput } from '@/components/common/TagInput';
import { exportAllData, importAllData, db } from '@/db';
import { getAvailableModels } from '@/services/ai';
import type { PromptType } from '@/types';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'ai' | 'prompts' | 'data'>('general');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)}>
          <Tab value="general" label="General" icon={<Settings className="w-4 h-4" />} />
          <Tab value="editor" label="Editor" icon={<Type className="w-4 h-4" />} />
          <Tab value="ai" label="AI Settings" icon={<Cpu className="w-4 h-4" />} />
          <Tab value="prompts" label="Prompts" icon={<RefreshCw className="w-4 h-4" />} />
          <Tab value="data" label="Data & Backup" icon={<Download className="w-4 h-4" />} />
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'editor' && <EditorSettings />}
          {activeTab === 'ai' && <AISettings />}
          {activeTab === 'prompts' && <PromptsSettings />}
          {activeTab === 'data' && <DataSettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const { settings, updateSettings } = useStore();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Appearance</h3>
        <div className="space-y-4">
          <Select
            label="Theme"
            value={settings?.theme || 'dark'}
            onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Auto-save</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings?.autoSave ?? true}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Enable auto-save</span>
          </label>
          <Select
            label="Auto-save interval"
            value={String(settings?.autoSaveInterval || 30000)}
            onChange={(e) => updateSettings({ autoSaveInterval: Number(e.target.value) })}
            options={[
              { value: '10000', label: '10 seconds' },
              { value: '30000', label: '30 seconds' },
              { value: '60000', label: '1 minute' },
              { value: '300000', label: '5 minutes' },
            ]}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Writing Tools</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings?.spellCheck ?? true}
              onChange={(e) => updateSettings({ spellCheck: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Enable spell check</span>
          </label>
        </div>
      </Card>
    </div>
  );
}

function EditorSettings() {
  const { settings, updateEditorSettings } = useStore();
  const editorSettings = settings?.editorSettings;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Typography</h3>
        <div className="space-y-4">
          <Select
            label="Font Family"
            value={editorSettings?.fontFamily || 'Georgia, serif'}
            onChange={(e) => updateEditorSettings({ fontFamily: e.target.value })}
            options={[
              { value: 'Georgia, serif', label: 'Georgia (Serif)' },
              { value: "'Times New Roman', serif", label: 'Times New Roman' },
              { value: 'system-ui, sans-serif', label: 'System UI (Sans)' },
              { value: "'Courier New', monospace", label: 'Courier (Monospace)' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Font Size: {editorSettings?.fontSize || 16}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={editorSettings?.fontSize || 16}
              onChange={(e) => updateEditorSettings({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Line Height: {editorSettings?.lineHeight || 1.8}
            </label>
            <input
              type="range"
              min="1.2"
              max="2.5"
              step="0.1"
              value={editorSettings?.lineHeight || 1.8}
              onChange={(e) => updateEditorSettings({ lineHeight: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editorSettings?.dyslexiaFont || false}
              onChange={(e) => updateEditorSettings({ dyslexiaFont: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Use dyslexia-friendly font (OpenDyslexic)</span>
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Layout</h3>
        <div className="space-y-4">
          <Select
            label="Page Width"
            value={editorSettings?.pageWidth || 'medium'}
            onChange={(e) => updateEditorSettings({ pageWidth: e.target.value as 'narrow' | 'medium' | 'wide' | 'full' })}
            options={[
              { value: 'narrow', label: 'Narrow' },
              { value: 'medium', label: 'Medium' },
              { value: 'wide', label: 'Wide' },
              { value: 'full', label: 'Full Width' },
            ]}
          />
          <Select
            label="Editor Theme"
            value={editorSettings?.theme || 'dark'}
            onChange={(e) => updateEditorSettings({ theme: e.target.value as 'light' | 'dark' | 'sepia' })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'sepia', label: 'Sepia' },
            ]}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Writing Modes</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editorSettings?.typewriterMode || false}
              onChange={(e) => updateEditorSettings({ typewriterMode: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Typewriter mode (keep cursor centered)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editorSettings?.showWordCount || true}
              onChange={(e) => updateEditorSettings({ showWordCount: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Show word count in editor</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editorSettings?.showLineNumbers || false}
              onChange={(e) => updateEditorSettings({ showLineNumbers: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">Show line numbers</span>
          </label>
        </div>
      </Card>
    </div>
  );
}

function AISettings() {
  const { settings, updateAISettings } = useStore();
  const aiSettings = settings?.aiSettings;
  const [apiKey, setApiKey] = useState(aiSettings?.apiKey || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (aiSettings?.apiKey) {
      loadModels();
    }
  }, [aiSettings?.apiKey]);

  const loadModels = async () => {
    if (!aiSettings?.apiKey) return;
    try {
      const models = await getAvailableModels(aiSettings.apiKey);
      setAvailableModels(models.slice(0, 50).map((m) => ({ id: m.id, name: m.name })));
    } catch {
      // Ignore errors
    }
  };

  const handleSaveApiKey = () => {
    updateAISettings({ apiKey });
  };

  const testConnection = async () => {
    if (!apiKey) return;
    setTestStatus('testing');
    try {
      await getAvailableModels(apiKey);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">OpenRouter API</h3>
        <div className="space-y-4">
          <div>
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              leftIcon={<Key className="w-4 h-4" />}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Get your API key from{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                openrouter.ai
              </a>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveApiKey} disabled={apiKey === aiSettings?.apiKey}>
              Save API Key
            </Button>
            <Button variant="secondary" onClick={testConnection} disabled={!apiKey}>
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : testStatus === 'success' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : testStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Model Settings</h3>
        <div className="space-y-4">
          <Select
            label="Default Model"
            value={aiSettings?.defaultModel || 'anthropic/claude-3.5-sonnet'}
            onChange={(e) => updateAISettings({ defaultModel: e.target.value })}
            options={[
              { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
              { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
              { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
              { value: 'openai/gpt-4o', label: 'GPT-4o' },
              { value: 'google/gemini-pro', label: 'Gemini Pro' },
              { value: 'meta-llama/llama-3-70b-instruct', label: 'Llama 3 70B' },
              ...availableModels
                .filter((m) => !['anthropic/claude-3.5-sonnet', 'anthropic/claude-3-opus', 'openai/gpt-4-turbo', 'openai/gpt-4o', 'google/gemini-pro', 'meta-llama/llama-3-70b-instruct'].includes(m.id))
                .map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Generation Parameters</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Temperature: {aiSettings?.temperature || 0.7}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={aiSettings?.temperature || 0.7}
              onChange={(e) => updateAISettings({ temperature: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-[var(--text-muted)]">
              Lower = more focused, Higher = more creative
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Max Tokens: {aiSettings?.maxTokens || 4096}
            </label>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={aiSettings?.maxTokens || 4096}
              onChange={(e) => updateAISettings({ maxTokens: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Top P: {aiSettings?.topP || 1}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={aiSettings?.topP || 1}
              onChange={(e) => updateAISettings({ topP: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function PromptsSettings() {
  const { prompts, createPrompt, updatePrompt, deletePrompt } = useStore();
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [showNewPrompt, setShowNewPrompt] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Custom Prompts</h3>
        <Button onClick={() => setShowNewPrompt(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Prompt
        </Button>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-[var(--text-primary)]">{prompt.name}</h4>
                {prompt.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{prompt.description}</p>
                )}
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Type: {prompt.type} {prompt.isDefault && '(Default)'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingPrompt(prompt.id)}>
                  Edit
                </Button>
                {!prompt.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePrompt(prompt.id)}
                    className="text-red-500"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit/Create Modal */}
      <PromptModal
        isOpen={showNewPrompt || editingPrompt !== null}
        onClose={() => {
          setShowNewPrompt(false);
          setEditingPrompt(null);
        }}
        prompt={editingPrompt ? prompts.find((p) => p.id === editingPrompt) : undefined}
        onSave={(data) => {
          if (editingPrompt) {
            updatePrompt(editingPrompt, data);
          } else {
            createPrompt(data);
          }
          setShowNewPrompt(false);
          setEditingPrompt(null);
        }}
      />
    </div>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: { name: string; description?: string; content: string; type: string };
  onSave: (data: { name: string; description?: string; content: string; type: PromptType }) => void;
}

function PromptModal({ isOpen, onClose, prompt, onSave }: PromptModalProps) {
  const [name, setName] = useState(prompt?.name || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [type, setType] = useState(prompt?.type || 'custom');

  useEffect(() => {
    if (prompt) {
      setName(prompt.name);
      setDescription(prompt.description || '');
      setContent(prompt.content);
      setType(prompt.type);
    } else {
      setName('');
      setDescription('');
      setContent('');
      setType('custom');
    }
  }, [prompt]);

  const handleSave = () => {
    onSave({ name, description: description || undefined, content, type: type as PromptType });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={prompt ? 'Edit Prompt' : 'New Prompt'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !content.trim()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
        />
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { value: 'generation', label: 'Generation' },
            { value: 'summarization', label: 'Summarization' },
            { value: 'analysis', label: 'Analysis' },
            { value: 'chat', label: 'Chat' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
        <Textarea
          label="Prompt Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Enter your prompt template..."
        />
      </div>
    </Modal>
  );
}

function DataSettings() {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'done'>('idle');

  const handleExport = async () => {
    setExportStatus('exporting');
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scriptpro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('idle');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await importAllData(text);
          window.location.reload();
        } catch (error) {
          console.error('Import failed:', error);
          alert('Import failed. Please check the file format.');
        }
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    try {
      await db.delete();
      window.location.reload();
    } catch (error) {
      console.error('Clear data failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Backup & Restore</h3>
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Export all your data including novels, scenes, codex entries, and settings to a JSON file.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
              {exportStatus === 'exporting' ? 'Exporting...' : exportStatus === 'done' ? 'Done!' : 'Export Backup'}
            </Button>
            <Button variant="secondary" onClick={handleImport} leftIcon={<Upload className="w-4 h-4" />}>
              Import Backup
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-red-500/30">
        <h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Permanently delete all data from the application. This action cannot be undone.
          </p>
          <Button
            variant="danger"
            onClick={() => setShowClearConfirm(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Clear All Data
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Storage Info</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          All your data is stored locally in your browser using IndexedDB. No data is sent to any server
          unless you use the AI features with your own API key.
        </p>
      </Card>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearData}
        title="Clear All Data"
        message="Are you sure you want to delete ALL data? This includes all novels, scenes, codex entries, and settings. This action cannot be undone."
        confirmText="Delete Everything"
        variant="danger"
      />
    </div>
  );
}
