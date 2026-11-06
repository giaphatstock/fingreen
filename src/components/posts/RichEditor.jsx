import React, { useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Heading1, Heading2,
  List, ListOrdered, Quote, Minus, Image as ImageIcon, Link2,
  Highlighter, Undo, Redo, AlignLeft
} from 'lucide-react'

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded-lg text-sm transition-all duration-150 ${
        active
          ? 'bg-primary-500 text-white'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichEditor({ content, onChange, placeholder = 'Nhập nội dung bài viết...' }) {
  const fileInputRef = useRef()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror min-h-[300px] p-4 focus:outline-none',
        'data-placeholder': placeholder,
      }
    }
  })

  if (!editor) return null

  const addImage = () => fileInputRef.current?.click()

  const handleImageFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      editor.chain().focus().setImage({ src: ev.target.result }).run()
    }
    reader.readAsDataURL(file)
  }

  const setLink = () => {
    const url = window.prompt('Nhập URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-gray-700 bg-gray-850">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="In đậm">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="In nghiêng">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Gạch dưới">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Gạch ngang">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Làm nổi bật">
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Tiêu đề 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Tiêu đề 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Danh sách">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách đánh số">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Trích dẫn">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Đường kẻ ngang">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

        <ToolbarButton onClick={addImage} active={false} title="Thêm ảnh">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Chèn link">
          <Link2 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title="Hoàn tác">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title="Làm lại">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
    </div>
  )
}
