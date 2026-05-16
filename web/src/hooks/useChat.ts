import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, SSEEvent } from '../api/types'

interface UseChatOptions {
  recipeContext?: string
}

interface UseChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  sources: string[]
  sendMessage: (text: string) => Promise<void>
  clearMessages: () => void
}

export function useChat({ recipeContext = '' }: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sources, setSources] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)
    setSources([])

    // Reserve a slot for the assistant response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          recipe_context: recipeContext,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          const event: SSEEvent = JSON.parse(raw)

          if (event.type === 'token' && event.content) {
            setMessages(prev => {
              const next = [...prev]
              const last = next[next.length - 1]
              next[next.length - 1] = { ...last, content: last.content + event.content }
              return next
            })
          } else if (event.type === 'sources' && event.sources) {
            setSources(event.sources)
          } else if (event.type === 'done') {
            break
          } else if (event.type === 'error') {
            setMessages(prev => {
              const next = [...prev]
              next[next.length - 1] = { role: 'assistant', content: event.content ?? 'Произошла ошибка' }
              return next
            })
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: 'Не удалось получить ответ. Попробуй ещё раз.' }
          return next
        })
      }
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming, recipeContext])

  const clearMessages = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setSources([])
  }, [])

  return { messages, isStreaming, sources, sendMessage, clearMessages }
}
