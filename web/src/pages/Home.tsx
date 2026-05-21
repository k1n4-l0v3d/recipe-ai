import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api, encodeRecipeId } from '../api/client'
import type { Category, RecipeSummary } from '../api/types'
import CategoryGrid from '../components/CategoryGrid'
import RecipeCard from '../components/RecipeCard'
import RouletteWheel from '../components/RouletteWheel'
import SkeletonCard from '../components/SkeletonCard'
import ComboSelector from '../components/ComboSelector'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Home() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const recipesRef = useRef<HTMLDivElement>(null)
  const [comboRecipes, setComboRecipes] = useState<RecipeSummary[]>([])
  const [comboLoading, setComboLoading] = useState(false)

  const handleRouletteResult = (cat: Category) => {
    handleCategorySelect(cat)
    setTimeout(() => {
      recipesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error)
  }, [])

  const handleComboResults = (results: RecipeSummary[]) => {
    setSelectedCategory(null)
    setRecipes([])
    setComboRecipes(prev => {
      const existingNames = new Set(prev.map(r => r.name.toLowerCase()))
      const unique = results.filter(r => !existingNames.has(r.name.toLowerCase()))
      return [...prev, ...unique]
    })
  }

  const handleComboNewSearch = () => {
    setComboRecipes([])
    setSelectedCategory(null)
    setRecipes([])
  }

  const handleCategorySelect = async (cat: Category) => {
    setComboRecipes([])
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

  const handleLoadMore = async () => {
    if (!selectedCategory || loadingMore) return
    setLoadingMore(true)
    try {
      const currentNames = recipes.map(r => r.name)
      const list = await api.getCategoryRecipes(selectedCategory.id, currentNames)
      // Client-side dedup as extra safety net
      const existingNames = new Set(currentNames.map(n => n.toLowerCase()))
      const unique = list.filter(r => !existingNames.has(r.name.toLowerCase()))
      setRecipes(prev => [...prev, ...unique])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
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
        padding: isMobile ? '36px 16px 32px' : '64px 24px 48px',
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
          style={{ fontSize: 'clamp(24px, 5vw, 44px)', fontWeight: 700, color: 'var(--text)', marginBottom: 12, fontFamily: 'var(--font-heading)' }}
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

        {/* Roulette — inside hero for seamless background */}
        {categories.length >= 2 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
              Не знаешь что приготовить?
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
              Испытай удачу 🎡
            </div>
            <RouletteWheel
              categories={categories}
              onResult={handleRouletteResult}
              disabled={recipesLoading}
            />
          </div>
        )}
      </div>

      {/* Categories + Recipes */}
      <div ref={recipesRef} style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '0 16px 48px' : '0 24px 48px' }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          Или выбери сам
        </div>

        <CategoryGrid
          categories={categories}
          selectedId={selectedCategory?.id ?? null}
          onSelect={handleCategorySelect}
          loading={recipesLoading}
        />

        <ComboSelector
          onResults={handleComboResults}
          onLoadingChange={setComboLoading}
          onNewSearch={handleComboNewSearch}
          loading={comboLoading}
        />

        {comboLoading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
            marginTop: 32,
          }}>
            {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {comboRecipes.length > 0 && !comboLoading && (
          <>
            <div style={{
              fontSize: 11,
              letterSpacing: 2,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              margin: '32px 0 16px',
            }}>
              Результаты подбора
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}>
              {comboRecipes.map((r, i) => (
                <RecipeCard key={`combo-${r.id}-${i}`} recipe={r} index={i} />
              ))}
            </div>
          </>
        )}

        {recipesLoading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
            marginTop: 32,
          }}>
            {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}>
              {recipes.map((r, i) => (
                <RecipeCard key={`${r.id}-${i}`} recipe={r} index={i} />
              ))}
            </div>

            {/* Load more button */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              {loadingMore ? (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ color: 'var(--text-3)', fontSize: 14 }}
                >
                  🔥 Генерирую ещё рецепты...
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLoadMore}
                  style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 24,
                    padding: '12px 32px',
                    color: 'var(--accent)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: 1,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                >
                  Ещё рецепты →
                </motion.button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.main>
  )
}
