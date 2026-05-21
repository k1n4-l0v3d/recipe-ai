import { useRef, useState } from 'react'
import { useAnimate } from 'framer-motion'
import type { Category } from '../api/types'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props {
  categories: Category[]
  onResult: (cat: Category) => void
  disabled?: boolean
}

// Sector colors via CSS variables — automatically switch with theme
const SECTOR_CSS_VARS = [
  'var(--sector-0)', 'var(--sector-1)', 'var(--sector-2)', 'var(--sector-3)',
  'var(--sector-4)', 'var(--sector-5)', 'var(--sector-6)', 'var(--sector-7)',
]

// Spin easing: fast start, long ease-out with inertia feel
const SPIN_EASING = [0.17, 0.67, 0.12, 0.99] as const
const SPIN_DURATION = 3 // seconds
const MIN_ROTATIONS = 4 // full turns before stopping

// Arrow is fixed at top (0° in our clockwise-from-top coords).
// After rotating CW by R, sector at initial angle α ends up at (α + R) % 360.
// We want sector winnerCenter at 0° (top), so we need (winnerCenter + R) % 360 = 0,
// i.e. R = (360 - winnerCenter) % 360.
// We also account for currentRotation so repeated spins stay accurate.
function calcDelta(winnerIndex: number, total: number, currentRotation: number): number {
  const sectorAngle = 360 / total
  const winnerCenter = winnerIndex * sectorAngle + sectorAngle / 2
  const targetFinalAngle = (360 - winnerCenter) % 360
  const currentAngle = ((currentRotation % 360) + 360) % 360
  let delta = targetFinalAngle - currentAngle
  if (delta < 0) delta += 360
  return MIN_ROTATIONS * 360 + delta
}

type SpinState = 'idle' | 'spinning' | 'result'

export default function RouletteWheel({ categories, onResult, disabled = false }: Props) {
  const [scope, animate] = useAnimate()
  const [spinState, setSpinState] = useState<SpinState>('idle')
  const SECTOR_COLORS = SECTOR_CSS_VARS
  const [winner, setWinner] = useState<Category | null>(null)
  const currentRotation = useRef(0)
  const isMobile = useIsMobile()
  const size = isMobile ? 200 : 240
  const r = isMobile ? 96 : 116

  if (categories.length < 2) return null

  const handleSpin = async () => {
    if (spinState === 'spinning' || disabled) return

    // Pick winner before animation so angle calculation is deterministic
    const winnerIndex = Math.floor(Math.random() * categories.length)
    const delta = calcDelta(winnerIndex, categories.length, currentRotation.current)
    const nextRotation = currentRotation.current + delta

    setSpinState('spinning')
    setWinner(null)

    await animate(
      scope.current,
      { rotate: nextRotation },
      { duration: SPIN_DURATION, ease: SPIN_EASING }
    )

    currentRotation.current = nextRotation
    const won = categories[winnerIndex]
    setWinner(won)
    setSpinState('result')
    onResult(won)
  }

  const buttonLabel =
    spinState === 'spinning' ? '⏳ Кручу...' :
    spinState === 'result'   ? '🎡 Крутить снова' :
                               '🎡 Крутить'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

      {/* Wheel container — pointer is fixed, only the SVG group rotates */}
      <div style={{ position: 'relative', width: size, height: size }}>

        {/* Glow halo */}
        <div style={{
          position: 'absolute', inset: -20,
          background: 'radial-gradient(ellipse, rgba(255,107,53,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Rotating SVG */}
        <svg
          ref={scope}
          viewBox={`0 0 ${size} ${size}`}
          style={{ width: size, height: size, filter: 'drop-shadow(0 0 20px rgba(255,107,53,0.3))' }}
        >
          <g transform={`translate(${size / 2},${size / 2})`}>
            {categories.map((cat, i) => {
              const total = categories.length
              const angle = 360 / total
              const startDeg = i * angle
              const endDeg = startDeg + angle
              const start = (startDeg * Math.PI) / 180
              const end = (endDeg * Math.PI) / 180
              const x1 = Math.sin(start) * r
              const y1 = -Math.cos(start) * r
              const x2 = Math.sin(end) * r
              const y2 = -Math.cos(end) * r
              const largeArc = angle > 180 ? 1 : 0

              // Emoji position at sector midpoint
              const midDeg = startDeg + angle / 2
              const midRad = (midDeg * Math.PI) / 180
              const er = r * 0.65
              const ex = Math.sin(midRad) * er
              const ey = -Math.cos(midRad) * er

              return (
                <g key={cat.id}>
                  <path
                    d={`M0,0 L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                    fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                    stroke="var(--wheel-stroke)"
                    strokeWidth="2"
                  />
                  <text
                    x={ex} y={ey + 6}
                    fontSize={isMobile ? '17' : '20'}
                    textAnchor="middle"
                    style={{ userSelect: 'none' }}
                  >
                    {cat.emoji}
                  </text>
                </g>
              )
            })}

            {/* Outer ring */}
            <circle cx="0" cy="0" r={r} fill="none" stroke="#ff6b35" strokeWidth="2" strokeOpacity="0.5" />

            {/* Centre hub */}
            <circle cx="0" cy="0" r="22" fill="var(--wheel-hub)" stroke="#ff6b35" strokeWidth="2" />
            <text x="0" y="8" fontSize="17" textAnchor="middle" style={{ userSelect: 'none' }}>🔥</text>
          </g>
        </svg>

        {/* Fixed pointer arrow at top */}
        <div style={{
          position: 'absolute', top: -10, left: '50%',
          transform: 'translateX(-50%)',
          filter: 'drop-shadow(0 0 8px #ff6b35)',
        }}>
          <svg width="26" height="30" viewBox="0 0 26 30">
            <polygon points="13,30 0,4 26,4" fill="#ff6b35" />
          </svg>
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinState === 'spinning' || disabled}
        style={{
          background: spinState === 'spinning' || disabled
            ? 'var(--bg-3)'
            : 'linear-gradient(135deg, #ff6b35, #ff4500)',
          color: spinState === 'spinning' || disabled ? 'var(--text-3)' : '#fff',
          border: 'none',
          borderRadius: 28,
          padding: '14px 40px',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: spinState === 'spinning' || disabled ? 'not-allowed' : 'pointer',
          boxShadow: spinState === 'spinning' || disabled
            ? 'none'
            : '0 0 24px rgba(255,107,53,0.4)',
          transition: 'all 0.3s',
        }}
      >
        {buttonLabel}
      </button>

      {/* Result badge */}
      {winner && spinState === 'result' && (
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid rgba(255,107,53,0.4)',
          borderRadius: 12,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 26 }}>{winner.emoji}</span>
          <div>
            <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
              Выпало
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {winner.name}
            </div>
          </div>
          {disabled && (
            <div style={{
              marginLeft: 8,
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
            }}>
              ↓ Смотрю рецепты...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
