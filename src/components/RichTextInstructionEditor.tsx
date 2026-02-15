import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import './RichTextInstructionEditor.css';

interface RichTextInstructionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeContent = (value: string): string => {
  if (!value?.trim()) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return `<p>${escapeHtml(value).replace(/\n/g, '<br />')}</p>`;
};

export const RichTextInstructionEditor = ({
  value,
  onChange,
  placeholder = 'Beskriv steget...',
}: RichTextInstructionEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content: normalizeContent(value),
    editorProps: {
      attributes: {
        class: 'instruction-editor-content',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeContent(value);
    if (editor.getHTML() !== normalized) {
      editor.commands.setContent(normalized, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="instruction-editor">
      <div className="instruction-toolbar">
        <select
          className="toolbar-select"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(event) => {
            const font = event.target.value;
            if (!font) {
              editor.chain().focus().unsetFontFamily().run();
              return;
            }
            editor.chain().focus().setFontFamily(font).run();
          }}
        >
          <option value="">Standardfont</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="'Courier New', monospace">Courier New</option>
          <option value="Verdana">Verdana</option>
        </select>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Fet text"
        >
          B
        </button>
        <button
          type="button"
          className={`toolbar-btn italic ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Kursiv text"
        >
          I
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Punktlista"
        >
          • List
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numrerad lista"
        >
          1. List
        </button>
      </div>
      <EditorContent editor={editor} />
      <div className="instruction-placeholder-hint">{placeholder}</div>
    </div>
  );
};
