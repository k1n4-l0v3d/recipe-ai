import { motion } from 'framer-motion'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../context/AuthContext'

interface Props {
  recipeId: string
  recipeName: string
  imageKeyword?: string
}

export default function FavoriteButton({ recipeId, recipeName, imageKeyword = '' }: Props) {
  const { user } = useAuth()
  const { isFavorite, toggle } = useFavorites()

  if (!user) return null

  const fav = isFavorite(recipeId)

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => toggle(recipeId, recipeName, imageKeyword)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: fav ? 'rgba(239,68,68,0.15)' : 'var(--bg-3)',
        border: `1px solid ${fav ? '#ef4444' : 'var(--border-2)'}`,
        borderRadius: 20,
        padding: '8px 16px',
        color: fav ? '#ef4444' : 'var(--text-2)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        minHeight: 44,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {fav ? '❤️' : '🤍'} {fav ? 'Убрать из избранного' : 'В избранное'}
    </motion.button>
  )
}
