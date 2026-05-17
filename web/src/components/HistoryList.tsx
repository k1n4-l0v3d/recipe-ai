import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cabinetApi } from '../api/cabinet'
import type { RecipePreview } from '../api/types'

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин назад`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} ч назад`
  const days = Math.floor(hrs / 24)
  return `${days} дн назад`
}

export default function HistoryList() {
  const [items, setItems] = useState<RecipePreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    cabinetApi.getHistory().then(setItems).catch(console.error).finally(() => setLoading(false))
  }, [])

  const clear = async () => {
    if (!window.confirm('Очистить всю историю просмотров?')) return
    await cabinetApi.clearHistory()
    setItems([])
  }

  if (loading) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Загрузка...</div>

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🕓</div>
      <div style={{ fontSize: 14 }}>История пуста</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={clear} style={{
          background: 'none', border: '1px solid var(--border-2)', borderRadius: 8,
          padding: '6px 14px', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', minHeight: 36,
        }}>
          Очистить историю
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <Link key={i} to={`/recipe/${item.recipe_id}`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 8,
            border: '1px solid var(--border)', textDecoration: 'none',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.recipe_name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, marginLeft: 12 }}>
              {item.viewed_at ? timeAgo(item.viewed_at) : ''}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
