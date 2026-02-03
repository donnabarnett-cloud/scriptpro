import type {
  Scene,
  Chapter,
  Act,
  CodexEntry,
  Snippet,
  Prompt,
  ChatMessage,
  AISettings,
  ChatContextSettings,
} from '@/types';

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ContextData {
  scenes: Scene[];
  chapters: Chapter[];
  acts: Act[];
  codexEntries: CodexEntry[];
  snippets: Snippet[];
  currentScene?: Scene;
  currentChapter?: Chapter;
  novelTitle?: string;
  novelDescription?: string;
}

// OpenRouter API integration
export class AIService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private defaultSettings: AISettings;

  constructor(apiKey: string, settings: AISettings) {
    this.apiKey = apiKey;
    this.defaultSettings = settings;
  }

  async chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    const model = options.model || this.defaultSettings.defaultModel;
    const temperature = options.temperature ?? this.defaultSettings.temperature;
    const maxTokens = options.maxTokens ?? this.defaultSettings.maxTokens;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ScriptPro',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: options.topP ?? this.defaultSettings.topP,
        frequency_penalty: options.frequencyPenalty ?? this.defaultSettings.frequencyPenalty,
        presence_penalty: options.presencePenalty ?? this.defaultSettings.presencePenalty,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || 'AI request failed');
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async *streamChat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options: AIRequestOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.defaultSettings.defaultModel;
    const temperature = options.temperature ?? this.defaultSettings.temperature;
    const maxTokens = options.maxTokens ?? this.defaultSettings.maxTokens;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ScriptPro',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || 'AI request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

// Build context string from data
export function buildContext(
  prompt: Prompt,
  contextSettings: ChatContextSettings,
  contextData: ContextData
): string {
  const parts: string[] = [];

  // Novel info
  if (contextData.novelTitle) {
    parts.push(`# Novel: ${contextData.novelTitle}`);
    if (contextData.novelDescription) {
      parts.push(contextData.novelDescription);
    }
    parts.push('');
  }

  // Outline
  if (prompt.parameters.includeOutline || contextSettings.includeOutline) {
    const outline = buildOutline(contextData.acts, contextData.chapters, contextData.scenes);
    if (outline) {
      parts.push('## Story Outline');
      parts.push(outline);
      parts.push('');
    }
  }

  // Codex entries
  if (prompt.parameters.includeCodex || contextSettings.includeCodex.entries.length > 0) {
    const codexContext = buildCodexContext(
      contextData.codexEntries,
      contextSettings.includeCodex
    );
    if (codexContext) {
      parts.push('## World Information');
      parts.push(codexContext);
      parts.push('');
    }
  }

  // Previous scenes
  if (prompt.parameters.includePreviousScenes > 0) {
    const previousScenes = getPreviousScenes(
      contextData.scenes,
      contextData.currentScene,
      prompt.parameters.includePreviousScenes
    );
    if (previousScenes.length > 0) {
      parts.push('## Previous Scenes');
      previousScenes.forEach((scene) => {
        parts.push(`### ${scene.title}`);
        parts.push(stripHtml(scene.content));
        parts.push('');
      });
    }
  }

  // Current scene
  if (prompt.parameters.includeCurrentScene && contextData.currentScene) {
    parts.push('## Current Scene');
    parts.push(`### ${contextData.currentScene.title}`);
    if (contextData.currentScene.summary) {
      parts.push(`Summary: ${contextData.currentScene.summary}`);
    }
    if (contextData.currentScene.beats && contextData.currentScene.beats.length > 0) {
      parts.push('Beats:');
      contextData.currentScene.beats.forEach((beat) => {
        parts.push(`- ${beat.content}`);
      });
    }
    parts.push('');
    parts.push('Content:');
    parts.push(stripHtml(contextData.currentScene.content));
    parts.push('');
  }

  // Snippets
  if (contextSettings.includeSnippets.length > 0) {
    const selectedSnippets = contextData.snippets.filter((s) =>
      contextSettings.includeSnippets.includes(s.id)
    );
    if (selectedSnippets.length > 0) {
      parts.push('## Notes & Snippets');
      selectedSnippets.forEach((snippet) => {
        parts.push(`### ${snippet.title}`);
        parts.push(snippet.content);
        parts.push('');
      });
    }
  }

  return parts.join('\n');
}

