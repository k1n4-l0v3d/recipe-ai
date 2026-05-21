# Combo Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить секцию «Подбери по составу» ниже категорий — пользователь выбирает основное блюдо и/или гарнир, нажимает «Найти рецепты» и получает список сгенерированных рецептов.

**Architecture:** Новый Go-хендлер `GetComboRecipes` принимает `?main=` и `?side=`, строит строку категории и вызывает существующий `GenerateRecipeListExcluding`. Новый React-компонент `ComboSelector` рендерит два ряда чипсов с опцией «Другое» (текстовое поле) и кнопкой «Найти рецепты». Результаты показываются теми же `RecipeCard` что и у категорий; два режима (категория / комбо) взаимоисключают друг друга.

**Tech Stack:** Go + Gin (бэкенд), React + TypeScript + framer-motion (фронтенд), Groq API (генерация)

---

### Task 1: Backend — хендлер GetComboRecipes

**Files:**
- Modify: `internal/handlers/categories.go`
- Modify: `internal/handlers/categories_test.go`

- [ ] **Step 1: Написать падающий тест**

Добавить в конец `internal/handlers/categories_test.go`:

```go
func TestGetComboRecipes(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("returns 400 when both main and side are empty", func(t *testing.T) {
		mock := &mockRecipeGenerator{list: []domain.RecipeSummary{}}
		router := gin.New()
		router.GET("/api/recipes/combo", handlers.GetComboRecipes(mock))

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/api/recipes/combo", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", w.Code)
		}
	})

	t.Run("returns recipes when only main is set", func(t *testing.T) {
		mock := &mockRecipeGenerator{
			list: []domain.RecipeSummary{
				{Name: "Куриная грудка", Description: "Вкусно", Time: "30 мин", Difficulty: "Легко", Tags: []string{}},
			},
		}
		router := gin.New()
		router.GET("/api/recipes/combo", handlers.GetComboRecipes(mock))

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/api/recipes/combo?main=Курица", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected 200, got %d", w.Code)
		}
		var recipes []domain.RecipeSummary
		json.NewDecoder(w.Body).Decode(&recipes)
		if len(recipes) != 1 {
			t.Errorf("expected 1 recipe, got %d", len(recipes))
		}
	})

	t.Run("returns recipes when both main and side are set", func(t *testing.T) {
		mock := &mockRecipeGenerator{
			list: []domain.RecipeSummary{
				{Name: "Курица с рисом", Description: "Вкусно", Time: "40 мин", Difficulty: "Легко", Tags: []string{}},
			},
		}
		router := gin.New()
		router.GET("/api/recipes/combo", handlers.GetComboRecipes(mock))

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/api/recipes/combo?main=Курица&side=Рис", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected 200, got %d", w.Code)
		}
		var recipes []domain.RecipeSummary
		json.NewDecoder(w.Body).Decode(&recipes)
		if len(recipes) != 1 {
			t.Errorf("expected 1 recipe, got %d", len(recipes))
		}
	})
}
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```
go test ./internal/handlers/... -run TestGetComboRecipes -v
```

Ожидается: `FAIL` — `handlers.GetComboRecipes undefined`

- [ ] **Step 3: Реализовать хендлер**

Добавить в конец `internal/handlers/categories.go`:

```go
// GetComboRecipes generates recipes for a main dish + side dish combination.
// GET /api/recipes/combo?main=Курица&side=Рис&exclude=Name1,Name2
func GetComboRecipes(gen RecipeGenerator) gin.HandlerFunc {
	return func(c *gin.Context) {
		main := strings.TrimSpace(c.Query("main"))
		side := strings.TrimSpace(c.Query("side"))

		if main == "" && side == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "main or side is required"})
			return
		}

		var categoryStr string
		switch {
		case main != "" && side != "":
			categoryStr = fmt.Sprintf("блюда из %s с %s", main, side)
		case main != "":
			categoryStr = fmt.Sprintf("блюда из %s", main)
		default:
			categoryStr = fmt.Sprintf("блюда с %s", side)
		}

		var exclude []string
		if raw := c.Query("exclude"); raw != "" {
			for _, name := range strings.Split(raw, ",") {
				if name = strings.TrimSpace(name); name != "" {
					exclude = append(exclude, name)
				}
			}
		}

		recipes, err := gen.GenerateRecipeListExcluding(c.Request.Context(), categoryStr, exclude)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		for i := range recipes {
			recipes[i].ID = base64.RawURLEncoding.EncodeToString([]byte(recipes[i].Name))
		}

		c.JSON(http.StatusOK, recipes)
	}
}
```

Убедиться что импорты в файле содержат `"fmt"` — он уже есть в `categories.go`. Проверьте что `"encoding/base64"`, `"strings"`, `"net/http"` тоже присутствуют (они уже есть).

- [ ] **Step 4: Запустить тест — убедиться что проходит**

```
go test ./internal/handlers/... -run TestGetComboRecipes -v
```

Ожидается: `PASS` все три случая.

- [ ] **Step 5: Запустить все тесты хендлеров**

```
go test ./internal/handlers/... -v
```

Ожидается: все тесты `PASS`.

- [ ] **Step 6: Коммит**

```
git add internal/handlers/categories.go internal/handlers/categories_test.go
git commit -m "feat: add GetComboRecipes handler"
```

---

### Task 2: Backend — регистрация маршрута

**Files:**
- Modify: `cmd/server/main.go`

- [ ] **Step 1: Добавить маршрут**

В `cmd/server/main.go` найти строку:

```go
apiGroup.GET("/categories/:id", handlers.GetCategoryRecipes(&recipeGenAdapter{groqClient}))
```

Добавить сразу после неё:

```go
apiGroup.GET("/recipes/combo", handlers.GetComboRecipes(&recipeGenAdapter{groqClient}))
```

- [ ] **Step 2: Проверить компиляцию**

```
go build ./cmd/server
```

Ожидается: успешная компиляция без ошибок. Удалить собранный бинарник:

```
del server
```

(на Windows) или `rm server` (на Linux/Mac).

- [ ] **Step 3: Коммит**

```
git add cmd/server/main.go
git commit -m "feat: register /api/recipes/combo route"
```

---

### Task 3: Frontend — API-метод getComboRecipes

**Files:**
- Modify: `web/src/api/client.ts`

- [ ] **Step 1: Добавить метод в объект `api`**

В `web/src/api/client.ts` найти:

```ts
  getRecipe: (recipeId: string): Promise<Recipe> =>
    get(`/recipes/${encodeURIComponent(recipeId)}`),
