import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import type { RecipeSummary } from '../api/types'

const MAIN_OPTIONS = [
  { emoji: '🍗', label: 'Курица' },
  { emoji: '🥩', label: 'Говядина' },
  { emoji: '🐷', label: 'Свинина' },
  { emoji: '🐟', label: 'Рыба' },
  { emoji: '🦐', label: 'Морепродукты' },
  { emoji: '🐑', label: 'Баранина' },
  { emoji: '🦃', label: 'Индейка' },
  { emoji: '🍄', label: 'Грибы' },
  { emoji: '🫘', label: 'Тофу' },
]

const SIDE_OPTIONS = [
  { emoji: '🍚', label: 'Рис' },
  { emoji: '🥔', label: 'Картофель' },
  { emoji: '🍝', label: 'Паста' },
  { emoji: '🌾', label: 'Гречка' },
  { emoji: '🥦', label: 'Овощи' },
  { emoji: '🌿', label: 'Булгур' },
  { emoji: '🫛', label: 'Чечевица' },
  { emoji: '🥣', label: 'Пюре' },
  { emoji: '🥗', label: 'Салат' },
]

interface Props {
  onResults: (recipes: RecipeSummary[]) => void
  onLoadingChange: (loading: boolean) => void
  onNewSearch: () => void
  loading: boolean
}

