# Roulette Wheel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated SVG roulette wheel to the home page that spins, lands on a random category, and automatically loads recipes for that category.

**Architecture:** New self-contained `RouletteWheel.tsx` component handles all spin logic and animation via Framer Motion `useAnimate`. `Home.tsx` receives the result via `onResult` callback and calls the existing `handleCategorySelect` + smooth-scrolls to the recipes section.

**Tech Stack:** React 18, TypeScript, Framer Motion `useAnimate`, inline styles with CSS variables, SVG.

---

## File Map

```
web/src/components/RouletteWheel.tsx   # new — wheel SVG + spin logic + result badge
web/src/pages/Home.tsx                 # modify — insert roulette block, add handler + ref
```

---

## Task 1: RouletteWheel Component

**Files:**
- Create: `web/src/components/RouletteWheel.tsx`

- [ ] **Step 1: Verify TypeScript compiles before starting**

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами/web" && npx tsc --noEmit
```

Expected: no errors (clean baseline).

- [ ] **Step 2: Create RouletteWheel.tsx**

Create `web/src/components/RouletteWheel.tsx` with this exact content:

```tsx
import { useRef, useState } from 'react'
import { useAnimate } from 'framer-motion'
import type { Category } from '../api/types'

interface Props {
  categories: Category[]
  onResult: (cat: Category) => void
  disabled?: boolean
}

// Sector background colors — one per category slot, dark gourmet palette
const SECTOR_COLORS = [
  '#1a0800', '#0a1a00', '#001a1a', '#1a0010',
  '#1a1000', '#0a001a', '#1a0500', '#001a0a',
]

// Spin easing: fast start, long ease-out with inertia feel
const SPIN_EASING = [0.17, 0.67, 0.12, 0.99] as const
const SPIN_DURATION = 3 // seconds
const MIN_ROTATIONS = 4 // full turns before stopping

function calcTotalRotation(winnerIndex: number, total: number): number {
  const sectorAngle = 360 / total
  const winnerAngle = winnerIndex * sectorAngle
  const centerOffset = sectorAngle / 2
  // Arrow is at top (270° in standard coords). Rotate so winner centre aligns with it.
  const targetAngle = (360 - (winnerAngle + centerOffset) + 270) % 360
  return MIN_ROTATIONS * 360 + targetAngle
}

type SpinState = 'idle' | 'spinning' | 'result'

