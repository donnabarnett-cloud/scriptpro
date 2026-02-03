import Dexie, { type Table } from 'dexie';
import type {
  Novel,
  Act,
  Chapter,
  Scene,
  SceneLabel,
  CodexEntry,
  CodexCategory,
  Snippet,
  RevisionHistory,
  Prompt,
  ChatConversation,
  ChatPersona,
  NovelTemplate,
  Series,
  PenName,
  WordStatistics,
  AppSettings,
} from '@/types';

export class NovelCrafterDB extends Dexie {
  novels!: Table<Novel>;
  acts!: Table<Act>;
  chapters!: Table<Chapter>;
  scenes!: Table<Scene>;
  sceneLabels!: Table<SceneLabel>;
  codexEntries!: Table<CodexEntry>;
  codexCategories!: Table<CodexCategory>;
  snippets!: Table<Snippet>;
  revisionHistory!: Table<RevisionHistory>;
  prompts!: Table<Prompt>;
  chatConversations!: Table<ChatConversation>;
  chatPersonas!: Table<ChatPersona>;
  novelTemplates!: Table<NovelTemplate>;
  series!: Table<Series>;
  penNames!: Table<PenName>;
  wordStatistics!: Table<WordStatistics>;
  appSettings!: Table<AppSettings>;

  constructor() {
    super('NovelCrafterDB');

    this.version(1).stores({
      novels: 'id, title, penNameId, seriesId, status, createdAt, updatedAt',
      acts: 'id, novelId, order, createdAt',
      chapters: 'id, novelId, actId, order, createdAt',
      scenes: 'id, novelId, chapterId, order, status, isArchived, createdAt, updatedAt',
      sceneLabels: 'id, novelId, name',
      codexEntries: 'id, novelId, type, name, categoryId, isGlobal, createdAt, *tags, *aliases',
      codexCategories: 'id, novelId, type, name, parentId',
      snippets: 'id, novelId, type, isPinned, createdAt, *tags',
      revisionHistory: 'id, entityType, entityId, novelId, createdAt',
      prompts: 'id, name, type, isDefault, createdAt',
      chatConversations: 'id, novelId, promptId, createdAt, updatedAt',
      chatPersonas: 'id, name, createdAt',
      novelTemplates: 'id, name, createdAt',
      series: 'id, name, penNameId, createdAt',
      penNames: 'id, name, createdAt',
      wordStatistics: 'id, novelId, date',
      appSettings: 'id',
    });
  }
}

export const db = new NovelCrafterDB();

