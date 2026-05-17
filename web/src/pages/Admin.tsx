import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import AdminStats from '../components/AdminStats'
import AdminUsers from '../components/AdminUsers'
import AdminSessions from '../components/AdminSessions'
import { useIsMobile } from '../hooks/useIsMobile'

type Section = 'stats' | 'users' | 'sessions'

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'stats', label: 'Статистика', icon: '📊' },
  { id: 'users', label: 'Пользователи', icon: '👥' },
  { id: 'sessions', label: 'Сессии', icon: '🔐' },
]

export default function Admin() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [section, setSection] = useState<Section>('stats')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) navigate('/')
  }, [user, loading, navigate])

  if (loading || !user || user.role !== 'admin') return null

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        maxHeight: isMobile ? 'none' : 'calc(100vh - 56px)',
      }}
    >
      {/* Sidebar / top nav on mobile */}
      <div style={{
        width: isMobile ? '100%' : 220,
        flexShrink: 0,
        background: '#0a0a0a',
        borderRight: isMobile ? 'none' : '1px solid var(--border)',
        borderBottom: isMobile ? '1px solid var(--border)' : 'none',
        padding: isMobile ? '8px' : '20px 8px',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        gap: 4,
        overflowX: isMobile ? 'auto' : 'visible',
      }}>
        {!isMobile && (
          <div style={{ padding: '4px 12px 14px', fontSize: 11, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Админ-панель
          </div>
        )}
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: isMobile ? '8px 14px' : '10px 14px',
              borderRadius: 8, fontSize: 13,
              background: section === s.id ? 'var(--accent-glow)' : 'none',
              color: section === s.id ? 'var(--accent)' : 'var(--text-3)',
              border: section === s.id ? '1px solid rgba(255,107,53,0.3)' : '1px solid transparent',
              fontWeight: section === s.id ? 600 : 400,
              cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '28px' }}>
        {section === 'stats' && <AdminStats />}
        {section === 'users' && <AdminUsers />}
        {section === 'sessions' && <AdminSessions />}
      </div>
    </motion.main>
  )
}
