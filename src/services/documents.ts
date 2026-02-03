// Document Import/Export Service for Word .docx and Markdown files
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import type {
  Novel,
  Act,
  Chapter,
  Scene,
  ExportOptions,
  ImportOptions,
  CodexEntry,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ============ WORD .DOCX IMPORT ============

interface ImportResult {
  acts: Omit<Act, 'id' | 'createdAt' | 'updatedAt'>[];
  chapters: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>[];
  scenes: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'>[];
}

export async function importDocx(
  file: File,
  novelId: string,
  options: ImportOptions
): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  return parseDocumentContent(html, novelId, options);
}

export async function importMarkdown(
  file: File,
  novelId: string,
  options: ImportOptions
): Promise<ImportResult> {
  const text = await file.text();
  const html = markdownToHtml(text);

  return parseDocumentContent(html, novelId, options);
}

function parseDocumentContent(
  html: string,
  novelId: string,
  options: ImportOptions
): ImportResult {
  const acts: ImportResult['acts'] = [];
  const chapters: ImportResult['chapters'] = [];
  const scenes: ImportResult['scenes'] = [];

  // Create a temporary div to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const chapterDelimiter = options.chapterDelimiter || '# ';
  const sceneDelimiter = options.sceneDelimiter || '***';

  // Split content by chapter and scene delimiters
  const fullText = doc.body.innerHTML;

  // Default: create one act, parse chapters and scenes
  const actId = uuidv4();
  acts.push({
    novelId,
    title: 'Act 1',
    order: 0,
  });

  if (options.createChapters) {
    // Split by chapter headings (h1 or custom delimiter)
    const chapterSections = splitByHeadings(fullText, 'h1');

    chapterSections.forEach((chapterContent, chapterIndex) => {
      const chapterId = uuidv4();
      const chapterTitle = extractFirstHeading(chapterContent, 'h1') || `Chapter ${chapterIndex + 1}`;

      chapters.push({
        novelId,
        actId,
        title: chapterTitle,
        order: chapterIndex,
      });

      if (options.createScenes) {
        // Split chapter content by scene breaks (*** or hr)
        const sceneSections = splitBySceneBreaks(chapterContent, sceneDelimiter);

        sceneSections.forEach((sceneContent, sceneIndex) => {
          const cleanContent = cleanHtml(sceneContent);
          const wordCount = countWords(cleanContent);

          scenes.push({
            novelId,
            chapterId,
            title: `Scene ${sceneIndex + 1}`,
            content: cleanContent,
            order: sceneIndex,
            wordCount,
            status: 'draft',
            excludeFromAI: false,
            isArchived: false,
            labels: [],
            markers: [],
            sections: [],
            manualReferences: [],
            beats: [],
          });
        });
      } else {
        // Treat entire chapter as one scene
        const cleanContent = cleanHtml(chapterContent);
        const wordCount = countWords(cleanContent);

        scenes.push({
          novelId,
          chapterId,
          title: 'Scene 1',
          content: cleanContent,
          order: 0,
          wordCount,
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
    });
  } else {
    // Create single chapter with all content
    const chapterId = uuidv4();
    chapters.push({
      novelId,
      actId,
      title: 'Chapter 1',
      order: 0,
    });

    const cleanContent = cleanHtml(fullText);
    const wordCount = countWords(cleanContent);

    scenes.push({
      novelId,
      chapterId,
      title: 'Scene 1',
      content: cleanContent,
      order: 0,
      wordCount,
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

  return { acts, chapters, scenes };
}

function splitByHeadings(html: string, headingTag: string): string[] {
  const regex = new RegExp(`<${headingTag}[^>]*>`, 'gi');
  const parts = html.split(regex);

  // First part before any heading might be empty or contain intro
  if (parts[0].trim().length === 0) {
    parts.shift();
  }

  return parts.length > 0 ? parts : [html];
}

function splitBySceneBreaks(html: string, delimiter: string): string[] {
  // Split by *** or <hr> tags
  const hrRegex = /<hr[^>]*>/gi;
  const delimiterRegex = new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

  let parts = html.split(hrRegex);
  if (parts.length === 1) {
    parts = html.split(delimiterRegex);
  }

  return parts.filter(p => p.trim().length > 0);
}

function extractFirstHeading(html: string, headingTag: string): string | null {
  const regex = new RegExp(`<${headingTag}[^>]*>(.*?)</${headingTag}>`, 'i');
  const match = html.match(regex);
  return match ? stripTags(match[1]) : null;
}

function cleanHtml(html: string): string {
  // Remove heading tags but keep the content structure
  let cleaned = html
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
    .replace(/<hr[^>]*>/gi, '')
    .replace(/\*\*\*/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned || '<p></p>';
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function countWords(html: string): number {
  const text = stripTags(html);
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// ============ MARKDOWN CONVERSION ============

function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Scene breaks
  html = html.replace(/^\*\*\*$/gm, '<hr>');
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^___$/gm, '<hr>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraphs
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }

  return html;
}

function htmlToMarkdown(html: string): string {
  let md = html;

  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // Bold and Italic
  md = md.replace(/<strong><em>(.*?)<\/em><\/strong>/gi, '***$1***');
  md = md.replace(/<em><strong>(.*?)<\/strong><\/em>/gi, '***$1***');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');

  // Underline (no markdown equivalent, use HTML or skip)
  md = md.replace(/<u>(.*?)<\/u>/gi, '$1');

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Scene breaks
  md = md.replace(/<hr[^>]*>/gi, '\n\n***\n\n');

  // Paragraphs and line breaks
  md = md.replace(/<\/p>\s*<p>/gi, '\n\n');
  md = md.replace(/<p[^>]*>/gi, '');
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<br[^>]*>/gi, '\n');

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<\/?ul[^>]*>/gi, '\n');
  md = md.replace(/<\/?ol[^>]*>/gi, '\n');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');

  // Remove remaining tags
  md = md.replace(/<[^>]*>/g, '');

  // Clean up whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return md;
}

// ============ EXPORT FUNCTIONS ============

export interface NovelExportData {
  novel: Novel;
  acts: Act[];
  chapters: Chapter[];
  scenes: Scene[];
  codexEntries?: CodexEntry[];
}

export async function exportToDocx(
  data: NovelExportData,
  options: ExportOptions
): Promise<void> {
  const html = buildExportHtml(data, options);

  // Dynamic import for html-to-docx (it's a large module)
  const { default: HTMLtoDOCX } = await import('html-to-docx');

  const docxBlob = await HTMLtoDOCX(html, null, {
    title: data.novel.title,
    margins: {
      top: 1440, // 1 inch in twips
      right: 1440,
      bottom: 1440,
      left: 1440,
    },
    font: 'Times New Roman',
    fontSize: 24, // 12pt in half-points
  });

  saveAs(docxBlob as Blob, `${data.novel.title}.docx`);
}

export async function exportToMarkdown(
  data: NovelExportData,
  options: ExportOptions
): Promise<void> {
  const markdown = buildExportMarkdown(data, options);

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${data.novel.title}.md`);
}

export async function exportToHtml(
  data: NovelExportData,
  options: ExportOptions
): Promise<void> {
  const html = buildFullHtmlDocument(data, options);

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${data.novel.title}.html`);
}

function buildExportHtml(data: NovelExportData, options: ExportOptions): string {
  const { novel, acts, chapters, scenes } = data;
  let html = '';

  // Front matter
  if (options.frontMatter) {
    html += `<h1>${novel.title}</h1>`;
    if (novel.subtitle) {
      html += `<h2>${novel.subtitle}</h2>`;
    }
    html += '<hr>';
  }

  // Sort data
  const sortedActs = [...acts].sort((a, b) => a.order - b.order);

  for (const act of sortedActs) {
    const actChapters = chapters
      .filter(c => c.actId === act.id)
      .sort((a, b) => a.order - b.order);

    for (const chapter of actChapters) {
      if (options.chapterBreaks) {
        html += `<h1>${chapter.title}</h1>`;
        if (chapter.subtitle) {
          html += `<p><em>${chapter.subtitle}</em></p>`;
        }
      }

      const chapterScenes = scenes
        .filter(s => s.chapterId === chapter.id && !s.isArchived)
        .sort((a, b) => a.order - b.order);

      for (let i = 0; i < chapterScenes.length; i++) {
        const scene = chapterScenes[i];

        if (options.includeNotes && scene.notes) {
          html += `<p><em>[Note: ${scene.notes}]</em></p>`;
        }

        if (options.includeSummaries && scene.summary) {
          html += `<p><em>[Summary: ${scene.summary}]</em></p>`;
        }

        html += scene.content;

        // Add scene break between scenes
        if (options.sceneBreaks && i < chapterScenes.length - 1) {
          html += '<p style="text-align: center;">* * *</p>';
        }
      }
    }
  }

  // Codex appendix
  if (options.includeCodex && data.codexEntries && data.codexEntries.length > 0) {
    html += '<hr>';
    html += '<h1>Codex</h1>';

    const groupedEntries = groupCodexByType(data.codexEntries);

    for (const [type, entries] of Object.entries(groupedEntries)) {
      html += `<h2>${capitalizeFirst(type)}s</h2>`;

      for (const entry of entries) {
        html += `<h3>${entry.name}</h3>`;
        if (entry.description) {
          html += `<p>${entry.description}</p>`;
        }

        if (entry.customDetails.length > 0) {
          html += '<ul>';
          for (const detail of entry.customDetails) {
            html += `<li><strong>${detail.label}:</strong> ${detail.value}</li>`;
          }
          html += '</ul>';
        }
      }
    }
  }

  return html;
}

function buildExportMarkdown(data: NovelExportData, options: ExportOptions): string {
  const { novel, acts, chapters, scenes } = data;
  let md = '';

  // Front matter
  if (options.frontMatter) {
    md += `# ${novel.title}\n\n`;
    if (novel.subtitle) {
      md += `## ${novel.subtitle}\n\n`;
    }
    md += '---\n\n';
  }

  // Sort data
  const sortedActs = [...acts].sort((a, b) => a.order - b.order);

  for (const act of sortedActs) {
    const actChapters = chapters
      .filter(c => c.actId === act.id)
      .sort((a, b) => a.order - b.order);

    for (const chapter of actChapters) {
      if (options.chapterBreaks) {
        md += `# ${chapter.title}\n\n`;
        if (chapter.subtitle) {
          md += `*${chapter.subtitle}*\n\n`;
        }
      }

      const chapterScenes = scenes
        .filter(s => s.chapterId === chapter.id && !s.isArchived)
        .sort((a, b) => a.order - b.order);

      for (let i = 0; i < chapterScenes.length; i++) {
        const scene = chapterScenes[i];

        if (options.includeNotes && scene.notes) {
          md += `*[Note: ${scene.notes}]*\n\n`;
        }

        if (options.includeSummaries && scene.summary) {
          md += `*[Summary: ${scene.summary}]*\n\n`;
        }

        md += htmlToMarkdown(scene.content) + '\n\n';

        // Add scene break between scenes
        if (options.sceneBreaks && i < chapterScenes.length - 1) {
          md += '***\n\n';
        }
      }
    }
  }

  // Codex appendix
  if (options.includeCodex && data.codexEntries && data.codexEntries.length > 0) {
    md += '---\n\n';
    md += '# Codex\n\n';

    const groupedEntries = groupCodexByType(data.codexEntries);

    for (const [type, entries] of Object.entries(groupedEntries)) {
      md += `## ${capitalizeFirst(type)}s\n\n`;

      for (const entry of entries) {
        md += `### ${entry.name}\n\n`;
        if (entry.description) {
          md += `${entry.description}\n\n`;
        }

        if (entry.customDetails.length > 0) {
          for (const detail of entry.customDetails) {
            md += `- **${detail.label}:** ${detail.value}\n`;
          }
          md += '\n';
        }
      }
    }
  }

  return md;
}

function buildFullHtmlDocument(data: NovelExportData, options: ExportOptions): string {
  const content = buildExportHtml(data, options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.novel.title}</title>
  <style>
    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 16px;
      line-height: 1.8;
      color: #333;
    }
    h1 { font-size: 2em; margin-top: 2em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    h3 { font-size: 1.2em; margin-top: 1em; }
    p { margin: 1em 0; text-indent: 1.5em; }
    p:first-of-type { text-indent: 0; }
    hr { margin: 2em 0; border: none; border-top: 1px solid #ccc; }
    blockquote { margin: 1em 2em; font-style: italic; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

function groupCodexByType(entries: CodexEntry[]): Record<string, CodexEntry[]> {
  const grouped: Record<string, CodexEntry[]> = {};

  for (const entry of entries) {
    if (!grouped[entry.type]) {
      grouped[entry.type] = [];
    }
    grouped[entry.type].push(entry);
  }

  return grouped;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============ FILE READING UTILITIES ============

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