// Initialize default settings if not exists
export async function initializeDB() {
  const settings = await db.appSettings.get('default');
  if (!settings) {
    await db.appSettings.put({
      id: 'default',
      theme: 'dark',
      sidebarCollapsed: false,
      autoSave: true,
      autoSaveInterval: 30000,
      spellCheck: true,
      recentNovels: [],
      editorSettings: {
        fontSize: 16,
        fontFamily: 'Georgia, serif',
        lineHeight: 1.8,
        paragraphSpacing: 1.5,
        pageWidth: 'medium',
        dyslexiaFont: false,
        focusMode: false,
        typewriterMode: false,
        showLineNumbers: false,
        showWordCount: true,
        theme: 'dark',
      },
      aiSettings: {
        id: 'default',
        provider: 'openrouter',
        defaultModel: 'anthropic/claude-3.5-sonnet',
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
      keyboardShortcuts: {
        save: 'Ctrl+S',
        newScene: 'Ctrl+Shift+N',
        focusMode: 'F11',
        boldText: 'Ctrl+B',
        italicText: 'Ctrl+I',
        underlineText: 'Ctrl+U',
        search: 'Ctrl+F',
        commandPalette: 'Ctrl+K',
      },
    } as AppSettings);
  }

  // Initialize default prompts
  const promptCount = await db.prompts.count();
  if (promptCount === 0) {
    await db.prompts.bulkPut([
      {
        id: 'summarize-scene',
        name: 'Summarize Scene',
        description: 'Generate a concise summary of the current scene',
        content: 'Please provide a concise summary of this scene in 2-3 sentences, capturing the key events, character interactions, and any important plot developments.',
        type: 'summarization',
        components: [],
        parameters: {
          includeOutline: false,
          includeCodex: false,
          includePreviousScenes: 0,
          includeCurrentScene: true,
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'continue-writing',
        name: 'Continue Writing',
        description: 'Continue the narrative from where you left off',
        content: 'Continue writing this scene naturally, maintaining the established tone, pacing, and character voices. Write approximately 300-500 words.',
        type: 'generation',
        components: [],
        parameters: {
          includeOutline: true,
          includeCodex: true,
          includePreviousScenes: 2,
          includeCurrentScene: true,
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'brainstorm',
        name: 'Brainstorm Ideas',
        description: 'Generate creative ideas and suggestions',
        content: 'Based on the current story context, provide 5 creative suggestions for what could happen next. Consider character motivations, plot threads, and thematic elements.',
        type: 'analysis',
        components: [],
        parameters: {
          includeOutline: true,
          includeCodex: true,
          includePreviousScenes: 3,
          includeCurrentScene: true,
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'detect-characters',
        name: 'Detect Characters',
        description: 'Identify characters mentioned in the scene',
        content: 'Analyze this scene and identify all characters mentioned. For each character, provide: name, role in scene, key traits shown, and any relationships revealed.',
        type: 'analysis',
        components: [],
        parameters: {
          includeOutline: false,
          includeCodex: false,
          includePreviousScenes: 0,
          includeCurrentScene: true,
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'writing-coach',
        name: 'Writing Coach',
        description: 'Get feedback and suggestions for your writing',
        content: 'You are a helpful writing coach. Provide constructive feedback on the writing, including suggestions for improvement in areas like pacing, dialogue, description, and character development. Be encouraging but honest.',
        type: 'chat',
        components: [],
        parameters: {
          includeOutline: true,
          includeCodex: true,
          includePreviousScenes: 1,
          includeCurrentScene: true,
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }

  // Initialize default templates
  const templateCount = await db.novelTemplates.count();
  if (templateCount === 0) {
    await db.novelTemplates.bulkPut([
      {
        id: 'three-act',
        name: 'Three Act Structure',
        description: 'Classic three-act story structure',
        structure: {
          acts: [
            {
              title: 'Act 1 - Setup',
              chapters: [
                { title: 'Opening', scenes: [{ title: 'Hook' }, { title: 'Introduction' }] },
                { title: 'Inciting Incident', scenes: [{ title: 'Call to Adventure' }] },
              ],
            },
            {
              title: 'Act 2 - Confrontation',
              chapters: [
                { title: 'Rising Action', scenes: [{ title: 'First Challenge' }] },
                { title: 'Midpoint', scenes: [{ title: 'Major Revelation' }] },
                { title: 'Crisis', scenes: [{ title: 'All Is Lost' }] },
              ],
            },
            {
              title: 'Act 3 - Resolution',
              chapters: [
                { title: 'Climax', scenes: [{ title: 'Final Confrontation' }] },
                { title: 'Denouement', scenes: [{ title: 'Resolution' }] },
              ],
            },
          ],
        },
        codexTypes: ['character', 'location', 'object', 'lore', 'subplot', 'other'],
        defaultLabels: [
          { name: 'Outline', color: '#6366f1' },
          { name: 'Draft', color: '#f59e0b' },
          { name: 'Revision', color: '#8b5cf6' },
          { name: 'Final', color: '#22c55e' },
        ],
        createdAt: new Date(),
      },
      {
        id: 'heros-journey',
        name: "Hero's Journey",
        description: "Joseph Campbell's monomyth structure",
        structure: {
          acts: [
            {
              title: 'Departure',
              chapters: [
                { title: 'Ordinary World', scenes: [{ title: 'Status Quo' }] },
                { title: 'Call to Adventure', scenes: [{ title: 'The Call' }] },
                { title: 'Refusal of the Call', scenes: [{ title: 'Hesitation' }] },
                { title: 'Meeting the Mentor', scenes: [{ title: 'Guidance' }] },
                { title: 'Crossing the Threshold', scenes: [{ title: 'Point of No Return' }] },
              ],
            },
            {
              title: 'Initiation',
              chapters: [
                { title: 'Tests, Allies, Enemies', scenes: [{ title: 'Trials' }] },
                { title: 'Approach to Inmost Cave', scenes: [{ title: 'Preparation' }] },
                { title: 'Ordeal', scenes: [{ title: 'Central Crisis' }] },
                { title: 'Reward', scenes: [{ title: 'Seizing the Sword' }] },
              ],
            },
            {
              title: 'Return',
              chapters: [
                { title: 'The Road Back', scenes: [{ title: 'Chase' }] },
                { title: 'Resurrection', scenes: [{ title: 'Final Test' }] },
                { title: 'Return with Elixir', scenes: [{ title: 'Resolution' }] },
              ],
            },
          ],
        },
        codexTypes: ['character', 'location', 'object', 'lore', 'subplot', 'other'],
        defaultLabels: [
          { name: 'Outline', color: '#6366f1' },
          { name: 'Draft', color: '#f59e0b' },
          { name: 'Revision', color: '#8b5cf6' },
          { name: 'Final', color: '#22c55e' },
        ],
        createdAt: new Date(),
      },
      {
        id: 'blank',
        name: 'Blank Novel',
        description: 'Start with a clean slate',
        structure: {
          acts: [
            {
              title: 'Act 1',
              chapters: [
                { title: 'Chapter 1', scenes: [{ title: 'Scene 1' }] },
              ],
            },
          ],
        },
        codexTypes: ['character', 'location', 'object', 'lore', 'subplot', 'other'],
        defaultLabels: [
          { name: 'Outline', color: '#6366f1' },
          { name: 'Draft', color: '#f59e0b' },
          { name: 'Revision', color: '#8b5cf6' },
          { name: 'Final', color: '#22c55e' },
        ],
        createdAt: new Date(),
      },
    ]);
  }
}

// Export/Import functions
export async function exportAllData(): Promise<string> {
  const data = {
    version: '1.0.0',
    exportedAt: new Date(),
    novels: await db.novels.toArray(),
    acts: await db.acts.toArray(),
    chapters: await db.chapters.toArray(),
    scenes: await db.scenes.toArray(),
    sceneLabels: await db.sceneLabels.toArray(),
    codexEntries: await db.codexEntries.toArray(),
    codexCategories: await db.codexCategories.toArray(),
    snippets: await db.snippets.toArray(),
    revisionHistory: await db.revisionHistory.toArray(),
    prompts: await db.prompts.toArray(),
    chatConversations: await db.chatConversations.toArray(),
    chatPersonas: await db.chatPersonas.toArray(),
    novelTemplates: await db.novelTemplates.toArray(),
    series: await db.series.toArray(),
    penNames: await db.penNames.toArray(),
    appSettings: await db.appSettings.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);

  await db.transaction('rw', [
    db.novels, db.acts, db.chapters, db.scenes, db.sceneLabels,
    db.codexEntries, db.codexCategories, db.snippets, db.revisionHistory,
    db.prompts, db.chatConversations, db.chatPersonas, db.novelTemplates,
    db.series, db.penNames, db.appSettings
  ], async () => {
    if (data.novels) await db.novels.bulkPut(data.novels);
    if (data.acts) await db.acts.bulkPut(data.acts);
    if (data.chapters) await db.chapters.bulkPut(data.chapters);
    if (data.scenes) await db.scenes.bulkPut(data.scenes);
    if (data.sceneLabels) await db.sceneLabels.bulkPut(data.sceneLabels);
    if (data.codexEntries) await db.codexEntries.bulkPut(data.codexEntries);
    if (data.codexCategories) await db.codexCategories.bulkPut(data.codexCategories);
    if (data.snippets) await db.snippets.bulkPut(data.snippets);
    if (data.revisionHistory) await db.revisionHistory.bulkPut(data.revisionHistory);
    if (data.prompts) await db.prompts.bulkPut(data.prompts);
    if (data.chatConversations) await db.chatConversations.bulkPut(data.chatConversations);
    if (data.chatPersonas) await db.chatPersonas.bulkPut(data.chatPersonas);
    if (data.novelTemplates) await db.novelTemplates.bulkPut(data.novelTemplates);
    if (data.series) await db.series.bulkPut(data.series);
    if (data.penNames) await db.penNames.bulkPut(data.penNames);
    if (data.appSettings) await db.appSettings.bulkPut(data.appSettings);
  });
}
