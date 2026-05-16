import { motion } from 'framer-motion'
import type { Category } from '../api/types'

interface Props {
  categories: Category[]
  selectedId: string | null
  onSelect: (category: Category) => void
  loading: boolean
}

export default function CategoryGrid({ categories, selectedId, onSelect, loading }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {categories.map((cat, i) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => !loading && onSelect(cat)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: `1px solid ${selectedId === cat.id ? 'var(--accent)' : 'var(--border-2)'}`,
            background: selectedId === cat.id ? 'var(--accent-glow)' : 'var(--bg-3)',
            color: selectedId === cat.id ? 'var(--accent)' : 'var(--text-2)',
            fontSize: 13,
            fontWeight: selectedId === cat.id ? 600 : 400,
            cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.2s',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: 18 }}>{cat.emoji}</span>
          {cat.name}
        </motion.button>
      ))}
    </div>
  )
}
