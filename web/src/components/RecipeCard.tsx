import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { RecipeSummary } from '../api/types'

interface Props {
  recipe: RecipeSummary
  index: number
}

const difficultyColor: Record<string, string> = {
  'Легко': '#22c55e',
  'Средне': '#f59e0b',
  'Сложно': '#ef4444',
}

export default function RecipeCard({ recipe, index }: Props) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(255,107,53,0.12)' }}
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
        {recipe.name}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
        {recipe.description}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>⏱ {recipe.time}</span>
        <span style={{
          fontSize: 11,
          color: difficultyColor[recipe.difficulty] ?? 'var(--text-2)',
          fontWeight: 600,
        }}>
          {recipe.difficulty}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {recipe.tags.slice(0, 3).map(tag => (
          <span key={tag} style={{
            fontSize: 10,
            padding: '3px 8px',
            borderRadius: 8,
            background: 'var(--accent-glow)',
            color: 'var(--accent)',
            border: '1px solid rgba(255,107,53,0.2)',
          }}>
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
