# Рулетка категорий — Дизайн-спецификация

**Дата:** 2026-05-17  
**Статус:** Согласовано

---

## Обзор

Новый блок на главной странице между hero-секцией и сеткой категорий. Пользователь нажимает «Крутить» — SVG-колесо вращается ~3 секунды с ease-out замедлением, останавливается на случайной категории, автоматически загружает рецепты и скроллит страницу к ним. Сетка категорий остаётся ниже как альтернативный способ выбора.

---

## Изменяемые файлы

```
web/src/components/RouletteWheel.tsx   # новый компонент (создать)
web/src/pages/Home.tsx                 # добавить блок рулетки между hero и CategoryGrid
```

---

## Компонент RouletteWheel.tsx

### Props

```typescript
interface Props {
  categories: Category[]       // 8 категорий из api.getCategories()
  onResult: (cat: Category) => void  // вызывается когда колесо остановилось
  disabled?: boolean           // true пока грузятся рецепты
}
```

### Анатомия

- **SVG-колесо** — 8 равных секторов (по 45°), каждый сектор имеет тёмный фон с лёгким цветным оттенком и эмодзи категории по центру
- **Оранжевый ободок** — `stroke="#ff6b35"` с opacity 0.5, + `filter: drop-shadow` с оранжевым свечением
- **Центральная шайба** — круг `r=24`, тёмный фон, эмодзи 🔥
- **Стрелка-указатель** — SVG-треугольник сверху, фиксированный, не вращается, оранжевый с glow
- **Кнопка «🎡 Крутить»** — градиент `#ff6b35 → #ff4500`, uppercase, letter-spacing, box-shadow с оранжевым свечением. `disabled` во время вращения и загрузки
- **Бейдж результата** — появляется после остановки: тёмный фон, оранжевая рамка, эмодзи + название категории + текст «↓ Смотрю рецепты...»

### Анимация (Framer Motion `useAnimate`)

```
Длительность: 3 секунды
Угол вращения: (случайный финальный угол + 4 полных оборота) = minRotation 1440° + offset
Easing: [0.17, 0.67, 0.12, 0.99]  (cubic-bezier, ease-out с инерцией)
```

**Расчёт финального угла:**

```typescript
// Определяем какая категория выпадет
const winnerIndex = Math.floor(Math.random() * categories.length)

// Угол центра выигрышного сектора (стрелка сверху = 270° в SVG координатах)
const sectorAngle = 360 / categories.length          // 45°
const winnerAngle = winnerIndex * sectorAngle         // угол начала сектора
const centerOffset = sectorAngle / 2                  // центр сектора
const targetAngle = 360 - (winnerAngle + centerOffset) + 270

// Итоговый угол: 4+ полных оборота + точная остановка
const totalRotation = 1440 + (targetAngle % 360)
```

После остановки:
1. Показывается бейдж с результатом
2. Вызывается `onResult(categories[winnerIndex])`

### Состояния компонента

| Состояние | Колесо | Кнопка | Бейдж |
|---|---|---|---|
| Ожидание | статично | «🎡 Крутить» активна | скрыт |
| Вращение | анимируется | disabled, «Кручу...» | скрыт |
| Результат + загрузка рецептов | статично на результате | disabled | показан |
| Готово (рецепты загружены) | статично | «🎡 Крутить снова» активна | показан |

---

## Изменения в Home.tsx

### Новый блок (вставить между hero и CategoryGrid)

```tsx
{/* Roulette block */}
<div style={{ padding: '0 24px 40px', textAlign: 'center' }}>
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
```

### Новый хендлер `handleRouletteResult`

```typescript
const recipesRef = useRef<HTMLDivElement>(null)  // ref на секцию с рецептами

const handleRouletteResult = (cat: Category) => {
  handleCategorySelect(cat)  // переиспользуем существующий хендлер
  // Скролл к рецептам после небольшой задержки (чтобы DOM обновился)
  setTimeout(() => {
    recipesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 300)
}
```

### Подпись над CategoryGrid

Текст «Категории» → «Или выбери сам» (визуально отделяет рулетку от ручного выбора).

---

## Визуальный стиль

Соответствует dark gourmet теме:
- Фон секторов: чередующиеся `#1a0800` и варианты с лёгким цветным оттенком (`#0a1a00`, `#001a1a`, `#1a0010` и т.д.)
- Ободок и акценты: `#ff6b35`
- Свечение: `drop-shadow(0 0 20px rgba(255,107,53,0.3))`
- Radial gradient фон блока: `rgba(255,107,53,0.03)` → transparent

---

## Ограничения

- Минимальное количество категорий: 2 (иначе компонент не рендерится, рулетка скрыта)
- Если `categories` ещё не загрузились — блок рулетки не показывается (тот же `useEffect` что и сейчас)
- Повторный спин сбрасывает бейдж результата и запускает новый спин
