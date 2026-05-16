import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api, encodeRecipeId } from '../api/client'
import type { Category, RecipeSummary } from '../api/types'
import CategoryGrid from '../components/CategoryGrid'
import RecipeCard from '../components/RecipeCard'

export default function Home() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error)
  }, [])

  const handleCategorySelect = async (cat: Category) => {
    setSelectedCategory(cat)
    setRecipes([])
    setRecipesLoading(true)
    try {
      const list = await api.getCategoryRecipes(cat.id)
      setRecipes(list)
    } catch (err) {
      console.error(err)
    } finally {
      setRecipesLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const id = encodeRecipeId(searchQuery.trim())
    navigate(`/recipe/${id}`)
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1 }}
    >
      {/* Hero */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '64px 24px 48px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,107,53,0.05) 0%, transparent 100%)',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 200,
          background: 'radial-gradient(ellipse, rgba(255,107,53,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}
        >
          AI Кулинарный ассистент
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}
        >
          Найди идеальный рецепт
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 32 }}
        >
          Спроси AI — он найдёт рецепт из миллионов источников
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSearch}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: 'var(--bg-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 28,
            padding: '2px 2px 2px 20px',
            width: '100%',
            maxWidth: 480,
          }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Что приготовить сегодня?"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 24,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              →
            </button>
          </div>
        </motion.form>
      </div>

      {/* Categories + Recipes */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          Категории
        </div>

        <CategoryGrid
          categories={categories}
          selectedId={selectedCategory?.id ?? null}
          onSelect={handleCategorySelect}
          loading={recipesLoading}
        />

        {recipesLoading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🔥 Генерирую рецепты...
            </motion.div>
          </div>
        )}

        {recipes.length > 0 && (
          <>
            <div style={{
              fontSize: 11,
              letterSpacing: 2,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              margin: '32px 0 16px',
            }}>
              {selectedCategory?.emoji} {selectedCategory?.name}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}>
              {recipes.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.main>
  )
}
