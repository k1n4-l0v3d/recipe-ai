import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage } from '../api/types'

interface Props {
  messages: ChatMessage[]
  isStreaming: boolean
  sources: string[]
  onSend: (text: string) => void
}

export default function ChatPanel({ messages, isStreaming, sources, onSend }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    onSend(text)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0a0a',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <motion.div
          animate={{ opacity: isStreaming ? [0.5, 1, 0.5] : 1 }}
          transition={{ repeat: isStreaming ? Infinity : 0, duration: 1 }}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--accent)', letterSpacing: 1 }}>AI Ассистент</span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: 12,
            marginTop: 24,
            lineHeight: 1.8,
          }}>
            Спроси меня о рецепте 👨‍🍳<br />
            Я помогу с заменой ингредиентов,<br />
            техниками и многим другим
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? 'rgba(255,107,53,0.15)' : 'var(--bg-3)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(255,107,53,0.3)' : 'var(--border)'}`,
                fontSize: 12,
                color: msg.role === 'user' ? 'var(--accent-2)' : 'var(--text-2)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
                {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    style={{ marginLeft: 2 }}
                  >
                    ▌
                  </motion.span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sources.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            📎 Источники:{' '}
            {sources.map((url, i) => (
              <span key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--text-3)', textDecoration: 'underline' }}>
                  {i + 1}
                </a>
                {i < sources.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          background: 'var(--bg-3)',
          border: '1px solid var(--border-2)',
          borderRadius: 20,
          padding: '2px 2px 2px 14px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Спроси про этот рецепт..."
            disabled={isStreaming}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 12,
              opacity: isStreaming ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            aria-label="Отправить"
            disabled={isStreaming || !input.trim()}
            style={{
              background: isStreaming || !input.trim() ? 'var(--bg-3)' : 'var(--accent)',
              border: 'none',
              borderRadius: 18,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: isStreaming || !input.trim() ? 'var(--text-3)' : '#fff',
              cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
      </form>
    </div>
  )
}
