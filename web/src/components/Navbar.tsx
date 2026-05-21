import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import AuthModal from './AuthModal'

export default function Navbar() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleRecipesClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <nav style={{
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
        padding: `0 ${isMobile ? 16 : 24}px`,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, letterSpacing: 2, fontFamily: 'var(--font-heading)' }}>ВКУСНО</span>
        </Link>

        <div style={{ display: 'flex', gap: isMobile ? 10 : 20, alignItems: 'center' }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              cursor: 'pointer', fontSize: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link
            to="/"
            onClick={handleRecipesClick}
            style={{
              fontSize: 13,
              color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-2)',
              textDecoration: 'none',
            }}
          >
            Рецепты
          </Link>

          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                aria-label="Меню пользователя"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-3)', border: '1px solid var(--border-2)',
                  borderRadius: 20, padding: '4px 12px 4px 4px',
                  cursor: 'pointer', minHeight: 40,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff6b35, #ff4500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {initial}
                </div>
                {!isMobile && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{user.name}</span>}
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>▾</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: 'var(--bg-2)', border: '1px solid var(--border-2)',
                  borderRadius: 12, minWidth: 210, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 300,
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff6b35, #ff4500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {initial}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{user.email}</div>
                    </div>
                  </div>

                  <div style={{ padding: '6px 0' }}>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', fontSize: 13, color: 'var(--text-2)', textDecoration: 'none',
                    }}>
                      👤 Личный кабинет
                    </Link>
                    <Link to="/profile#favorites" onClick={() => setDropdownOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', fontSize: 13, color: 'var(--text-2)', textDecoration: 'none',
                    }}>
                      ❤️ Избранные рецепты
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', fontSize: 13, color: 'var(--accent)', textDecoration: 'none',
                      }}>
                        ⚙️ Админ-панель
                      </Link>
                    )}
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 16px', fontSize: 13,
                        color: '#ef4444', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left', minHeight: 44,
                      }}
                    >
                      ↪ Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 20, padding: '8px 18px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40,
              }}
            >
              Войти
            </button>
          )}
        </div>
      </nav>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
