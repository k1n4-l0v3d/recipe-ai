import { useState, useEffect } from 'react'
import { adminApi } from '../api/admin'
import { useAuth } from '../context/AuthContext'
import type { User } from '../api/types'

function formatDate(isoStr: string): string {
  try { return new Date(isoStr).toLocaleDateString('ru-RU') } catch { return isoStr }
}

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getUsers()
      .then(data => setUsers(data ?? []))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const toggleRole = async (u: User) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? 'назначить администратором' : 'снять права администратора'
    if (!window.confirm(`${action} пользователя ${u.name}?`)) return
    try {
      await adminApi.setRole(u.id, newRole)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    } catch (e) { alert((e as Error).message) }
  }

  const toggleBan = async (u: User) => {
    const action = u.is_banned ? 'разблокировать' : 'заблокировать'
    if (!window.confirm(`${action} пользователя ${u.name}?`)) return
    try {
      await adminApi.setBan(u.id, !u.is_banned)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_banned: !u.is_banned } : x))
    } catch (e) { alert((e as Error).message) }
  }

  if (loading) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
  if (error) return <div style={{ color: '#ef4444', padding: 20 }}>{error}</div>

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20, fontFamily: 'var(--font-heading)' }}>
        👥 Пользователи <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>({users.length})</span>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.5fr 90px 100px 130px',
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1,
          minWidth: 580,
        }}>
          <span>Имя</span><span>Email</span><span>Роль</span><span>Дата</span><span>Действия</span>
        </div>

        {users.map(u => (
          <div key={u.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 1.5fr 90px 100px 130px',
            padding: '12px 16px', borderBottom: '1px solid #0d0d0d', alignItems: 'center',
            opacity: u.is_banned ? 0.45 : 1, transition: 'opacity 0.2s',
            minWidth: 580,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: u.id === me?.id ? 600 : 400 }}>
              {u.name}{u.id === me?.id && <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>(вы)</span>}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
              {u.email}
            </span>
            <span>
              <span style={{
                padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                background: u.is_banned ? 'rgba(239,68,68,0.15)' : u.role === 'admin' ? 'rgba(255,107,53,0.15)' : 'var(--bg-3)',
                color: u.is_banned ? '#ef4444' : u.role === 'admin' ? 'var(--accent)' : 'var(--text-3)',
              }}>
                {u.is_banned ? 'banned' : u.role}
              </span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatDate(u.created_at)}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {u.id !== me?.id && (
                <>
                  <button onClick={() => toggleRole(u)} style={{
                    background: u.role === 'admin' ? 'rgba(255,107,53,0.15)' : 'rgba(56,189,248,0.15)',
                    border: `1px solid ${u.role === 'admin' ? 'rgba(255,107,53,0.4)' : 'rgba(56,189,248,0.4)'}`,
                    borderRadius: 6, padding: '4px 8px', fontSize: 10,
                    color: u.role === 'admin' ? 'var(--accent)' : '#38bdf8',
                    cursor: 'pointer', minHeight: 28,
                  }}>
                    {u.role === 'admin' ? '→user' : '→admin'}
                  </button>
                  <button onClick={() => toggleBan(u)} style={{
                    background: u.is_banned ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${u.is_banned ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    borderRadius: 6, padding: '4px 8px', fontSize: 10,
                    color: u.is_banned ? '#22c55e' : '#ef4444',
                    cursor: 'pointer', minHeight: 28,
                  }}>
                    {u.is_banned ? 'разбан' : 'бан'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
