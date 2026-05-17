import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'
import type { SessionInfo } from '../api/types'

function fmt(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return isoStr }
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getSessions()
      .then(data => setSessions(data ?? []))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const terminate = async (s: SessionInfo) => {
    if (!window.confirm(`Завершить сессию пользователя ${s.user_name}?`)) return
    try {
      await adminApi.terminateSession(s.id)
      setSessions(prev => prev.filter(x => x.id !== s.id))
    } catch (e) { alert((e as Error).message) }
  }

  if (loading) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
  if (error) return <div style={{ color: '#ef4444', padding: 20 }}>{error}</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
          🔐 Активные сессии <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>({sessions.length})</span>
        </div>
        <button onClick={load} style={{
          background: 'none', border: '1px solid var(--border-2)', borderRadius: 8,
          padding: '6px 14px', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', minHeight: 36,
        }}>
          ↻ Обновить
        </button>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.2fr 110px 110px 80px',
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1,
          minWidth: 560,
        }}>
          <span>Пользователь</span><span>Email</span><span>Создана</span><span>Истекает</span><span>Действие</span>
        </div>

        {sessions.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Нет активных сессий
          </div>
        )}

        {sessions.map(s => (
          <div key={s.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 1.2fr 110px 110px 80px',
            padding: '12px 16px', borderBottom: '1px solid #0d0d0d', alignItems: 'center',
            minWidth: 560,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{s.user_name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
              {s.user_email}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(s.created_at)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(s.expires_at)}</span>
            <button onClick={() => terminate(s)} style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#ef4444',
              cursor: 'pointer', minHeight: 28,
            }}>
              завершить
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
