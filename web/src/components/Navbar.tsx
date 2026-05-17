import { Link, useLocation } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Navbar() {
  const location = useLocation()
  const isMobile = useIsMobile()

  const handleRecipesClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
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

      <div style={{ display: 'flex', gap: isMobile ? 12 : 24, alignItems: 'center' }}>
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
        <span style={{
          fontSize: 11,
          color: 'var(--accent)',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          padding: '3px 8px',
          borderRadius: 20,
          letterSpacing: 0.5,
          whiteSpace: 'nowrap',
        }}>
          {isMobile ? 'AI' : 'AI Ассистент'}
        </span>
      </div>
    </nav>
  )
}