```

Добавить после этой строки (внутри объекта `api`, перед закрывающей `}`):

```ts
  getComboRecipes: (main: string, side: string, exclude: string[] = []): Promise<RecipeSummary[]> => {
    const params = new URLSearchParams()
    if (main) params.set('main', main)
    if (side) params.set('side', side)
    if (exclude.length > 0) params.set('exclude', exclude.map(encodeURIComponent).join(','))
    return get(`/recipes/combo?${params.toString()}`)
  },
```

- [ ] **Step 2: Убедиться что TypeScript компилируется**

```
cd web && npx tsc --noEmit
```

Ожидается: нет ошибок.

- [ ] **Step 3: Коммит**

```
git add web/src/api/client.ts
git commit -m "feat: add getComboRecipes API method"
```

---

### Task 4: Frontend — компонент ComboSelector

**Files:**
- Create: `web/src/components/ComboSelector.tsx`

- [ ] **Step 1: Создать компонент**

Создать файл `web/src/components/ComboSelector.tsx`:

```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import type { RecipeSummary } from '../api/types'

const MAIN_OPTIONS = [
  { emoji: '🍗', label: 'Курица' },
  { emoji: '🥩', label: 'Говядина' },
  { emoji: '🐷', label: 'Свинина' },
  { emoji: '🐟', label: 'Рыба' },
  { emoji: '🦐', label: 'Морепродукты' },
  { emoji: '🐑', label: 'Баранина' },
  { emoji: '🦃', label: 'Индейка' },
  { emoji: '🍄', label: 'Грибы' },
  { emoji: '🫘', label: 'Тофу' },
]

const SIDE_OPTIONS = [
  { emoji: '🍚', label: 'Рис' },
  { emoji: '🥔', label: 'Картофель' },
  { emoji: '🍝', label: 'Паста' },
  { emoji: '🌾', label: 'Гречка' },
  { emoji: '🥦', label: 'Овощи' },
  { emoji: '🌿', label: 'Булгур' },
  { emoji: '🫛', label: 'Чечевица' },
  { emoji: '🥣', label: 'Пюре' },
  { emoji: '🥗', label: 'Салат' },
]