export default function RouletteWheel({ categories, onResult, disabled = false }: Props) {
  const [scope, animate] = useAnimate()
  const [spinState, setSpinState] = useState<SpinState>('idle')
  const [winner, setWinner] = useState<Category | null>(null)
  const currentRotation = useRef(0)

  if (categories.length < 2) return null

  const handleSpin = async () => {
    if (spinState === 'spinning' || disabled) return

    // Pick winner before animation so angle calculation is deterministic
    const winnerIndex = Math.floor(Math.random() * categories.length)
    const delta = calcTotalRotation(winnerIndex, categories.length)
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
      <div style={{ position: 'relative', width: 240, height: 240 }}>

        {/* Glow halo */}
        <div style={{
          position: 'absolute', inset: -20,
          background: 'radial-gradient(ellipse, rgba(255,107,53,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Rotating SVG */}
        <svg
          ref={scope}
          viewBox="0 0 240 240"
          style={{ width: 240, height: 240, filter: 'drop-shadow(0 0 20px rgba(255,107,53,0.3))' }}
        >
          <g transform="translate(120,120)">
            {categories.map((cat, i) => {
              const total = categories.length
              const angle = 360 / total
              const startDeg = i * angle
              const endDeg = startDeg + angle
              const start = (startDeg * Math.PI) / 180
              const end = (endDeg * Math.PI) / 180
              const r = 116
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
                    stroke="#0d0d0d"
                    strokeWidth="2"
                  />
                  <text
                    x={ex} y={ey + 6}
                    fontSize="20"
                    textAnchor="middle"
                    style={{ userSelect: 'none' }}
                  >
                    {cat.emoji}
                  </text>
                </g>
              )
            })}

            {/* Outer ring */}
            <circle cx="0" cy="0" r="116" fill="none" stroke="#ff6b35" strokeWidth="2" strokeOpacity="0.5" />

            {/* Centre hub */}
            <circle cx="0" cy="0" r="26" fill="#0d0d0d" stroke="#ff6b35" strokeWidth="2" />
            <text x="0" y="9" fontSize="20" textAnchor="middle" style={{ userSelect: 'none' }}>🔥</text>
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
            ? '#2a2a2a'
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
          background: '#1a0800',
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами/web" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами"
git add web/src/components/RouletteWheel.tsx
git commit -m "feat: add RouletteWheel component with Framer Motion spin animation"
```

---

## Task 2: Wire RouletteWheel into Home.tsx

**Files:**
- Modify: `web/src/pages/Home.tsx`

- [ ] **Step 1: Read the current Home.tsx**

Open `web/src/pages/Home.tsx` and locate these three areas you will modify:
1. The import block at the top
2. Inside the component body — after the existing state declarations
3. The JSX — between the closing `</div>` of the hero block and the `{/* Categories + Recipes */}` div

- [ ] **Step 2: Add import for RouletteWheel**

Add this import at the top of `web/src/pages/Home.tsx` after the existing imports:

```tsx
import RouletteWheel from '../components/RouletteWheel'
```

- [ ] **Step 3: Add recipesRef and handleRouletteResult**

Inside the `Home` component body, after the existing `const [searchQuery, setSearchQuery] = useState('')` line, add:

```tsx
const recipesRef = useRef<HTMLDivElement>(null)

const handleRouletteResult = (cat: Category) => {
  handleCategorySelect(cat)
  setTimeout(() => {
    recipesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 300)
}
```

Also add `useRef` to the existing React import at the top — change:

```tsx
import { useState, useEffect } from 'react'
```

to:

```tsx
import { useState, useEffect, useRef } from 'react'
```

- [ ] **Step 4: Insert the roulette block in JSX**

In the JSX, between the closing `</div>` of the hero section (the one ending with `</motion.form>`) and the opening `<div style={{ maxWidth: 960...` of the categories section, insert:

```tsx
      {/* Roulette block */}
      {categories.length >= 2 && (
        <div style={{
          padding: '0 24px 48px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(255,107,53,0.03) 0%, transparent 100%)',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
            Не знаешь что приготовить?
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
            Испытай удачу 🎡
          </div>
          <RouletteWheel
            categories={categories}
            onResult={handleRouletteResult}
            disabled={recipesLoading}
          />
        </div>
      )}
```

- [ ] **Step 5: Add ref to recipes section and update label**

Find the `{/* Categories + Recipes */}` div opening tag:

```tsx
<div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 48px' }}>
```

Add the ref:

```tsx
<div ref={recipesRef} style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 48px' }}>
```

Then find the label above `<CategoryGrid`:

```tsx
          Категории
```

Change it to:

```tsx
          Или выбери сам
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами/web" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Verify production build**

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами/web" && npm run build
```

Expected: `dist/` builds with no errors.

- [ ] **Step 8: Commit**

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами"
git add web/src/pages/Home.tsx
git commit -m "feat: integrate RouletteWheel into Home page with auto-scroll to recipes"
```

---

## Task 3: Manual Verification

- [ ] **Step 1: Start the backend** (if not already running)

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами"
make dev-backend
```

- [ ] **Step 2: Start the frontend**

In a second terminal:

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами"
make dev-frontend
```

- [ ] **Step 3: Open browser at http://localhost:5173**

Verify:
- [ ] Roulette block appears between hero and category buttons
- [ ] Wheel renders with 8 emoji sectors and 🔥 centre hub
- [ ] Orange pointer arrow sits above the wheel
- [ ] «🎡 Крутить» button is visible and orange

- [ ] **Step 4: Click «Крутить» and verify spin**

- [ ] Wheel rotates at least 4 full turns (~3 seconds)
- [ ] Spin decelerates smoothly (ease-out, not abrupt stop)
- [ ] Button shows «⏳ Кручу...» and is disabled during spin
- [ ] After stop: result badge appears with correct emoji + category name

- [ ] **Step 5: Verify recipe loading and scroll**

- [ ] After spin stops, recipes start loading (backend call fires)
- [ ] Page scrolls smoothly to the recipes section
- [ ] «↓ Смотрю рецепты...» badge shows while `recipesLoading` is true
- [ ] Recipes grid appears below
- [ ] Selected category is highlighted in the «Или выбери сам» grid

- [ ] **Step 6: Verify «Крутить снова»**

- [ ] After recipes load, button label changes to «🎡 Крутить снова»
- [ ] Clicking it spins again, picks a new random category, loads new recipes

- [ ] **Step 7: Commit final verification**

```bash
cd "/Users/k1n4_l0v3d/Desktop/Сайт с рецептами"
git add .
git commit -m "chore: verify roulette wheel feature end-to-end"
```
