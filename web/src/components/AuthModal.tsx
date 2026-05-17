import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

interface Props {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'login' | 'register'

export default function AuthModal({ isOpen, onClose }: Props) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setName(''); setEmail(''); setPassword(''); setError('') }
  const switchTab = (t: Tab) => { setTab(t); reset() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    color: 'var(--text)', fontSize: 16, outline: 'none',
    touchAction: 'manipulation',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--text-3)', letterSpacing: 1,
    textTransform: 'uppercase', display: 'block', marginBottom: 4,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 200,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 420,
              padding: '0 16px',
              zIndex: 201,
            }}
          >
            <div style={{
              background: '#111',
              border: '1px solid var(--border-2)',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
                  {tab === 'login' ? 'Войти' : 'Регистрация'}
                </span>
                <button
                  onClick={onClose}
                  aria-label="Закрыть"
                  style={{ fontSize: 22, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '4px 8px', minHeight: 44 }}
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 8, padding: 3 }}>
                  {(['login', 'register'] as Tab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => switchTab(t)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 6,
                        fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                        transition: 'all 0.2s', minHeight: 44,
                        background: tab === t ? 'var(--accent)' : 'none',
                        color: tab === t ? '#fff' : 'var(--text-3)',
                      }}
                    >
                      {t === 'login' ? 'Войти' : 'Регистрация'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tab === 'register' && (
                  <div>
                    <label style={labelStyle}>Имя</label>
                    <input
                      value={name} onChange={e => setName(e.target.value)}
                      placeholder="Ваше имя" required style={inputStyle}
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="example@mail.ru" required style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Пароль</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={tab === 'register' ? 'Минимум 8 символов' : '••••••••'}
                    required style={inputStyle}
                  />
                </div>

                {error && (
                  <div style={{ fontSize: 12, color: '#ef4444', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? 'var(--bg-3)' : 'linear-gradient(135deg, #ff6b35, #ff4500)',
                    color: loading ? 'var(--text-3)' : '#fff',
                    border: 'none', borderRadius: 8, padding: '13px',
                    fontSize: 14, fontWeight: 600, minHeight: 48,
                    cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
                    boxShadow: loading ? 'none' : '0 0 20px rgba(255,107,53,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? '⏳ Загрузка...' : (tab === 'login' ? 'Войти →' : 'Создать аккаунт →')}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
