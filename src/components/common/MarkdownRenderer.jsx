import React from 'react'

// Component render Markdown tài chính mượt mà, hỗ trợ in đậm, tiêu đề, blockquote, danh sách, mã code và hiệu ứng streaming cursor
export default function MarkdownRenderer({ content, isStreaming = false, className = '' }) {
  if (!content) return null

  // Tách nội dung theo dòng
  const lines = content.split('\n')
  const elements = []
  let listItems = []
  let inBlockquote = false
  let blockquoteLines = []

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="space-y-1 my-2 ml-4 list-disc text-[var(--text-main)]">
          {listItems.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const flushBlockquote = (key) => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote
          key={`bq-${key}`}
          className="border-l-3 border-primary-500 pl-3 py-1.5 my-2.5 bg-primary-500/5 rounded-r-xl text-[var(--text-muted)] italic text-xs leading-relaxed"
        >
          {blockquoteLines.map((line, i) => (
            <div key={i}>{renderInline(line)}</div>
          ))}
        </blockquote>
      )
      blockquoteLines = []
      inBlockquote = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // 1. Đường kẻ ngang
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(index)
      flushBlockquote(index)
      elements.push(<hr key={index} className="my-3 border-[var(--border-color)] opacity-60" />)
      return
    }

    // 2. Blockquote (dấu >)
    if (trimmed.startsWith('>')) {
      flushList(index)
      inBlockquote = true
      blockquoteLines.push(trimmed.replace(/^>\s*/, ''))
      return
    } else if (inBlockquote) {
      flushBlockquote(index)
    }

    // 3. Tiêu đề (###, ##, #)
    if (trimmed.startsWith('### ')) {
      flushList(index)
      elements.push(
        <h4 key={index} className="text-sm font-bold text-primary-400 mt-3 mb-1.5 flex items-center gap-1.5">
          {renderInline(trimmed.replace(/^###\s*/, ''))}
        </h4>
      )
      return
    }
    if (trimmed.startsWith('## ')) {
      flushList(index)
      elements.push(
        <h3 key={index} className="text-base font-extrabold text-[var(--text-main)] mt-3.5 mb-2">
          {renderInline(trimmed.replace(/^##\s*/, ''))}
        </h3>
      )
      return
    }
    if (trimmed.startsWith('# ')) {
      flushList(index)
      elements.push(
        <h2 key={index} className="text-lg font-black text-primary-400 mt-4 mb-2">
          {renderInline(trimmed.replace(/^#\s*/, ''))}
        </h2>
      )
      return
    }

    // 4. Danh sách bullet points (- hoặc *)
    if (trimmed.match(/^[-*]\s+/)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ''))
      return
    } else {
      flushList(index)
    }

    // 5. Dòng trống
    if (!trimmed) {
      elements.push(<div key={index} className="h-1.5" />)
      return
    }

    // 6. Đoạn văn thông thường
    elements.push(
      <p key={index} className="leading-relaxed my-1">
        {renderInline(line)}
      </p>
    )
  })

  flushList(lines.length)
  flushBlockquote(lines.length)

  return (
    <div className={`markdown-content leading-relaxed ${className}`}>
      {elements}
      {isStreaming && (
        <span
          className="inline-block w-2 h-4 ml-1.5 align-middle rounded-sm bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.85)]"
          title="Đang tạo phản hồi..."
        />
      )}
    </div>
  )
}

// Xử lý các định dạng nội dòng: in đậm (**), in nghiêng (*), code (`)
function renderInline(text) {
  if (!text) return null

  // Tách chuỗi theo các token markdown: **bold**, `code`, *italic*
  const tokens = []
  // Regex khớp với **bold**, `code`, *italic*
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Đoạn text trước match
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className="font-bold text-[var(--text-main)]">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-primary-500/15 text-primary-300 font-mono text-[11px] font-semibold border border-primary-500/20"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={match.index} className="italic text-[var(--text-muted)]">
          {token.slice(1, -1)}
        </em>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex))
  }

  return tokens.length > 0 ? tokens : text
}
