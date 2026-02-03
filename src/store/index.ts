import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db';
import type {
  Novel,
  Act,
  Chapter,
  Scene,
  SceneLabel,
  CodexEntry,
  CodexCategory,
  Snippet,
  Prompt,
  ChatConversation,
  ChatMessage,
  ChatPersona,
  AppSettings,
  EditorSettings,
  AISettings,
  Panel,
  RevisionHistory,
  Series,
  PenName,
  NovelTemplate,
  CodexEntryType,
  POVType,
  TenseType,
  SceneStatus,
} from '@/types';

interface AppState {
  // Current selections
  currentNovelId: string | null;
  currentActId: string | null;
  currentChapterId: string | null;
  currentSceneId: string | null;
  currentCodexEntryId: string | null;
  currentConversationId: string | null;

  // Data
  novels: Novel[];
  acts: Act[];
  chapters: Chapter[];
  scenes: Scene[];
  sceneLabels: SceneLabel[];
  codexEntries: CodexEntry[];
  codexCategories: CodexCategory[];
  snippets: Snippet[];
  prompts: Prompt[];
  chatConversations: ChatConversation[];
  chatPersonas: ChatPersona[];
  series: Series[];
  penNames: PenName[];
  templates: NovelTemplate[];
  revisionHistory: RevisionHistory[];

  // Settings
  settings: AppSettings | null;

  // UI State
  sidebarOpen: boolean;
  panels: Panel[];
  focusMode: boolean;
  activeView: 'write' | 'plan' | 'codex' | 'chat' | 'review' | 'settings';
  planningView: 'grid' | 'matrix' | 'outline';
  codexFilter: {
    type: CodexEntryType | 'all';
    category: string | null;
    tags: string[];
    search: string;
  };
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveView: (view: AppState['activeView']) => void;
  setPlanningView: (view: AppState['planningView']) => void;
  toggleSidebar: () => void;
  toggleFocusMode: () => void;

  // Novel actions
  createNovel: (data: Partial<Novel>, templateId?: string) => Promise<Novel>;
  updateNovel: (id: string, data: Partial<Novel>) => Promise<void>;
  deleteNovel: (id: string) => Promise<void>;
  selectNovel: (id: string | null) => Promise<void>;
  loadNovelData: (novelId: string) => Promise<void>;

  // Act actions
  createAct: (novelId: string, data: Partial<Act>) => Promise<Act>;
  updateAct: (id: string, data: Partial<Act>) => Promise<void>;
  deleteAct: (id: string) => Promise<void>;
  reorderActs: (novelId: string, actIds: string[]) => Promise<void>;

