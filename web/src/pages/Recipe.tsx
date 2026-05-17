import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import type { Recipe as RecipeType } from '../api/types'
import RecipeDetail from '../components/RecipeDetail'
import ChatPanel from '../components/ChatPanel'
import FavoriteButton from '../components/FavoriteButton'
import { useChat } from '../hooks/useChat'
import { useIsMobile } from '../hooks/useIsMobile'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../context/AuthContext'

export default function Recipe() {
  const { id } = useParams<{ id: string }>()
  const [recipe, setRecipe] = useState<RecipeType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { addToHistory } = useHistory()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    api.getRecipe(id)
      .then(setRecipe)
      .catch(() => setError('Не удалось загрузить рецепт'))
      .finally(() => setLoading(false))
  }, [id])

  // Record view in history when recipe loads
  useEffect(() => {
    if (recipe && user) {
      addToHistory(recipe.id, recipe.name, recipe.image_keyword ?? '')
    }
  }, [recipe?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, isStreaming, sources, sendMessage } = useChat({
    recipeContext: recipe ? `${recipe.name} (${recipe.cuisine})` : '',
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 16 }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontSize: 40 }}
        >
          🔥
        </motion.div>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Генерирую рецепт...</p>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--text-2)' }}>{error ?? 'Рецепт не найден'}</p>
        <Link to="/" style={{ color: 'var(--accent)', fontSize: 13 }}>← На главную</Link>
      </div>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        // On desktop: fixed height with internal scroll. On mobile: natural scroll.
        maxHeight: isMobile ? 'none' : 'calc(100vh - 56px)',
      }}
    >
      {/* Back link + Favorite button */}
      <div style={{
        padding: isMobile ? '10px 16px' : '12px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <Link to="/" style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          ← Все рецепты
        </Link>
        {recipe && (
          <FavoriteButton
            recipeId={recipe.id}
            recipeName={recipe.name}
            imageKeyword={recipe.image_keyword}
          />
        )}
      </div>

      {isMobile ? (
        // Mobile: stacked layout — recipe on top, chat below
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Recipe detail scrolls naturally */}
          <div style={{ padding: '0 0 8px' }}>
            <RecipeDetail recipe={recipe} />
          </div>

          {/* Chat panel with fixed height */}
          <div style={{
            borderTop: '1px solid var(--border)',
            height: 420,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <ChatPanel
              messages={messages}
              isStreaming={isStreaming}
              sources={sources}
              onSend={sendMessage}
            />
          </div>
        </div>
      ) : (
        // Desktop: side-by-side split layout
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          overflow: 'hidden',
        }}>
          <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            <RecipeDetail recipe={recipe} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ChatPanel
              messages={messages}
              isStreaming={isStreaming}
              sources={sources}
              onSend={sendMessage}
            />
          </div>
        </div>
      )}
    </motion.main>
  )
}
