import { motion } from 'framer-motion'
import type { Recipe } from '../api/types'

interface Props {
  recipe: Recipe
}

const difficultyColor: Record<string, string> = {
  'Легко': '#22c55e',
  'Средне': '#f59e0b',
  'Сложно': '#ef4444',
}

export default function RecipeDetail({ recipe }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%', overflowY: 'auto', padding: 24 }}
    >
      {/* Hero image */}
      <div style={{
        width: '100%',
        height: 220,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        background: 'var(--bg-3)',
        flexShrink: 0,
      }}>
        <img
          src={`https://source.unsplash.com/featured/800x440/?${encodeURIComponent(recipe.name)},food`}
          alt={recipe.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
        />
      </div>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          {recipe.cuisine} · {recipe.time}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          {recipe.name}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
          {recipe.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          <span style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 10,
            background: `${difficultyColor[recipe.difficulty] ?? '#888'}22`,
            color: difficultyColor[recipe.difficulty] ?? 'var(--text-2)',
            border: `1px solid ${difficultyColor[recipe.difficulty] ?? '#888'}44`,
          }}>
            {recipe.difficulty}
          </span>
          {recipe.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 10,
              background: 'var(--accent-glow)',
              color: 'var(--accent)',
              border: '1px solid rgba(255,107,53,0.2)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 1, background: 'var(--border)', marginBottom: 20 }} />

      {/* Ingredients */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Ингредиенты
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recipe.ingredients.map((ing, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-2)' }}>{ing.name}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{ing.amount}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Приготовление
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recipe.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <span style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--accent-glow)',
                border: '1px solid rgba(255,107,53,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'var(--accent)',
                fontWeight: 700,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{step}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sources */}
      {recipe.sources && recipe.sources.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          📎 Источники:{' '}
          {recipe.sources.map((url, i) => {
            let hostname = url
            try { hostname = new URL(url).hostname } catch { /* keep raw url */ }
            return (
              <span key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--text-3)', textDecoration: 'underline' }}>
                  {hostname}
                </a>
                {i < recipe.sources.length - 1 ? ', ' : ''}
              </span>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
