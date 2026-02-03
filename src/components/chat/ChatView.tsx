import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Settings2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  FileText,
  BookOpen,
  Users,
  Loader2,
  Eye,
  RefreshCw,
  Download,
  StickyNote,
  User,
  ListChecks,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input, Textarea, Select } from '@/components/common/Input';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/common/Dropdown';
import { AIService, buildContext, buildFullPrompt, estimateTokens } from '@/services/ai';
import type { ChatConversation, ChatMessage, CodexEntryType } from '@/types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function ChatView() {
  const {
    currentNovelId,
    currentSceneId,
    chatConversations,
    chatPersonas,
    prompts,
    currentConversationId,
    selectConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    addMessage,
    settings,
    scenes,
    chapters,
    acts,
    codexEntries,
    snippets,
    novels,
    createSnippet,
    createCodexEntry,
    updateScene,
  } = useStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extractedId, setExtractedId] = useState<string | null>(null);

  // Extract handlers
  const handleExtractToSnippet = async (content: string) => {
    if (!currentNovelId) return;
    await createSnippet(currentNovelId, {
      title: 'Extracted from Chat',
      content,
      type: 'note',
      tags: ['ai-generated'],
      isPinned: false,
    });
    setExtractedId('snippet');
    setTimeout(() => setExtractedId(null), 2000);
  };

  const handleExtractToCodex = async (content: string, type: 'character' | 'location' | 'object' | 'lore') => {
    if (!currentNovelId) return;
    // Try to extract a name from the first line
    const lines = content.split('\n');
    const name = lines[0].replace(/^[#\-\*\s]+/, '').slice(0, 50) || 'New Entry';
    const description = lines.slice(1).join('\n').trim();

    await createCodexEntry(currentNovelId, {
      type,
      name,
      description,
      aliases: [],
      tags: ['ai-generated'],
      customDetails: [],
      progressions: [],
      relations: [],
      mentions: [],
      trackingSettings: { includeInAI: true, trackAppearances: true, autoDetect: false },
      isGlobal: false,
    });
    setExtractedId('codex');
    setTimeout(() => setExtractedId(null), 2000);
  };

  const handleExtractToBeats = async (content: string) => {
    const currentScene = scenes.find(s => s.id === currentSceneId);
    if (!currentScene) return;

    // Parse beats from content (each line is a beat)
    const beatLines = content.split('\n').filter(line => line.trim());
    const newBeats = beatLines.slice(0, 10).map((line, index) => ({
      id: uuidv4(),
      content: line.replace(/^[\d\.\-\*]+\s*/, '').trim(),
      order: (currentScene.beats?.length || 0) + index,
      isCompleted: false,
    }));

    await updateScene(currentScene.id, {
      beats: [...(currentScene.beats || []), ...newBeats],
    });
    setExtractedId('beats');
    setTimeout(() => setExtractedId(null), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentConversation = chatConversations.find((c) => c.id === currentConversationId);
  const currentNovel = novels.find((n) => n.id === currentNovelId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentConversation || !settings?.aiSettings.apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    await addMessage(currentConversation.id, {
      role: 'user',
      content: userMessage,
    });

    try {
      const aiService = new AIService(settings.aiSettings.apiKey, settings.aiSettings);

      // Get the prompt
      const prompt = prompts.find((p) => p.id === currentConversation.promptId) || prompts[0];
      const persona = chatPersonas.find((p) => p.id === currentConversation.personaId);

      // Build context
      const context = buildContext(
        prompt,
        currentConversation.contextSettings,
        {
          scenes,
          chapters,
          acts,
          codexEntries,
          snippets,
          novelTitle: currentNovel?.title,
          novelDescription: currentNovel?.description,
        }
      );

      // Build messages
      const systemPrompt = persona?.systemPrompt || prompt.content;
      const messages = [
        { role: 'system' as const, content: systemPrompt + (context ? '\n\n---\n\n' + context : '') },
        ...currentConversation.messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: userMessage },
      ];

      // Send to AI
      const response = await aiService.chat(messages, {
        model: currentConversation.modelId,
      });

      // Add assistant message
      await addMessage(currentConversation.id, {
        role: 'assistant',
        content: response.content,
      });
    } catch (error) {
      console.error('AI request failed:', error);
      await addMessage(currentConversation.id, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async (data: { title: string; promptId: string; personaId: string }) => {
    if (!currentNovelId) return;

    const conversation = await createConversation(currentNovelId, {
      title: data.title || 'New Chat',
      promptId: data.promptId || undefined,
      personaId: data.personaId || undefined,
    });

    selectConversation(conversation.id);
    setShowNewChatModal(false);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentNovelId) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-6 h-6" />}
        title="No novel selected"
        description="Create or select a novel to start chatting"
      />
    );
  }

  return (
    <div className="h-full flex">
      {/* Conversation List */}
      <div className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-color)]">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setShowNewChatModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chatConversations.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No conversations yet
            </p>
          ) : (
            chatConversations
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-indigo-500/10 text-indigo-500'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate flex-1">
                      {conversation.title}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {conversation.messages.length} messages
                  </p>
                </button>
              ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {currentConversation.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {currentConversation.modelId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showContextPanel ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowContextPanel(!showContextPanel)}
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  Context
                </Button>
                <Dropdown
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  }
                  align="right"
                >
                  <DropdownItem
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={() => updateConversation(currentConversation.id, { messages: [] })}
                  >
                    Clear Messages
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem
                    icon={<Trash2 className="w-4 h-4" />}
                    danger
                    onClick={() => {
                      deleteConversation(currentConversation.id);
                      selectConversation(null);
                    }}
                  >
                    Delete Chat
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="w-12 h-12 text-indigo-500 mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Start a Conversation
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-md">
                    Ask questions about your story, brainstorm ideas, or get help with your writing.
                  </p>
                </div>
              ) : (
                currentConversation.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onCopy={() => handleCopy(message.id, message.content)}
                    isCopied={copiedId === message.id}
                    onExtractToSnippet={() => handleExtractToSnippet(message.content)}
                    onExtractToCodex={(type) => handleExtractToCodex(message.content, type)}
                    onExtractToBeats={() => handleExtractToBeats(message.content)}
                    extractedId={extractedId}
                    hasCurrentScene={!!currentSceneId}
                  />
                ))
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
              {!settings?.aiSettings.apiKey && (
                <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-500">
                    Please add your OpenRouter API key in Settings to use AI features.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading || !settings?.aiSettings.apiKey}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || !settings?.aiSettings.apiKey}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare className="w-6 h-6" />}
            title="No chat selected"
            description="Select a conversation or start a new one"
            action={{
              label: 'New Chat',
              onClick: () => setShowNewChatModal(true),
            }}
          />
        )}
      </div>

      {/* Context Panel */}
      {showContextPanel && currentConversation && (
        <ContextPanel
          conversation={currentConversation}
          onClose={() => setShowContextPanel(false)}
          onUpdate={(settings) => updateConversation(currentConversation.id, { contextSettings: settings })}
        />
      )}

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSubmit={handleNewChat}
        prompts={prompts}
        personas={chatPersonas}
      />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy: () => void;
  isCopied: boolean;
  onExtractToSnippet: () => void;
  onExtractToCodex: (type: 'character' | 'location' | 'object' | 'lore') => void;
  onExtractToBeats: () => void;
  extractedId: string | null;
  hasCurrentScene: boolean;
}

