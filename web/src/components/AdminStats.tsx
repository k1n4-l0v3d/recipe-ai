import { useState, useEffect } from 'react'
import { adminApi } from '../api/admin'
import type { AdminStats } from '../api/types'

const CARDS = [
  { key: 'total_users' as keyof AdminStats, label: 'Всего пользователей', color: '#38bdf8', icon: '👥' },
  { key: 'active_sessions' as keyof AdminStats, label: 'Активных сессий', color: '#22c55e', icon: '🔐' },
  { key: 'total_favorites' as keyof AdminStats, label: 'Всего избранных', color: '#ef4444', icon: '❤️' },
  { key: 'new_users_week' as keyof AdminStats, label: 'Новых за неделю', color: '#ff6b35', icon: '📈' },
]

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
  if (error) return <div style={{ color: '#ef4444', padding: 20 }}>{error}</div>
  if (!stats) return null

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20, fontFamily: 'var(--font-heading)' }}>
        📊 Статистика
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {CARDS.map(card => (
          <div key={card.key} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>
              {stats[card.key].toLocaleString('ru')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
