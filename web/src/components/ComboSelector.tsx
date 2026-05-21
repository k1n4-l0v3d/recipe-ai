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
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    minHeight: 36,
    borderRadius: 20,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
    background: active ? 'var(--accent-glow)' : 'var(--bg-3)',
    color: active ? 'var(--accent)' : 'var(--text-2)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: loading ? 'wait' : 'pointer',
    transition: 'all 0.2s',
  })

  const inputStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 20,
    border: '1px solid var(--border-2)',
    background: 'var(--bg-3)',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    width: 200,
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 14 }}>
        Подбери по составу
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Основное блюдо */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Основное блюдо</div>
          {mainCustom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input autoFocus value={mainText} onChange={e => setMainText(e.target.value)} placeholder="Введите продукт..." style={inputStyle} />
              <button onClick={() => { setMainCustom(false); setMainText('') }}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MAIN_OPTIONS.map(opt => (
                <motion.button key={opt.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedMain(prev => prev === opt.label ? '' : opt.label)}
                  style={chipStyle(selectedMain === opt.label)}>
                  <span>{opt.emoji}</span> {opt.label}
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setMainCustom(true); setSelectedMain('') }}
                style={chipStyle(false)}>
                ✏️ Другое
              </motion.button>
            </div>
          )}
        </div>

        {/* Гарнир */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Гарнир</div>
          {sideCustom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input autoFocus value={sideText} onChange={e => setSideText(e.target.value)} placeholder="Введите гарнир..." style={inputStyle} />
              <button onClick={() => { setSideCustom(false); setSideText('') }}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIDE_OPTIONS.map(opt => (
                <motion.button key={opt.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedSide(prev => prev === opt.label ? '' : opt.label)}
                  style={chipStyle(selectedSide === opt.label)}>
                  <span>{opt.emoji}</span> {opt.label}
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setSideCustom(true); setSelectedSide('') }}
                style={chipStyle(false)}>
                ✏️ Другое
              </motion.button>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
          {hasResults && !loading && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleLoadMore}
              style={{
                background: 'var(--bg-2)', border: '1px solid var(--border-2)',
                borderRadius: 24, padding: '10px 24px',
                color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              Ещё рецепты →
            </motion.button>
          )}
          <motion.button
            whileHover={canSearch ? { scale: 1.03 } : {}}
            whileTap={canSearch ? { scale: 0.97 } : {}}
            onClick={() => { setExclude([]); setHasResults(false); onNewSearch(); handleSearch([]) }}
            disabled={!canSearch || loading}
            style={{
              background: canSearch ? 'var(--accent)' : 'var(--bg-3)',
              border: 'none', borderRadius: 24, padding: '10px 28px',
              color: canSearch ? '#fff' : 'var(--text-3)',
              fontSize: 13, fontWeight: 600,
              cursor: canSearch && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: canSearch ? '0 0 16px rgba(255,107,53,0.3)' : 'none',
            }}>
            {loading ? 'Ищу...' : 'Найти рецепты →'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
