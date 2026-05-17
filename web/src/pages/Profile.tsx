import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import ProfileEdit from '../components/ProfileEdit'
import FavoritesList from '../components/FavoritesList'
import HistoryList from '../components/HistoryList'
import NotesList from '../components/NotesList'

type Tab = 'profile' | 'favorites' | 'history' | 'notes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: '👤 Профиль' },
  { id: 'favorites', label: '❤️ Избранное' },
  { id: 'history', label: '🕓 История' },
  { id: 'notes', label: '📝 Заметки' },
]

export default function Profile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user) navigate('/')
  }, [user, loading, navigate])

  const hash = location.hash.replace('#', '') as Tab
  const activeTab: Tab = TABS.find(t => t.id === hash) ? hash : 'profile'
  const setTab = (tab: Tab) => navigate(`/profile#${tab}`, { replace: true })

  if (loading || !user) return null

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px', width: '100%' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#ff6b35,#ff4500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{user.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-3)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minHeight: 44,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileEdit />}
      {activeTab === 'favorites' && <FavoritesList />}
      {activeTab === 'history' && <HistoryList />}
      {activeTab === 'notes' && <NotesList />}
    </motion.main>
  )
}