interface Props {
  onResults: (recipes: RecipeSummary[]) => void
  onLoadingChange: (loading: boolean) => void
  onNewSearch: () => void
  loading: boolean
}

export default function ComboSelector({ onResults, onLoadingChange, onNewSearch, loading }: Props) {
  const [selectedMain, setSelectedMain] = useState<string>('')
  const [selectedSide, setSelectedSide] = useState<string>('')
  const [mainCustom, setMainCustom] = useState(false)
  const [sideCustom, setSideCustom] = useState(false)
  const [mainText, setMainText] = useState('')
  const [sideText, setSideText] = useState('')
  const [exclude, setExclude] = useState<string[]>([])
  const [hasResults, setHasResults] = useState(false)

  const effectiveMain = mainCustom ? mainText.trim() : selectedMain
  const effectiveSide = sideCustom ? sideText.trim() : selectedSide
  const canSearch = effectiveMain !== '' || effectiveSide !== ''

  const handleSearch = async (currentExclude: string[] = []) => {
    if (!canSearch && currentExclude.length === 0) return
    onLoadingChange(true)
    try {
      const results = await api.getComboRecipes(effectiveMain, effectiveSide, currentExclude)
      onResults(results)
      setExclude(prev => [...prev, ...results.map(r => r.name)])
      setHasResults(true)
    } catch (err) {
      console.error(err)
    } finally {
      onLoadingChange(false)
    }
  }

  const handleLoadMore = () => handleSearch(exclude)

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
    background: active ? 'var(--accent-glow)' : 'var(--bg-3)',
    color: active ? 'var(--accent)' : 'var(--text-2)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: loading ? 'wait' : 'pointer',
    transition: 'all 0.2s',
  })

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 14 }}>
        Подбери по составу
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Основное блюдо */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Основное блюдо</div>
          {mainCustom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                autoFocus
                value={mainText}
                onChange={e => setMainText(e.target.value)}
                placeholder="Введите продукт..."
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border-2)',
                  background: 'var(--bg-3)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none',
                  width: 200,
                }}
              />
              <button
                onClick={() => { setMainCustom(false); setMainText('') }}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MAIN_OPTIONS.map(opt => (
                <motion.button
                  key={opt.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedMain(prev => prev === opt.label ? '' : opt.label)}
                  style={chipStyle(selectedMain === opt.label)}
                >
                  <span>{opt.emoji}</span> {opt.label}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setMainCustom(true); setSelectedMain('') }}
                style={chipStyle(false)}
              >
                ✏️ Другое
              </motion.button>
            </div>
          )}
        </div>

        {/* Гарнир */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Гарнир</div>
          {sideCustom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                autoFocus
                value={sideText}
                onChange={e => setSideText(e.target.value)}
                placeholder="Введите гарнир..."
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border-2)',
                  background: 'var(--bg-3)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none',
                  width: 200,
                }}
              />
              <button
                onClick={() => { setSideCustom(false); setSideText('') }}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIDE_OPTIONS.map(opt => (
                <motion.button
                  key={opt.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedSide(prev => prev === opt.label ? '' : opt.label)}
                  style={chipStyle(selectedSide === opt.label)}
                >
                  <span>{opt.emoji}</span> {opt.label}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSideCustom(true); setSelectedSide('') }}
                style={chipStyle(false)}
              >
                ✏️ Другое
              </motion.button>
            </div>
          )}
        </div>

        {/* Кнопка */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
          {hasResults && !loading && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLoadMore}
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border-2)',
                borderRadius: 24,
                padding: '10px 24px',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ещё рецепты →
            </motion.button>
          )}
          <motion.button
            whileHover={canSearch ? { scale: 1.03 } : {}}
            whileTap={canSearch ? { scale: 0.97 } : {}}
            onClick={() => { setExclude([]); setHasResults(false); onNewSearch(); handleSearch([]) }}
            disabled={!canSearch || loading}
            style={{
              background: canSearch ? 'var(--accent)' : 'var(--bg-3)',
              border: 'none',
              borderRadius: 24,
              padding: '10px 28px',
              color: canSearch ? '#fff' : 'var(--text-3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: canSearch && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Ищу...' : 'Найти рецепты →'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```
cd web && npx tsc --noEmit
```

Ожидается: нет ошибок.

- [ ] **Step 3: Коммит**

```
git add web/src/components/ComboSelector.tsx
git commit -m "feat: add ComboSelector component"
```

---

### Task 5: Frontend — интеграция в Home.tsx

**Files:**
- Modify: `web/src/pages/Home.tsx`

- [ ] **Step 1: Добавить импорт ComboSelector**

В начало `web/src/pages/Home.tsx` добавить импорт после существующих:

```ts
import ComboSelector from '../components/ComboSelector'
```

- [ ] **Step 2: Добавить состояние для комбо-результатов**

В теле функции `Home()`, после строки `const [searchQuery, setSearchQuery] = useState('')`, добавить:

```ts
const [comboRecipes, setComboRecipes] = useState<RecipeSummary[]>([])
const [comboLoading, setComboLoading] = useState(false)
```

- [ ] **Step 3: Добавить обработчики взаимоисключения**

Найти функцию `handleCategorySelect` и в её начало добавить сброс комбо:

```ts
const handleCategorySelect = async (cat: Category) => {
  setComboRecipes([])   // <- добавить эту строку
  setComboLabel('')     // <- и эту
  setSelectedCategory(cat)
  // ... остальной код без изменений
```

Добавить новый обработчик для комбо-результатов после `handleLoadMore`:

```ts
const handleComboResults = (results: RecipeSummary[]) => {
  setSelectedCategory(null)
  setRecipes([])
  setComboRecipes(prev => {
    const existingNames = new Set(prev.map(r => r.name.toLowerCase()))
    const unique = results.filter(r => !existingNames.has(r.name.toLowerCase()))
    return [...prev, ...unique]
  })
}
```

- [ ] **Step 4: Добавить ComboSelector и его результаты в JSX**

Найти в JSX блок:

```tsx
<CategoryGrid
  categories={categories}
  selectedId={selectedCategory?.id ?? null}
  onSelect={handleCategorySelect}
  loading={recipesLoading}
/>
```

Сразу после него добавить:

```tsx
<ComboSelector
  onResults={handleComboResults}
  onLoadingChange={setComboLoading}
  onNewSearch={handleComboNewSearch}
  loading={comboLoading}
/>
```

Найти блок скелетонов (после `{recipesLoading && ...}`) и добавить аналогичный для комбо:

```tsx
{comboLoading && (
  <div style={{
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
    marginTop: 32,
  }}>
    {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)}
```

Добавить новый обработчик `handleComboNewSearch` рядом с `handleComboResults`:

```ts
const handleComboNewSearch = () => {
  setComboRecipes([])
  setSelectedCategory(null)
  setRecipes([])
}
```

Найти блок `{recipes.length > 0 && (...)}` и после него добавить аналогичный для комбо:

```tsx
{comboRecipes.length > 0 && !comboLoading && (
  <>
    <div style={{
      fontSize: 11,
      letterSpacing: 2,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      margin: '32px 0 16px',
    }}>
      Результаты подбора
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 16,
    }}>
      {comboRecipes.map((r, i) => (
        <RecipeCard key={`${r.id}-${i}`} recipe={r} index={i} />
      ))}
    </div>
  </>
)}
```

- [ ] **Step 5: Проверить TypeScript**

```
cd web && npx tsc --noEmit
```

Ожидается: нет ошибок.

- [ ] **Step 6: Проверить в браузере**

1. Убедиться что бэкенд запущен: `go run ./cmd/server`
2. Запустить фронтенд: `cd web && npm run dev`
3. Открыть http://localhost:5173
4. Прокрутить ниже категорий — должна быть секция «Подбери по составу»
5. Выбрать «Курица» и «Картофель», нажать «Найти рецепты» — должен появиться список рецептов
6. Нажать «Ещё рецепты» — список должен пополниться без повторов
7. Выбрать любую категорию — комбо-результаты должны исчезнуть
8. Снова нажать «Найти рецепты» — результаты категории должны исчезнуть
9. Выбрать «✏️ Другое» и ввести «Кальмары» — должно работать как обычный чип
10. Нажать «×» — поле должно исчезнуть, чипы вернуться

- [ ] **Step 7: Коммит**

```
git add web/src/pages/Home.tsx
git commit -m "feat: integrate ComboSelector into Home page"
```