  // Chapter actions
  createChapter: (novelId: string, actId: string, data: Partial<Chapter>) => Promise<Chapter>;
  updateChapter: (id: string, data: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  moveChapter: (id: string, newActId: string, newOrder: number) => Promise<void>;

  // Scene actions
  createScene: (novelId: string, chapterId: string, data: Partial<Scene>) => Promise<Scene>;
  updateScene: (id: string, data: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  archiveScene: (id: string) => Promise<void>;
  restoreScene: (id: string) => Promise<void>;
  moveScene: (id: string, newChapterId: string, newOrder: number) => Promise<void>;
  selectScene: (id: string | null) => void;

  // Scene Label actions
  createSceneLabel: (novelId: string, data: Partial<SceneLabel>) => Promise<SceneLabel>;
  updateSceneLabel: (id: string, data: Partial<SceneLabel>) => Promise<void>;
  deleteSceneLabel: (id: string) => Promise<void>;

  // Codex actions
  createCodexEntry: (novelId: string, data: Partial<CodexEntry>) => Promise<CodexEntry>;
  updateCodexEntry: (id: string, data: Partial<CodexEntry>) => Promise<void>;
  deleteCodexEntry: (id: string) => Promise<void>;
  selectCodexEntry: (id: string | null) => void;
  setCodexFilter: (filter: Partial<AppState['codexFilter']>) => void;

  // Codex Category actions
  createCodexCategory: (novelId: string, data: Partial<CodexCategory>) => Promise<CodexCategory>;
  updateCodexCategory: (id: string, data: Partial<CodexCategory>) => Promise<void>;
  deleteCodexCategory: (id: string) => Promise<void>;

  // Snippet actions
  createSnippet: (novelId: string, data: Partial<Snippet>) => Promise<Snippet>;
  updateSnippet: (id: string, data: Partial<Snippet>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;

  // Prompt actions
  createPrompt: (data: Partial<Prompt>) => Promise<Prompt>;
  updatePrompt: (id: string, data: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;

  // Chat actions
  createConversation: (novelId: string, data: Partial<ChatConversation>) => Promise<ChatConversation>;
  updateConversation: (id: string, data: Partial<ChatConversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  selectConversation: (id: string | null) => void;

  // Chat Persona actions
  createPersona: (data: Partial<ChatPersona>) => Promise<ChatPersona>;
  updatePersona: (id: string, data: Partial<ChatPersona>) => Promise<void>;
  deletePersona: (id: string) => Promise<void>;

  // Series actions
  createSeries: (data: Partial<Series>) => Promise<Series>;
  updateSeries: (id: string, data: Partial<Series>) => Promise<void>;
  deleteSeries: (id: string) => Promise<void>;

  // Pen Name actions
  createPenName: (data: Partial<PenName>) => Promise<PenName>;
  updatePenName: (id: string, data: Partial<PenName>) => Promise<void>;
  deletePenName: (id: string) => Promise<void>;

  // Revision History
  saveRevision: (entityType: 'scene' | 'chapter' | 'codex', entityId: string, novelId: string, content: string) => Promise<void>;
  getRevisions: (entityId: string) => RevisionHistory[];
  restoreRevision: (revisionId: string) => Promise<void>;

  // Settings actions
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;
  updateEditorSettings: (data: Partial<EditorSettings>) => Promise<void>;
  updateAISettings: (data: Partial<AISettings>) => Promise<void>;

  // Panel actions
  openPanel: (panel: Omit<Panel, 'id'>) => void;
  closePanel: (id: string) => void;
  pinPanel: (id: string) => void;
  unpinPanel: (id: string) => void;

  // Utility
  getNovelWordCount: (novelId: string) => number;
  getScenesByChapter: (chapterId: string) => Scene[];
  getChaptersByAct: (actId: string) => Chapter[];
}

export const useStore = create<AppState>()(
  immer((set, get) => ({
    // Initial state
    currentNovelId: null,
    currentActId: null,
    currentChapterId: null,
    currentSceneId: null,
    currentCodexEntryId: null,
    currentConversationId: null,

    novels: [],
    acts: [],
    chapters: [],
    scenes: [],
    sceneLabels: [],
    codexEntries: [],
    codexCategories: [],
    snippets: [],
    prompts: [],
    chatConversations: [],
    chatPersonas: [],
    series: [],
    penNames: [],
    templates: [],
    revisionHistory: [],

    settings: null,

    sidebarOpen: true,
    panels: [],
    focusMode: false,
    activeView: 'write',
    planningView: 'grid',
    codexFilter: {
      type: 'all',
      category: null,
      tags: [],
      search: '',
    },
    isLoading: false,
    isSaving: false,

    // Initialize app
    initialize: async () => {
      set({ isLoading: true });
      try {
        const [novels, prompts, personas, series, penNames, templates, settings] = await Promise.all([
          db.novels.toArray(),
          db.prompts.toArray(),
          db.chatPersonas.toArray(),
          db.series.toArray(),
          db.penNames.toArray(),
          db.novelTemplates.toArray(),
          db.appSettings.get('default'),
        ]);

        set({
          novels,
          prompts,
          chatPersonas: personas,
          series,
          penNames,
          templates,
          settings: settings || null,
          isLoading: false,
        });

        // Load last novel if exists
        if (settings?.recentNovels?.[0]) {
          await get().selectNovel(settings.recentNovels[0]);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        set({ isLoading: false });
      }
    },

    setActiveView: (view) => set({ activeView: view }),
    setPlanningView: (view) => set({ planningView: view }),
    toggleSidebar: () => set((state) => { state.sidebarOpen = !state.sidebarOpen; }),
    toggleFocusMode: () => set((state) => { state.focusMode = !state.focusMode; }),

    // Novel actions
    createNovel: async (data, templateId) => {
      const template = templateId ? get().templates.find(t => t.id === templateId) : null;

      const novel: Novel = {
        id: uuidv4(),
        title: data.title || 'Untitled Novel',
        subtitle: data.subtitle,
        description: data.description,
        coverImage: data.coverImage,
        penNameId: data.penNameId,
        seriesId: data.seriesId,
        seriesOrder: data.seriesOrder,
        pov: data.pov || 'third-person-limited',
        povCharacterId: data.povCharacterId,
        tense: data.tense || 'past',
        templateId: templateId,
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 0,
        targetWordCount: data.targetWordCount,
        status: 'draft',
        settings: data.settings || {
          showWordCount: true,
          autoSaveInterval: 30000,
          spellCheck: true,
          grammarCheck: false,
        },
      };

      await db.novels.put(novel);
      set((state) => { state.novels.push(novel); });

      // Create default labels
      const defaultLabels = template?.defaultLabels || [
        { name: 'Outline', color: '#6366f1' },
        { name: 'Draft', color: '#f59e0b' },
        { name: 'Revision', color: '#8b5cf6' },
        { name: 'Final', color: '#22c55e' },
      ];

      for (const label of defaultLabels) {
        await get().createSceneLabel(novel.id, label);
      }

      // Create structure from template
      if (template) {
        for (let actIndex = 0; actIndex < template.structure.acts.length; actIndex++) {
          const actTemplate = template.structure.acts[actIndex];
          const act = await get().createAct(novel.id, {
            title: actTemplate.title,
            order: actIndex,
          });

          for (let chapterIndex = 0; chapterIndex < actTemplate.chapters.length; chapterIndex++) {
            const chapterTemplate = actTemplate.chapters[chapterIndex];
            const chapter = await get().createChapter(novel.id, act.id, {
              title: chapterTemplate.title,
              order: chapterIndex,
            });

            for (let sceneIndex = 0; sceneIndex < chapterTemplate.scenes.length; sceneIndex++) {
              const sceneTemplate = chapterTemplate.scenes[sceneIndex];
              await get().createScene(novel.id, chapter.id, {
                title: sceneTemplate.title,
                order: sceneIndex,
              });
            }
          }
        }
      } else {
        // Create default structure
        const act = await get().createAct(novel.id, { title: 'Act 1', order: 0 });
        const chapter = await get().createChapter(novel.id, act.id, { title: 'Chapter 1', order: 0 });
        await get().createScene(novel.id, chapter.id, { title: 'Scene 1', order: 0 });
      }

      await get().selectNovel(novel.id);
      return novel;
    },

    updateNovel: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.novels.update(id, updatedData);
      set((state) => {
        const index = state.novels.findIndex(n => n.id === id);
        if (index !== -1) {
          Object.assign(state.novels[index], updatedData);
        }
      });
    },

    deleteNovel: async (id) => {
      await db.transaction('rw', [db.novels, db.acts, db.chapters, db.scenes, db.sceneLabels, db.codexEntries, db.codexCategories, db.snippets, db.chatConversations], async () => {
        await db.novels.delete(id);
        await db.acts.where('novelId').equals(id).delete();
        await db.chapters.where('novelId').equals(id).delete();
        await db.scenes.where('novelId').equals(id).delete();
        await db.sceneLabels.where('novelId').equals(id).delete();
        await db.codexEntries.where('novelId').equals(id).delete();
        await db.codexCategories.where('novelId').equals(id).delete();
        await db.snippets.where('novelId').equals(id).delete();
        await db.chatConversations.where('novelId').equals(id).delete();
      });
      set((state) => {
        state.novels = state.novels.filter(n => n.id !== id);
        if (state.currentNovelId === id) {
          state.currentNovelId = null;
          state.acts = [];
          state.chapters = [];
          state.scenes = [];
          state.sceneLabels = [];
          state.codexEntries = [];
          state.codexCategories = [];
          state.snippets = [];
          state.chatConversations = [];
        }
      });
    },

    selectNovel: async (id) => {
      if (id) {
        await get().loadNovelData(id);
        set({ currentNovelId: id });

        // Update recent novels
        const settings = get().settings;
        if (settings) {
          const recentNovels = [id, ...settings.recentNovels.filter(n => n !== id)].slice(0, 10);
          await get().updateSettings({ recentNovels });
        }
      } else {
        set({
          currentNovelId: null,
          currentActId: null,
          currentChapterId: null,
          currentSceneId: null,
          acts: [],
          chapters: [],
          scenes: [],
          sceneLabels: [],
          codexEntries: [],
          codexCategories: [],
          snippets: [],
          chatConversations: [],
        });
      }
    },

    loadNovelData: async (novelId) => {
      const [acts, chapters, scenes, labels, codexEntries, categories, snippets, conversations, history] = await Promise.all([
        db.acts.where('novelId').equals(novelId).sortBy('order'),
        db.chapters.where('novelId').equals(novelId).sortBy('order'),
        db.scenes.where('novelId').equals(novelId).toArray(),
        db.sceneLabels.where('novelId').equals(novelId).toArray(),
        db.codexEntries.where('novelId').equals(novelId).toArray(),
        db.codexCategories.where('novelId').equals(novelId).toArray(),
        db.snippets.where('novelId').equals(novelId).toArray(),
        db.chatConversations.where('novelId').equals(novelId).toArray(),
        db.revisionHistory.where('novelId').equals(novelId).toArray(),
      ]);

      // Sort scenes by order within their chapters
      scenes.sort((a, b) => a.order - b.order);

      set({
        acts,
        chapters,
        scenes,
        sceneLabels: labels,
        codexEntries,
        codexCategories: categories,
        snippets,
        chatConversations: conversations,
        revisionHistory: history,
        currentActId: acts[0]?.id || null,
        currentChapterId: chapters[0]?.id || null,
        currentSceneId: scenes.find(s => s.chapterId === chapters[0]?.id)?.id || null,
      });
    },

    // Act actions
    createAct: async (novelId, data) => {
      const acts = get().acts.filter(a => a.novelId === novelId);
      const act: Act = {
        id: uuidv4(),
        novelId,
        title: data.title || `Act ${acts.length + 1}`,
        description: data.description,
        order: data.order ?? acts.length,
        color: data.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.acts.put(act);
      set((state) => { state.acts.push(act); });
      return act;
    },

    updateAct: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.acts.update(id, updatedData);
      set((state) => {
        const index = state.acts.findIndex(a => a.id === id);
        if (index !== -1) {
          Object.assign(state.acts[index], updatedData);
        }
      });
    },

    deleteAct: async (id) => {
      const chapters = get().chapters.filter(c => c.actId === id);
      await db.transaction('rw', [db.acts, db.chapters, db.scenes], async () => {
        await db.acts.delete(id);
        for (const chapter of chapters) {
          await db.scenes.where('chapterId').equals(chapter.id).delete();
        }
        await db.chapters.where('actId').equals(id).delete();
      });
      set((state) => {
        const chapterIds = state.chapters.filter(c => c.actId === id).map(c => c.id);
        state.acts = state.acts.filter(a => a.id !== id);
        state.chapters = state.chapters.filter(c => c.actId !== id);
        state.scenes = state.scenes.filter(s => !chapterIds.includes(s.chapterId));
      });
    },

    reorderActs: async (novelId, actIds) => {
      await db.transaction('rw', db.acts, async () => {
        for (let i = 0; i < actIds.length; i++) {
          await db.acts.update(actIds[i], { order: i });
        }
      });
      set((state) => {
        for (let i = 0; i < actIds.length; i++) {
          const act = state.acts.find(a => a.id === actIds[i]);
          if (act) act.order = i;
        }
        state.acts.sort((a, b) => a.order - b.order);
      });
    },

    // Chapter actions
    createChapter: async (novelId, actId, data) => {
      const chapters = get().chapters.filter(c => c.actId === actId);
      const chapter: Chapter = {
        id: uuidv4(),
        novelId,
        actId,
        title: data.title || `Chapter ${chapters.length + 1}`,
        description: data.description,
        order: data.order ?? chapters.length,
        povCharacterId: data.povCharacterId,
        subtitle: data.subtitle,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.chapters.put(chapter);
      set((state) => { state.chapters.push(chapter); });
      return chapter;
    },

    updateChapter: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.chapters.update(id, updatedData);
      set((state) => {
        const index = state.chapters.findIndex(c => c.id === id);
        if (index !== -1) {
          Object.assign(state.chapters[index], updatedData);
        }
      });
    },

    deleteChapter: async (id) => {
      await db.transaction('rw', [db.chapters, db.scenes], async () => {
        await db.chapters.delete(id);
        await db.scenes.where('chapterId').equals(id).delete();
      });
      set((state) => {
        state.chapters = state.chapters.filter(c => c.id !== id);
        state.scenes = state.scenes.filter(s => s.chapterId !== id);
      });
    },

    moveChapter: async (id, newActId, newOrder) => {
      await db.chapters.update(id, { actId: newActId, order: newOrder, updatedAt: new Date() });
      set((state) => {
        const chapter = state.chapters.find(c => c.id === id);
        if (chapter) {
          chapter.actId = newActId;
          chapter.order = newOrder;
          chapter.updatedAt = new Date();
        }
      });
    },

    // Scene actions
    createScene: async (novelId, chapterId, data) => {
      const scenes = get().scenes.filter(s => s.chapterId === chapterId);
      const scene: Scene = {
        id: uuidv4(),
        novelId,
        chapterId,
        title: data.title || `Scene ${scenes.length + 1}`,
        content: data.content || '',
        summary: data.summary,
        order: data.order ?? scenes.length,
        wordCount: 0,
        status: data.status || 'outline',
        povCharacterId: data.povCharacterId,
        locationId: data.locationId,
        subtitle: data.subtitle,
        notes: data.notes,
        beats: data.beats || [],
        excludeFromAI: data.excludeFromAI || false,
        isArchived: false,
        labels: data.labels || [],
        markers: data.markers || [],
        sections: data.sections || [],
        manualReferences: data.manualReferences || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.scenes.put(scene);
      set((state) => { state.scenes.push(scene); });
      return scene;
    },

    updateScene: async (id, data) => {
      const scene = get().scenes.find(s => s.id === id);
      if (!scene) return;

      // Calculate word count if content changed
      if (data.content !== undefined) {
        data.wordCount = data.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
      }

      const updatedData = { ...data, updatedAt: new Date() };
      await db.scenes.update(id, updatedData);
      set((state) => {
        const index = state.scenes.findIndex(s => s.id === id);
        if (index !== -1) {
          Object.assign(state.scenes[index], updatedData);
        }
      });

      // Update novel word count
      const novelId = scene.novelId;
      const totalWords = get().scenes
        .filter(s => s.novelId === novelId && !s.isArchived)
        .reduce((sum, s) => sum + (s.id === id ? (data.wordCount || s.wordCount) : s.wordCount), 0);
      await get().updateNovel(novelId, { wordCount: totalWords });
    },

    deleteScene: async (id) => {
      await db.scenes.delete(id);
      set((state) => {
        state.scenes = state.scenes.filter(s => s.id !== id);
        if (state.currentSceneId === id) {
          state.currentSceneId = null;
        }
      });
    },

    archiveScene: async (id) => {
      await get().updateScene(id, { isArchived: true });
    },

    restoreScene: async (id) => {
      await get().updateScene(id, { isArchived: false });
    },

    moveScene: async (id, newChapterId, newOrder) => {
      await db.scenes.update(id, { chapterId: newChapterId, order: newOrder, updatedAt: new Date() });
      set((state) => {
        const scene = state.scenes.find(s => s.id === id);
        if (scene) {
          scene.chapterId = newChapterId;
          scene.order = newOrder;
          scene.updatedAt = new Date();
        }
      });
    },

    selectScene: (id) => set({ currentSceneId: id }),

    // Scene Label actions
    createSceneLabel: async (novelId, data) => {
      const label: SceneLabel = {
        id: uuidv4(),
        novelId,
        name: data.name || 'New Label',
        color: data.color || '#6366f1',
        description: data.description,
      };
      await db.sceneLabels.put(label);
      set((state) => { state.sceneLabels.push(label); });
      return label;
    },

    updateSceneLabel: async (id, data) => {
      await db.sceneLabels.update(id, data);
      set((state) => {
        const index = state.sceneLabels.findIndex(l => l.id === id);
        if (index !== -1) {
          Object.assign(state.sceneLabels[index], data);
        }
      });
    },

    deleteSceneLabel: async (id) => {
      await db.sceneLabels.delete(id);
      set((state) => {
        state.sceneLabels = state.sceneLabels.filter(l => l.id !== id);
        // Remove label from all scenes
        state.scenes.forEach(scene => {
          scene.labels = scene.labels.filter(l => l !== id);
        });
      });
    },

    // Codex actions
    createCodexEntry: async (novelId, data) => {
      const entry: CodexEntry = {
        id: uuidv4(),
        novelId,
        type: data.type || 'character',
        name: data.name || 'New Entry',
        aliases: data.aliases || [],
        description: data.description,
        thumbnail: data.thumbnail,
        color: data.color,
        tags: data.tags || [],
        categoryId: data.categoryId,
        customDetails: data.customDetails || [],
        progressions: data.progressions || [],
        relations: data.relations || [],
        mentions: [],
        trackingSettings: data.trackingSettings || {
          includeInAI: true,
          trackAppearances: true,
          autoDetect: true,
        },
        isGlobal: data.isGlobal || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.codexEntries.put(entry);
      set((state) => { state.codexEntries.push(entry); });
      return entry;
    },

    updateCodexEntry: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.codexEntries.update(id, updatedData);
      set((state) => {
        const index = state.codexEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          Object.assign(state.codexEntries[index], updatedData);
        }
      });
    },

    deleteCodexEntry: async (id) => {
      await db.codexEntries.delete(id);
      set((state) => {
        state.codexEntries = state.codexEntries.filter(e => e.id !== id);
        if (state.currentCodexEntryId === id) {
          state.currentCodexEntryId = null;
        }
      });
    },

    selectCodexEntry: (id) => set({ currentCodexEntryId: id }),

    setCodexFilter: (filter) => set((state) => {
      Object.assign(state.codexFilter, filter);
    }),

    // Codex Category actions
    createCodexCategory: async (novelId, data) => {
      const category: CodexCategory = {
        id: uuidv4(),
        novelId,
        name: data.name || 'New Category',
        type: data.type || 'character',
        color: data.color,
        parentId: data.parentId,
      };
      await db.codexCategories.put(category);
      set((state) => { state.codexCategories.push(category); });
      return category;
    },

    updateCodexCategory: async (id, data) => {
      await db.codexCategories.update(id, data);
      set((state) => {
        const index = state.codexCategories.findIndex(c => c.id === id);
        if (index !== -1) {
          Object.assign(state.codexCategories[index], data);
        }
      });
    },

    deleteCodexCategory: async (id) => {
      await db.codexCategories.delete(id);
      set((state) => {
        state.codexCategories = state.codexCategories.filter(c => c.id !== id);
      });
    },

    // Snippet actions
    createSnippet: async (novelId, data) => {
      const snippet: Snippet = {
        id: uuidv4(),
        novelId,
        title: data.title || 'New Snippet',
        content: data.content || '',
        type: data.type || 'note',
        tags: data.tags || [],
        color: data.color,
        isPinned: data.isPinned || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.snippets.put(snippet);
      set((state) => { state.snippets.push(snippet); });
      return snippet;
    },

    updateSnippet: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.snippets.update(id, updatedData);
      set((state) => {
        const index = state.snippets.findIndex(s => s.id === id);
        if (index !== -1) {
          Object.assign(state.snippets[index], updatedData);
        }
      });
    },

    deleteSnippet: async (id) => {
      await db.snippets.delete(id);
      set((state) => {
        state.snippets = state.snippets.filter(s => s.id !== id);
      });
    },

    // Prompt actions
    createPrompt: async (data) => {
      const prompt: Prompt = {
        id: uuidv4(),
        name: data.name || 'New Prompt',
        description: data.description,
        content: data.content || '',
        type: data.type || 'custom',
        components: data.components || [],
        parameters: data.parameters || {
          includeOutline: false,
          includeCodex: false,
          includePreviousScenes: 0,
          includeCurrentScene: true,
        },
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.prompts.put(prompt);
      set((state) => { state.prompts.push(prompt); });
      return prompt;
    },

    updatePrompt: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.prompts.update(id, updatedData);
      set((state) => {
        const index = state.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
          Object.assign(state.prompts[index], updatedData);
        }
      });
    },

    deletePrompt: async (id) => {
      await db.prompts.delete(id);
      set((state) => {
        state.prompts = state.prompts.filter(p => p.id !== id);
      });
    },

    // Chat actions
    createConversation: async (novelId, data) => {
      const conversation: ChatConversation = {
        id: uuidv4(),
        novelId,
        title: data.title || 'New Conversation',
        promptId: data.promptId,
        personaId: data.personaId,
        modelId: data.modelId || get().settings?.aiSettings.defaultModel || 'anthropic/claude-3.5-sonnet',
        messages: data.messages || [],
        contextSettings: data.contextSettings || {
          includeOutline: true,
          includeScenes: [],
          includeActs: [],
          includeChapters: [],
          includeSnippets: [],
          includeCodex: {
            types: [],
            categories: [],
            tags: [],
            entries: [],
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.chatConversations.put(conversation);
      set((state) => { state.chatConversations.push(conversation); });
      return conversation;
    },

    updateConversation: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.chatConversations.update(id, updatedData);
      set((state) => {
        const index = state.chatConversations.findIndex(c => c.id === id);
        if (index !== -1) {
          Object.assign(state.chatConversations[index], updatedData);
        }
      });
    },

    deleteConversation: async (id) => {
      await db.chatConversations.delete(id);
      set((state) => {
        state.chatConversations = state.chatConversations.filter(c => c.id !== id);
        if (state.currentConversationId === id) {
          state.currentConversationId = null;
        }
      });
    },

    addMessage: async (conversationId, message) => {
      const conversation = get().chatConversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const newMessage: ChatMessage = {
        id: uuidv4(),
        ...message,
        timestamp: new Date(),
      };

      const messages = [...conversation.messages, newMessage];
      await get().updateConversation(conversationId, { messages });
    },

    selectConversation: (id) => set({ currentConversationId: id }),

    // Persona actions
    createPersona: async (data) => {
      const persona: ChatPersona = {
        id: uuidv4(),
        name: data.name || 'New Persona',
        description: data.description,
        systemPrompt: data.systemPrompt || '',
        sharedMemory: data.sharedMemory || [],
        createdAt: new Date(),
      };
      await db.chatPersonas.put(persona);
      set((state) => { state.chatPersonas.push(persona); });
      return persona;
    },

    updatePersona: async (id, data) => {
      await db.chatPersonas.update(id, data);
      set((state) => {
        const index = state.chatPersonas.findIndex(p => p.id === id);
        if (index !== -1) {
          Object.assign(state.chatPersonas[index], data);
        }
      });
    },

    deletePersona: async (id) => {
      await db.chatPersonas.delete(id);
      set((state) => {
        state.chatPersonas = state.chatPersonas.filter(p => p.id !== id);
      });
    },

    // Series actions
    createSeries: async (data) => {
      const newSeries: Series = {
        id: uuidv4(),
        name: data.name || 'New Series',
        description: data.description,
        penNameId: data.penNameId,
        coverImage: data.coverImage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.series.put(newSeries);
      set((state) => { state.series.push(newSeries); });
      return newSeries;
    },

    updateSeries: async (id, data) => {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.series.update(id, updatedData);
      set((state) => {
        const index = state.series.findIndex(s => s.id === id);
        if (index !== -1) {
          Object.assign(state.series[index], updatedData);
        }
      });
    },

    deleteSeries: async (id) => {
      await db.series.delete(id);
      set((state) => {
        state.series = state.series.filter(s => s.id !== id);
      });
    },

    // Pen Name actions
    createPenName: async (data) => {
      const penName: PenName = {
        id: uuidv4(),
        name: data.name || 'New Pen Name',
        bio: data.bio,
        avatar: data.avatar,
        createdAt: new Date(),
      };
      await db.penNames.put(penName);
      set((state) => { state.penNames.push(penName); });
      return penName;
    },

    updatePenName: async (id, data) => {
      await db.penNames.update(id, data);
      set((state) => {
        const index = state.penNames.findIndex(p => p.id === id);
        if (index !== -1) {
          Object.assign(state.penNames[index], data);
        }
      });
    },

    deletePenName: async (id) => {
      await db.penNames.delete(id);
      set((state) => {
        state.penNames = state.penNames.filter(p => p.id !== id);
      });
    },

    // Revision History
    saveRevision: async (entityType, entityId, novelId, content) => {
      const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
      const revision: RevisionHistory = {
        id: uuidv4(),
        entityType,
        entityId,
        novelId,
        content,
        wordCount,
        createdAt: new Date(),
      };
      await db.revisionHistory.put(revision);
      set((state) => { state.revisionHistory.push(revision); });

      // Keep only last 50 revisions per entity
      const entityRevisions = get().revisionHistory
        .filter(r => r.entityId === entityId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (entityRevisions.length > 50) {
        const toDelete = entityRevisions.slice(50);
        for (const rev of toDelete) {
          await db.revisionHistory.delete(rev.id);
        }
        set((state) => {
          state.revisionHistory = state.revisionHistory.filter(
            r => !toDelete.some(d => d.id === r.id)
          );
        });
      }
    },

    getRevisions: (entityId) => {
      return get().revisionHistory
        .filter(r => r.entityId === entityId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    restoreRevision: async (revisionId) => {
      const revision = get().revisionHistory.find(r => r.id === revisionId);
      if (!revision) return;

      if (revision.entityType === 'scene') {
        await get().updateScene(revision.entityId, { content: revision.content });
      } else if (revision.entityType === 'codex') {
        await get().updateCodexEntry(revision.entityId, { description: revision.content });
      }
    },

    // Settings actions
    updateSettings: async (data) => {
      const current = get().settings;
      if (!current) return;
      const updated = { ...current, ...data };
      await db.appSettings.put(updated);
      set({ settings: updated });
    },

    updateEditorSettings: async (data) => {
      const current = get().settings;
      if (!current) return;
      const updated = {
        ...current,
        editorSettings: { ...current.editorSettings, ...data },
      };
      await db.appSettings.put(updated);
      set({ settings: updated });
    },

    updateAISettings: async (data) => {
      const current = get().settings;
      if (!current) return;
      const updated = {
        ...current,
        aiSettings: { ...current.aiSettings, ...data },
      };
      await db.appSettings.put(updated);
      set({ settings: updated });
    },

    // Panel actions
    openPanel: (panel) => {
      const newPanel: Panel = {
        id: uuidv4(),
        ...panel,
      };
      set((state) => { state.panels.push(newPanel); });
    },

    closePanel: (id) => set((state) => {
      state.panels = state.panels.filter(p => p.id !== id);
    }),

    pinPanel: (id) => set((state) => {
      const panel = state.panels.find(p => p.id === id);
      if (panel) panel.isPinned = true;
    }),

    unpinPanel: (id) => set((state) => {
      const panel = state.panels.find(p => p.id === id);
      if (panel) panel.isPinned = false;
    }),

    // Utilities
    getNovelWordCount: (novelId) => {
      return get().scenes
        .filter(s => s.novelId === novelId && !s.isArchived)
        .reduce((sum, s) => sum + s.wordCount, 0);
    },

    getScenesByChapter: (chapterId) => {
      return get().scenes
        .filter(s => s.chapterId === chapterId)
        .sort((a, b) => a.order - b.order);
    },

    getChaptersByAct: (actId) => {
      return get().chapters
        .filter(c => c.actId === actId)
        .sort((a, b) => a.order - b.order);
    },
  }))
);