export default function ComboSelector({ onResults, onLoadingChange, onNewSearch, loading }: Props) {
  const [selectedMain, setSelectedMain] = useState<string>('')
  const [selectedSide, setSelectedSide] = useState<string>('')
  const [mainCustom, setMainCustom] = useState(false)
  const [sideCustom, setSideCustom] = useState(false)
  const [mainText, setMainText] = useState('')
  const [sideText, setSideText] = useState('')
  const [exclude, setExclude] = useState<string[]>([])
  const [hasResults, setHasResults] = useState(false)

  const effectiveMain = mainCustom ? mainText.trim() : selectedMain
  const effectiveSide = sideCustom ? sideText.trim() : selectedSide
  const canSearch = effectiveMain !== '' || effectiveSide !== ''

  const handleSearch = async (currentExclude: string[] = []) => {
    if (!canSearch) return
    onLoadingChange(true)
    try {
      const results = await api.getComboRecipes(effectiveMain, effectiveSide, currentExclude)
      onResults(results)
      setExclude(prev => [...prev, ...results.map(r => r.name)])
      setHasResults(true)
    } catch (err) {
      console.error(err)
    } finally {
      onLoadingChange(false)
    }
  }

  const handleLoadMore = () => handleSearch(exclude)

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 13px',
    minHeight: 36,
    borderRadius: 20,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
    background: active ? 'var(--accent-glow)' : 'var(--bg-3)',
    color: active ? 'var(--accent)' : 'var(--text-2)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: loading ? 'wait' : 'pointer',
    transition: 'all 0.18s',
    touchAction: 'manipulation',
  })

  const inputStyle: React.CSSProperties = {
    padding: '9px 16px',
    borderRadius: 20,
    border: '1px solid var(--border-2)',
    background: 'var(--bg-3)',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    width: 200,
    minHeight: 36,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        marginTop: 32,
        background: 'var(--bg-2)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(255,107,53,0.05), 0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Accent top bar */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #ff6b35 0%, #ff4500 50%, transparent 100%)',
      }} />

      <div style={{ padding: '20px 24px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,107,53,0.15)',
            border: '1px solid rgba(255,107,53,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            🎯
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
              Подбери по составу
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              Выбери ингредиент — AI найдёт рецепты
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Основное блюдо */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            }}>
              <div style={{
                width: 4, height: 14, borderRadius: 2,
                background: 'var(--accent)', flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Основное блюдо
              </span>
              {effectiveMain && (
                <span style={{
                  fontSize: 11, color: 'var(--accent)',
                  background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
                  padding: '2px 8px', borderRadius: 10,
                }}>
                  {effectiveMain}
                </span>
              )}
            </div>

            {mainCustom ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    autoFocus
                    value={mainText}
                    onChange={e => setMainText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && mainText.trim()) {
                        setExclude([]); setHasResults(false); onNewSearch()
                        handleSearch([])
                      }
                    }}
                    placeholder="Например: кальмары, тунец..."
                    style={inputStyle}
                  />
                  <button
                    onClick={() => { setMainCustom(false); setMainText('') }}
                    aria-label="Вернуться к списку"
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '4px 8px' }}
                  >
                    ×
                  </button>
                </div>
                {mainText.trim() && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', paddingLeft: 4 }}>
                    Нажми <kbd style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Enter</kbd> или кнопку «Найти рецепты» ↓
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MAIN_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMain(prev => prev === opt.label ? '' : opt.label)}
                    style={chipStyle(selectedMain === opt.label)}
                  >
                    {opt.emoji} {opt.label}
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setMainCustom(true); setSelectedMain('') }}
                  style={{ ...chipStyle(false), color: 'var(--text-3)' }}
                >
                  ✏️ Другое
                </motion.button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Гарнир */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 4, height: 14, borderRadius: 2,
                background: '#e0a060', flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Гарнир
              </span>
              {effectiveSide && (
                <span style={{
                  fontSize: 11, color: '#e0a060',
                  background: 'rgba(224,160,96,0.1)', border: '1px solid rgba(224,160,96,0.2)',
                  padding: '2px 8px', borderRadius: 10,
                }}>
                  {effectiveSide}
                </span>
              )}
            </div>

            {sideCustom ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    autoFocus
                    value={sideText}
                    onChange={e => setSideText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && sideText.trim()) {
                        setExclude([]); setHasResults(false); onNewSearch()
                        handleSearch([])
                      }
                    }}
                    placeholder="Например: кускус, нут..."
                    style={inputStyle}
                  />
                  <button
                    onClick={() => { setSideCustom(false); setSideText('') }}
                    aria-label="Вернуться к списку"
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '4px 8px' }}
                  >
                    ×
                  </button>
                </div>
                {sideText.trim() && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', paddingLeft: 4 }}>
                    Нажми <kbd style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Enter</kbd> или кнопку «Найти рецепты» ↓
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SIDE_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSide(prev => prev === opt.label ? '' : opt.label)}
                    style={chipStyle(selectedSide === opt.label)}
                  >
                    {opt.emoji} {opt.label}
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSideCustom(true); setSelectedSide('') }}
                  style={{ ...chipStyle(false), color: 'var(--text-3)' }}
                >
                  ✏️ Другое
                </motion.button>
              </div>
            )}
          </div>

          {/* CTA row */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10,
            paddingTop: 4,
          }}>
            {hasResults && !loading && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLoadMore}
                style={{
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 24, padding: '10px 20px',
                  color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', minHeight: 44,
                }}
              >
                Ещё рецепты →
              </motion.button>
            )}

            <motion.button
              whileHover={canSearch && !loading ? { scale: 1.02 } : {}}
              whileTap={canSearch && !loading ? { scale: 0.97 } : {}}
              onClick={() => { setExclude([]); setHasResults(false); onNewSearch(); handleSearch([]) }}
              disabled={!canSearch || loading}
              style={{
                background: canSearch
                  ? 'linear-gradient(135deg, #ff6b35 0%, #ff4500 100%)'
                  : 'var(--bg-3)',
                border: canSearch ? 'none' : '1px solid var(--border)',
                borderRadius: 24, padding: '10px 28px',
                color: canSearch ? '#fff' : 'var(--text-3)',
                fontSize: 13, fontWeight: 700,
                cursor: canSearch && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: canSearch ? '0 0 20px rgba(255,107,53,0.35)' : 'none',
                minHeight: 44,
                letterSpacing: 0.3,
              }}
            >
              {loading ? '⏳ Ищу...' : '🔍 Найти рецепты'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
