import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  recipeName: string
  steps: string[]
  onClose: () => void
}

export default function CookingMode({ recipeName, steps, onClose }: Props) {
  const [current, setCurrent] = useState(0)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Request wake lock so screen doesn't turn off while cooking
  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => { wakeLockRef.current = lock })
        .catch(() => {})
    }
    return () => {
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  const prev = () => setCurrent(c => Math.max(0, c - 1))
  const next = () => setCurrent(c => Math.min(steps.length - 1, c + 1))
  const isFirst = current === 0
  const isLast = current === steps.length - 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            Режим готовки
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
            {recipeName}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Выйти из режима готовки"
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 16px', color: 'var(--text-2)',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Выйти
        </button>
      </div>

      {/* Step counter */}
      <div style={{
        padding: '16px 24px 0',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              height: 4, flex: 1, borderRadius: 2, border: 'none', cursor: 'pointer',
              background: i === current ? 'var(--accent)' : i < current ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>
      <div style={{ padding: '8px 24px 0', fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>
        Шаг {current + 1} из {steps.length}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            style={{
              maxWidth: 680, width: '100%', textAlign: 'center',
            }}
          >
            {/* Step number badge */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--accent-glow)', border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: 'var(--accent)',
              margin: '0 auto 28px',
            }}>
              {current + 1}
            </div>

            <div style={{
              fontSize: 'clamp(18px, 3vw, 26px)',
              color: 'var(--text)',
              lineHeight: 1.7,
              fontWeight: 400,
            }}>
              {steps[current]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div style={{
        padding: '20px 24px 32px',
        display: 'flex', gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={prev}
          disabled={isFirst}
          style={{
            flex: 1, padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 600,
            background: isFirst ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: isFirst ? 'var(--text-3)' : 'var(--text-2)',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ← Назад
        </button>

        {isLast ? (
          <button
            onClick={onClose}
            style={{
              flex: 2, padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', color: '#fff', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(34,197,94,0.3)',
            }}
          >
            ✓ Готово!
          </button>
        ) : (
          <button
            onClick={next}
            style={{
              flex: 2, padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg, #ff6b35, #ff4500)',
              border: 'none', color: '#fff', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255,107,53,0.3)',
            }}
          >
            Следующий шаг →
          </button>
        )}
      </div>
    </motion.div>
  )
}
