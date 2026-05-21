import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Ingredient } from '../api/types'

interface Props {
  recipeName: string
  ingredients: Ingredient[]
  onClose: () => void
}

export default function ShoppingList({ recipeName, ingredients, onClose }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState(false)

  const toggle = (i: number) =>
    setChecked(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const listText = `Список покупок: ${recipeName}\n\n${ingredients.map(ing => `• ${ing.name} — ${ing.amount}`).join('\n')}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(listText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = listText
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const print = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Список покупок — ${recipeName}</title>
      <style>
        body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; color: #111; }
        h1 { font-size: 22px; margin-bottom: 8px; }
        .sub { color: #666; font-size: 14px; margin-bottom: 24px; }
        ul { list-style: none; padding: 0; }
        li { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 16px; }
        .box { width: 18px; height: 18px; border: 2px solid #333; border-radius: 4px; flex-shrink: 0; }
        .amount { color: #666; margin-left: auto; }
      </style></head><body>
      <h1>${recipeName}</h1>
      <div class="sub">Список покупок</div>
      <ul>${ingredients.map(ing => `<li><div class="box"></div><span>${ing.name}</span><span class="amount">${ing.amount}</span></li>`).join('')}</ul>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const uncheckedCount = ingredients.length - checked.size

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 301,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 16px 16px',
        pointerEvents: 'none',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25 }}
          style={{
            background: '#111', border: '1px solid var(--border-2)',
            borderRadius: 20, width: '100%', maxWidth: 480,
            overflow: 'hidden', pointerEvents: 'auto',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
                🛒 Список покупок
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {uncheckedCount === 0 ? 'Всё куплено! 🎉' : `Осталось: ${uncheckedCount} из ${ingredients.length}`}
              </div>
            </div>
            <button
              onClick={onClose} aria-label="Закрыть"
              style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {ingredients.map((ing, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '12px 20px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  opacity: checked.has(i) ? 0.4 : 1,
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${checked.has(i) ? 'var(--accent)' : 'var(--border-2)'}`,
                  background: checked.has(i) ? 'var(--accent)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {checked.has(i) && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>

                <span style={{
                  flex: 1, fontSize: 14, color: 'var(--text)',
                  textDecoration: checked.has(i) ? 'line-through' : 'none',
                }}>
                  {ing.name}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-3)', flexShrink: 0 }}>
                  {ing.amount}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{
            padding: '14px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, flexShrink: 0,
          }}>
            <button
              onClick={copyToClipboard}
              style={{
                flex: 1, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'var(--border-2)'}`,
                color: copied ? '#22c55e' : 'var(--text-2)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Скопировано' : '📋 Скопировать'}
            </button>
            <button
              onClick={print}
              style={{
                flex: 1, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-2)',
                color: 'var(--text-2)', cursor: 'pointer',
              }}
            >
              🖨️ Печать
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