function MessageBubble({
  message,
  onCopy,
  isCopied,
  onExtractToSnippet,
  onExtractToCodex,
  onExtractToBeats,
  extractedId,
  hasCurrentScene,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-indigo-500 text-white'
            : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        <div className={`flex items-center justify-between mt-2 ${isUser ? 'text-indigo-200' : 'text-[var(--text-muted)]'}`}>
          <span className="text-xs">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          <div className="flex items-center gap-1">
            {/* Extract dropdown - only for assistant messages */}
            {!isUser && (
              <Dropdown
                trigger={
                  <button className="p-1 rounded hover:bg-black/10">
                    {extractedId ? <Check className="w-3 h-3 text-green-500" /> : <Download className="w-3 h-3" />}
                  </button>
                }
                align="right"
              >
                <DropdownItem
                  icon={<StickyNote className="w-4 h-4" />}
                  onClick={onExtractToSnippet}
                >
                  Save as Snippet
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  icon={<User className="w-4 h-4" />}
                  onClick={() => onExtractToCodex('character')}
                >
                  Save as Character
                </DropdownItem>
                <DropdownItem
                  icon={<FileText className="w-4 h-4" />}
                  onClick={() => onExtractToCodex('location')}
                >
                  Save as Location
                </DropdownItem>
                <DropdownItem
                  icon={<BookOpen className="w-4 h-4" />}
                  onClick={() => onExtractToCodex('lore')}
                >
                  Save as Lore
                </DropdownItem>
                {hasCurrentScene && (
                  <>
                    <DropdownDivider />
                    <DropdownItem
                      icon={<ListChecks className="w-4 h-4" />}
                      onClick={onExtractToBeats}
                    >
                      Add as Scene Beats
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            )}
            <button
              onClick={onCopy}
              className="p-1 rounded hover:bg-black/10"
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContextPanelProps {
  conversation: ChatConversation;
  onClose: () => void;
  onUpdate: (settings: ChatConversation['contextSettings']) => void;
}

function ContextPanel({ conversation, onClose, onUpdate }: ContextPanelProps) {
  const { acts, chapters, scenes, codexEntries, snippets } = useStore();
  const [localSettings, setLocalSettings] = useState(conversation.contextSettings);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  const toggleScene = (sceneId: string) => {
    const newScenes = localSettings.includeScenes.includes(sceneId)
      ? localSettings.includeScenes.filter((id) => id !== sceneId)
      : [...localSettings.includeScenes, sceneId];
    setLocalSettings({ ...localSettings, includeScenes: newScenes });
  };

  const toggleCodexType = (type: CodexEntryType) => {
    const types = localSettings.includeCodex.types;
    const newTypes = types.includes(type)
      ? types.filter((t) => t !== type)
      : [...types, type];
    setLocalSettings({
      ...localSettings,
      includeCodex: { ...localSettings.includeCodex, types: newTypes },
    });
  };

  return (
    <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Context Settings</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          &times;
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Include Outline */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localSettings.includeOutline}
            onChange={(e) => setLocalSettings({ ...localSettings, includeOutline: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-[var(--text-secondary)]">Include story outline</span>
        </label>

        {/* Codex Types */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Codex Types
          </p>
          <div className="space-y-1">
            {(['character', 'location', 'object', 'lore', 'subplot', 'other'] as CodexEntryType[]).map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.includeCodex.types.includes(type)}
                  onChange={() => toggleCodexType(type)}
                  className="rounded"
                />
                <span className="text-sm text-[var(--text-secondary)] capitalize">{type}s</span>
              </label>
            ))}
          </div>
        </div>

        {/* Scenes */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Include Scenes
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {scenes.filter((s) => !s.isArchived).slice(0, 20).map((scene) => (
              <label key={scene.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.includeScenes.includes(scene.id)}
                  onChange={() => toggleScene(scene.id)}
                  className="rounded"
                />
                <span className="text-sm text-[var(--text-secondary)] truncate">{scene.title}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border-color)]">
        <Button onClick={handleSave} className="w-full">
          Apply Changes
        </Button>
      </div>
    </div>
  );
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; promptId: string; personaId: string }) => void;
  prompts: { id: string; name: string }[];
  personas: { id: string; name: string }[];
}

function NewChatModal({ isOpen, onClose, onSubmit, prompts, personas }: NewChatModalProps) {
  const [title, setTitle] = useState('');
  const [promptId, setPromptId] = useState('');
  const [personaId, setPersonaId] = useState('');

  const handleSubmit = () => {
    onSubmit({ title, promptId, personaId });
    setTitle('');
    setPromptId('');
    setPersonaId('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Chat"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Chat</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chat title..."
        />
        <Select
          label="Prompt Template"
          value={promptId}
          onChange={(e) => setPromptId(e.target.value)}
          options={[
            { value: '', label: 'Default' },
            ...prompts.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <Select
          label="Persona"
          value={personaId}
          onChange={(e) => setPersonaId(e.target.value)}
          options={[
            { value: '', label: 'None' },
            ...personas.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      </div>
    </Modal>
  );
}
