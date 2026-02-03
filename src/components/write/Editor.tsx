import React, { useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Highlighter,
  Undo,
  Redo,
  Minus,
} from 'lucide-react';
import { useStore } from '@/store';
import debounce from '@/utils/debounce';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function Editor({ content, onChange, placeholder = 'Start writing...', editable = true }: EditorProps) {
  const { settings, saveRevision, currentSceneId, currentNovelId } = useStore();
  const editorSettings = settings?.editorSettings;
  const lastContentRef = useRef(content);

  const debouncedSave = useCallback(
    debounce((newContent: string) => {
      if (currentSceneId && currentNovelId && newContent !== lastContentRef.current) {
        saveRevision('scene', currentSceneId, currentNovelId, newContent);
        lastContentRef.current = newContent;
      }
    }, 30000),
    [currentSceneId, currentNovelId, saveRevision]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      CharacterCount,
      TextStyle,
      Color,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange(newContent);
      debouncedSave(newContent);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const editorStyle = {
    fontFamily: editorSettings?.dyslexiaFont ? 'OpenDyslexic, sans-serif' : editorSettings?.fontFamily || 'Georgia, serif',
    fontSize: `${editorSettings?.fontSize || 16}px`,
    lineHeight: editorSettings?.lineHeight || 1.8,
  };

  const pageWidthClass = {
    narrow: 'max-w-xl',
    medium: 'max-w-2xl',
    wide: 'max-w-4xl',
    full: 'max-w-full',
  }[editorSettings?.pageWidth || 'medium'];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <HighlightMenu editor={editor} />

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        <div className={`mx-auto px-8 py-12 ${pageWidthClass}`} style={editorStyle}>
          <EditorContent editor={editor} className="prose prose-invert max-w-none" />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <span>{editor.storage.characterCount.words()} words</span>
          <span>{editor.storage.characterCount.characters()} characters</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Auto-saved</span>
        </div>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive = false, disabled = false, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-colors
        ${isActive ? 'bg-indigo-500/20 text-indigo-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  );
}

function BubbleButton({ onClick, isActive = false, children }: { onClick: () => void; isActive?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-1.5 rounded transition-colors
        ${isActive ? 'bg-indigo-500/20 text-indigo-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}
      `}
    >
      {children}
    </button>
  );
}

function HighlightMenu({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [showMenu, setShowMenu] = React.useState(false);

  const colors = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#86efac' },
    { name: 'Blue', value: '#93c5fd' },
    { name: 'Purple', value: '#c4b5fd' },
    { name: 'Red', value: '#fca5a5' },
    { name: 'Orange', value: '#fed7aa' },
    { name: 'Pink', value: '#fbcfe8' },
  ];

  if (!editor) return null;

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setShowMenu(!showMenu)}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <Highlighter className="w-4 h-4" />
      </ToolbarButton>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg z-50">
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color: color.value }).run();
                  setShowMenu(false);
                }}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <button
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              setShowMenu(false);
            }}
            className="w-full mt-2 px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded"
          >
            Remove highlight
          </button>
        </div>
      )}
    </div>
  );
}
