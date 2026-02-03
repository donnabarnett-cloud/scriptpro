// Core Types for NovelCrafter Clone

export type UUID = string;

// ============ NOVEL TYPES ============
export interface Novel {
  id: UUID;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  penNameId?: UUID;
  seriesId?: UUID;
  seriesOrder?: number;
  pov: POVType;
  povCharacterId?: UUID;
  tense: TenseType;
  templateId?: UUID;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  targetWordCount?: number;
  status: NovelStatus;
  settings: NovelSettings;
}

export type POVType = 'first-person' | 'third-person-limited' | 'third-person-omniscient' | 'second-person';
export type TenseType = 'past' | 'present' | 'future';
export type NovelStatus = 'draft' | 'in-progress' | 'editing' | 'complete' | 'published';

export interface NovelSettings {
  showWordCount: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  grammarCheck: boolean;
}

// ============ STRUCTURE TYPES ============
export interface Act {
  id: UUID;
  novelId: UUID;
  title: string;
  description?: string;
  order: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: UUID;
  novelId: UUID;
  actId: UUID;
  title: string;
  description?: string;
  order: number;
  povCharacterId?: UUID;
  subtitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scene {
  id: UUID;
  novelId: UUID;
  chapterId: UUID;
  title: string;
  content: string;
  summary?: string;
  order: number;
  wordCount: number;
  status: SceneStatus;
  povCharacterId?: UUID;
  locationId?: UUID;
  subtitle?: string;
  notes?: string;
  beats?: SceneBeat[];
  excludeFromAI: boolean;
  isArchived: boolean;
  labels: UUID[];
  markers: SceneMarker[];
  sections: SceneSection[];
  manualReferences: UUID[];
  createdAt: Date;
  updatedAt: Date;
}

export type SceneStatus = 'outline' | 'draft' | 'revision' | 'final' | 'custom';

export interface SceneBeat {
  id: UUID;
  content: string;
  order: number;
  isCompleted: boolean;
}

export interface SceneMarker {
  id: UUID;
  start: number;
  end: number;
  color: MarkerColor;
  note?: string;
  type: MarkerType;
}

export type MarkerType = 'highlight' | 'comment' | 'revision' | 'question' | 'research';
export type MarkerColor = 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'pink';

export interface SceneSection {
  id: UUID;
  content: string;
  notes?: string;
  alternatives?: string[];
  excludeFromAI: boolean;
  order: number;
}

export interface SceneLabel {
  id: UUID;
  novelId: UUID;
  name: string;
  color: string;
  description?: string;
}

// ============ CODEX TYPES ============
export type CodexEntryType = 'character' | 'location' | 'object' | 'lore' | 'subplot' | 'other';

export interface CodexEntry {
  id: UUID;
  novelId: UUID;
  type: CodexEntryType;
  name: string;
  aliases: string[];
  description?: string;
  thumbnail?: string;
  color?: string;
  tags: string[];
  categoryId?: UUID;
  customDetails: CustomDetail[];
  progressions: CodexProgression[];
  relations: CodexRelation[];
  mentions: CodexMention[];
  trackingSettings: TrackingSettings;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomDetail {
  id: UUID;
  label: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'list' | 'link';
}

export interface CodexProgression {
  id: UUID;
  sceneId?: UUID;
  chapterId?: UUID;
  title: string;
  description: string;
  order: number;
}

export interface CodexRelation {
  id: UUID;
  targetEntryId: UUID;
  relationType: string;
  description?: string;
  isBidirectional: boolean;
}

export interface CodexMention {
  sceneId: UUID;
  position: number;
  context: string;
}

export interface TrackingSettings {
  includeInAI: boolean;
  trackAppearances: boolean;
  autoDetect: boolean;
}

export interface CodexCategory {
  id: UUID;
  novelId: UUID;
  name: string;
  type: CodexEntryType;
  color?: string;
  parentId?: UUID;
}

// ============ SERIES & PEN NAMES ============
export interface Series {
  id: UUID;
  name: string;
  description?: string;
  penNameId?: UUID;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PenName {
  id: UUID;
  name: string;
  bio?: string;
  avatar?: string;
  createdAt: Date;
}

// ============ TEMPLATES ============
export interface NovelTemplate {
  id: UUID;
  name: string;
  description?: string;
  structure: TemplateStructure;
  codexTypes: CodexEntryType[];
  defaultLabels: Omit<SceneLabel, 'id' | 'novelId'>[];
  createdAt: Date;
}

export interface TemplateStructure {
  acts: {
    title: string;
    chapters: {
      title: string;
      scenes: { title: string }[];
    }[];
  }[];
}

// ============ SNIPPETS ============
export interface Snippet {
  id: UUID;
  novelId: UUID;
  title: string;
  content: string;
  type: SnippetType;
  tags: string[];
  color?: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SnippetType = 'note' | 'todo' | 'fragment' | 'research' | 'idea';

// ============ REVISION HISTORY ============
export interface RevisionHistory {
  id: UUID;
  entityType: 'scene' | 'chapter' | 'codex';
  entityId: UUID;
  novelId: UUID;
  content: string;
  wordCount: number;
  createdAt: Date;
  description?: string;
}

// ============ AI & CHAT TYPES ============
export interface AISettings {
  id: UUID;
  apiKey?: string;
  provider: AIProvider;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export type AIProvider = 'openrouter' | 'openai' | 'anthropic';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface Prompt {
  id: UUID;
  name: string;
  description?: string;
  content: string;
  type: PromptType;
  components: PromptComponent[];
  parameters: PromptParameters;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PromptType = 'generation' | 'summarization' | 'analysis' | 'chat' | 'custom';

export interface PromptComponent {
  id: UUID;
  name: string;
  content: string;
  isEnabled: boolean;
  order: number;
}

export interface PromptParameters {
  includeOutline: boolean;
  includeCodex: boolean;
  includePreviousScenes: number;
  includeCurrentScene: boolean;
  povFilter?: UUID;
  customInstructions?: string;
}

export interface ChatConversation {
  id: UUID;
  novelId: UUID;
  title: string;
  promptId?: UUID;
  personaId?: UUID;
  modelId: string;
  messages: ChatMessage[];
  contextSettings: ChatContextSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: UUID;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  extractedItems?: ExtractedItem[];
}

export interface ExtractedItem {
  type: 'beat' | 'codex' | 'outline' | 'scene';
  content: string;
  saved: boolean;
}

export interface ChatContextSettings {
  includeOutline: boolean;
  includeScenes: UUID[];
  includeActs: UUID[];
  includeChapters: UUID[];
  includeSnippets: UUID[];
  includeCodex: {
    types: CodexEntryType[];
    categories: UUID[];
    tags: string[];
    entries: UUID[];
  };
  memoryCutoff?: number;
}

export interface ChatPersona {
  id: UUID;
  name: string;
  description?: string;
  systemPrompt: string;
  sharedMemory: string[];
  createdAt: Date;
}

// ============ COLLABORATION ============
export interface Team {
  id: UUID;
  name: string;
  ownerId: UUID;
  members: TeamMember[];
  createdAt: Date;
}

export interface TeamMember {
  userId: UUID;
  email: string;
  name: string;
  role: TeamRole;
  joinedAt: Date;
}

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ShareSettings {
  id: UUID;
  novelId: UUID;
  teamId?: UUID;
  sharedWith: SharedUser[];
  isPublic: boolean;
  publicLink?: string;
}

export interface SharedUser {
  email: string;
  role: TeamRole;
  sharedAt: Date;
}

// ============ UI TYPES ============
export interface Panel {
  id: UUID;
  type: PanelType;
  entityId?: UUID;
  isPinned: boolean;
  position: 'left' | 'right' | 'center';
  width?: number;
}

export type PanelType = 'scene' | 'chapter' | 'codex' | 'snippet' | 'chat' | 'outline' | 'timeline';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  paragraphSpacing: number;
  pageWidth: 'narrow' | 'medium' | 'wide' | 'full';
  dyslexiaFont: boolean;
  focusMode: boolean;
  typewriterMode: boolean;
  showLineNumbers: boolean;
  showWordCount: boolean;
  theme: 'light' | 'dark' | 'sepia';
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  recentNovels: UUID[];
  editorSettings: EditorSettings;
  aiSettings: AISettings;
  keyboardShortcuts: Record<string, string>;
}

// ============ ANALYTICS TYPES ============
export interface WordStatistics {
  novelId: UUID;
  date: Date;
  totalWords: number;
  dailyWords: number;
  sceneWords: Record<UUID, number>;
  chapterWords: Record<UUID, number>;
}

export interface CharacterAppearance {
  characterId: UUID;
  sceneId: UUID;
  chapterId: UUID;
  wordPosition: number;
  context: string;
}

export interface AnalyticsData {
  novelId: UUID;
  wordCountHistory: { date: Date; count: number }[];
  characterAppearances: Record<UUID, CharacterAppearance[]>;
  sceneStats: {
    sceneId: UUID;
    wordCount: number;
    characterCount: number;
    avgSentenceLength: number;
  }[];
  writingStreak: number;
  lastWritingDate?: Date;
}

// ============ EXPORT/IMPORT TYPES ============
export interface ExportOptions {
  format: 'docx' | 'markdown' | 'html' | 'json' | 'epub';
  includeCodex: boolean;
  includeNotes: boolean;
  includeSummaries: boolean;
  chapterBreaks: boolean;
  sceneBreaks: boolean;
  frontMatter: boolean;
}

export interface ImportOptions {
  format: 'docx' | 'markdown' | 'html';
  createChapters: boolean;
  createScenes: boolean;
  chapterDelimiter?: string;
  sceneDelimiter?: string;
}

export interface BackupData {
  version: string;
  exportedAt: Date;
  novels: Novel[];
  acts: Act[];
  chapters: Chapter[];
  scenes: Scene[];
  codexEntries: CodexEntry[];
  codexCategories: CodexCategory[];
  snippets: Snippet[];
  labels: SceneLabel[];
  prompts: Prompt[];
  personas: ChatPersona[];
  conversations: ChatConversation[];
  templates: NovelTemplate[];
  series: Series[];
  penNames: PenName[];
  settings: AppSettings;
}