function buildOutline(acts: Act[], chapters: Chapter[], scenes: Scene[]): string {
  const parts: string[] = [];

  acts.sort((a, b) => a.order - b.order).forEach((act) => {
    parts.push(`### ${act.title}`);
    if (act.description) {
      parts.push(act.description);
    }

    const actChapters = chapters
      .filter((c) => c.actId === act.id)
      .sort((a, b) => a.order - b.order);

    actChapters.forEach((chapter) => {
      parts.push(`#### ${chapter.title}`);

      const chapterScenes = scenes
        .filter((s) => s.chapterId === chapter.id && !s.isArchived)
        .sort((a, b) => a.order - b.order);

      chapterScenes.forEach((scene) => {
        const status = scene.status === 'final' ? '[Complete]' : scene.status === 'draft' ? '[Draft]' : '[Outline]';
        parts.push(`- ${scene.title} ${status} (${scene.wordCount} words)`);
        if (scene.summary) {
          parts.push(`  ${scene.summary}`);
        }
      });
    });
    parts.push('');
  });

  return parts.join('\n');
}

function buildCodexContext(
  entries: CodexEntry[],
  settings: ChatContextSettings['includeCodex']
): string {
  const filteredEntries = entries.filter((entry) => {
    if (!entry.trackingSettings.includeInAI) return false;
    if (settings.entries.length > 0 && !settings.entries.includes(entry.id)) return false;
    if (settings.types.length > 0 && !settings.types.includes(entry.type)) return false;
    if (settings.categories.length > 0 && entry.categoryId && !settings.categories.includes(entry.categoryId)) return false;
    if (settings.tags.length > 0 && !settings.tags.some((tag) => entry.tags.includes(tag))) return false;
    return true;
  });

  if (filteredEntries.length === 0) return '';

  const parts: string[] = [];
  const byType: Record<string, CodexEntry[]> = {};

  filteredEntries.forEach((entry) => {
    if (!byType[entry.type]) byType[entry.type] = [];
    byType[entry.type].push(entry);
  });

  Object.entries(byType).forEach(([type, typeEntries]) => {
    parts.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}s`);
    typeEntries.forEach((entry) => {
      parts.push(`**${entry.name}**${entry.aliases.length > 0 ? ` (aka ${entry.aliases.join(', ')})` : ''}`);
      if (entry.description) {
        parts.push(entry.description);
      }
      entry.customDetails.forEach((detail) => {
        if (detail.value) {
          parts.push(`- ${detail.label}: ${detail.value}`);
        }
      });
      parts.push('');
    });
  });

  return parts.join('\n');
}

function getPreviousScenes(
  scenes: Scene[],
  currentScene: Scene | undefined,
  count: number
): Scene[] {
  if (!currentScene) return [];

  const orderedScenes = scenes
    .filter((s) => !s.isArchived && !s.excludeFromAI)
    .sort((a, b) => {
      // Sort by chapter then by scene order
      if (a.chapterId !== b.chapterId) {
        return a.chapterId.localeCompare(b.chapterId);
      }
      return a.order - b.order;
    });

  const currentIndex = orderedScenes.findIndex((s) => s.id === currentScene.id);
  if (currentIndex <= 0) return [];

  const startIndex = Math.max(0, currentIndex - count);
  return orderedScenes.slice(startIndex, currentIndex);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// Build the full prompt with context
export function buildFullPrompt(
  userMessage: string,
  systemPrompt: string,
  context: string
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

  // System message with context
  let systemContent = systemPrompt;
  if (context) {
    systemContent += '\n\n---\n\nHere is the context for this story:\n\n' + context;
  }
  messages.push({ role: 'system', content: systemContent });

  // User message
  messages.push({ role: 'user', content: userMessage });

  return messages;
}

// Estimate token count (rough approximation)
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Get available models from OpenRouter
export async function getAvailableModels(apiKey: string): Promise<{
  id: string;
  name: string;
  context_length: number;
  pricing: { prompt: string; completion: string };
}[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }

  const data = await response.json();
  return data.data || [];
}

// Queue for offline requests
interface QueuedRequest {
  id: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  options: AIRequestOptions;
  timestamp: Date;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private storageKey = 'ai_request_queue';

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueue() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  add(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options: AIRequestOptions
  ): string {
    const id = crypto.randomUUID();
    this.queue.push({
      id,
      messages,
      options,
      timestamp: new Date(),
    });
    this.saveQueue();
    return id;
  }

  getAll(): QueuedRequest[] {
    return [...this.queue];
  }

  remove(id: string) {
    this.queue = this.queue.filter((r) => r.id !== id);
    this.saveQueue();
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();
