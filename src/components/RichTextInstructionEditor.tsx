import { useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';

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
    <Paper variant="outlined" sx={{ flex: 1, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.5,
          p: 0.75,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <Select
          size="small"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(event) => {
            const font = event.target.value;
            if (!font) {
              editor.chain().focus().unsetFontFamily().run();
              return;
            }
            editor.chain().focus().setFontFamily(font).run();
          }}
          sx={{ height: 32, fontSize: '0.85rem', maxWidth: { xs: '45%', sm: 'auto' } }}
          displayEmpty
        >
          <MenuItem value="">Standardfont</MenuItem>
          <MenuItem value="Arial">Arial</MenuItem>
          <MenuItem value="Georgia">Georgia</MenuItem>
          <MenuItem value="'Courier New', monospace">Courier New</MenuItem>
          <MenuItem value="Verdana">Verdana</MenuItem>
        </Select>

        <ToggleButtonGroup size="small">
          <ToggleButton
            value="bold"
            selected={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Fet text"
            sx={{ height: 32 }}
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="italic"
            selected={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Kursiv text"
            sx={{ height: 32 }}
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="bulletList"
            selected={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Punktlista"
            sx={{ height: 32 }}
          >
            <FormatListBulletedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="orderedList"
            selected={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numrerad lista"
            sx={{ height: 32 }}
          >
            <FormatListNumberedIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          '& .ProseMirror': {
            minHeight: { xs: 95, sm: 110 },
            p: 1,
            outline: 'none',
            lineHeight: 1.68,
            fontSize: { xs: '0.94rem', sm: '0.97rem' },
            '& p': { m: 0, mb: 0.5 },
            '& p:last-child': { mb: 0 },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, pb: 0.75 }}>
        {placeholder}
      </Typography>
    </Paper>
  );
};
