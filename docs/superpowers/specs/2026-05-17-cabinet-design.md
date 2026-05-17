# Личный кабинет — Дизайн-спецификация

**Дата:** 2026-05-17
**Статус:** Согласовано
**Часть:** 2 из 3 (Auth ✅ → Cabinet → Admin)
**Зависит от:** Auth system (users, sessions, RequireAuth middleware)

---

## Обзор

Страница `/profile` с четырьмя табами: Профиль, Избранное, История, Заметки. Доступна только авторизованным пользователям. Рецепты хранятся как `recipe_id` (base64) + `name` + `image_keyword` — полные данные генерируются Groq при открытии.

---

## Новые таблицы БД

### migrations/003_favorites.sql
```sql
CREATE TABLE IF NOT EXISTS favorites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id        TEXT NOT NULL,
  recipe_name      TEXT NOT NULL,
  image_keyword    TEXT,
  added_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
```

### migrations/004_history.sql
```sql
CREATE TABLE IF NOT EXISTS history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id        TEXT NOT NULL,
  recipe_name      TEXT NOT NULL,
  image_keyword    TEXT,
  viewed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS history_user_id_idx ON history(user_id);
```

### migrations/005_notes.sql
```sql
CREATE TABLE IF NOT EXISTS notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id        TEXT NOT NULL,
  recipe_name      TEXT NOT NULL,
  content          TEXT NOT NULL DEFAULT '',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
```

---

## Структура файлов

```
migrations/
  003_favorites.sql
  004_history.sql
  005_notes.sql

internal/
  db/
    cabinet.go       # Favorites CRUD, History CRUD, Notes CRUD
  handlers/
    cabinet.go       # /api/profile, /api/favorites/*, /api/history/*, /api/notes/*

web/src/
  pages/
    Profile.tsx      # /profile — табы кабинета
  components/
    ProfileTabs.tsx       # Табы: Профиль / Избранное / История / Заметки
    ProfileEdit.tsx       # Таб «Профиль» — редактирование имени и пароля
    FavoritesList.tsx     # Таб «Избранное» — сетка карточек с кнопкой убрать
    HistoryList.tsx       # Таб «История» — список с временем просмотра
    NotesList.tsx         # Таб «Заметки» — список заметок по рецептам
    FavoriteButton.tsx    # Кнопка ❤️ на странице рецепта (Recipe.tsx)
  hooks/
    useFavorites.ts   # isFavorite(id), toggle(id, name, kw), список
    useHistory.ts     # addToHistory(id, name, kw), getHistory
    useNote.ts        # getNote(id), saveNote(id, text)
  api/
    cabinet.ts        # API вызовы для кабинета
```

---

## API эндпоинты (все требуют авторизации)

### Профиль
```
PUT /api/profile/name          body: { name }
PUT /api/profile/password      body: { current_password, new_password }
```

### Избранное
```
GET  /api/favorites            → список RecipePreview[]
POST /api/favorites            body: { recipe_id, recipe_name, image_keyword }
DELETE /api/favorites/:id      удалить по recipe_id
GET  /api/favorites/:id/check  → { is_favorite: bool }
```

### История
```
GET  /api/history              → последние 50 просмотров
POST /api/history              body: { recipe_id, recipe_name, image_keyword }
DELETE /api/history            очистить всю историю
```

### Заметки
```
GET  /api/notes/:recipe_id     → { content: string } или 404
PUT  /api/notes/:recipe_id     body: { content }  (создать или обновить)
DELETE /api/notes/:recipe_id   удалить заметку
```

---

## Типы данных

```go
// internal/domain/types.go — добавить
type RecipePreview struct {
  RecipeID     string `json:"recipe_id"`
  RecipeName   string `json:"recipe_name"`
  ImageKeyword string `json:"image_keyword"`
  AddedAt      string `json:"added_at,omitempty"`
  ViewedAt     string `json:"viewed_at,omitempty"`
}

type Note struct {
  RecipeID   string `json:"recipe_id"`
  RecipeName string `json:"recipe_name"`
  Content    string `json:"content"`
  UpdatedAt  string `json:"updated_at"`
}
```

---

## Фронтенд

### Страница /profile

- Защищена `PrivateRoute` — если не авторизован, редирект на `/`
- Четыре таба: Профиль / Избранное / История / Заметки
- URL с хэшем: `/profile#favorites`, `/profile#history`, `/profile#notes`

### Таб «Профиль»
- Форма: поле Имя (предзаполнено), кнопка «Сохранить»
- Отдельная форма: Текущий пароль + Новый пароль + Повтор → кнопка «Сменить пароль»
- Ошибки под соответствующей формой (красный текст)

### Таб «Избранное»
- Сетка карточек (такой же дизайн как RecipeCard, но без stagger-анимации)
- Кнопка ❤️ «Убрать» на каждой карточке
- Клик на карточку → `/recipe/:id`
- Пустое состояние: «Нет избранных рецептов — добавь ❤️ на любой странице рецепта»

### Таб «История»
- Список (не сетка) с временем: «Борщ — 2 часа назад»
- Кнопка «Очистить историю» вверху справа
- Последние 50 записей, новые сверху
- Клик на запись → `/recipe/:id`

### Таб «Заметки»
- Список карточек: название рецепта + текст заметки + кнопка редактировать
- Клик «редактировать» → inline textarea, кнопки «Сохранить» / «Отмена»
- Клик на название рецепта → `/recipe/:id`

### FavoriteButton на странице рецепта
- Появляется только если пользователь авторизован
- Состояния: «❤️ В избранное» (пустое) / «❤️ Убрать из избранного» (заполнено)
- При клике вызывает `POST /api/favorites` или `DELETE /api/favorites/:id`

### Автоматическое добавление в историю
- `useEffect` в `Recipe.tsx` при загрузке рецепта вызывает `POST /api/history`
- Только если пользователь авторизован (`user !== null`)

---

## Ограничения MVP

- История хранит последние 50 записей (server-side limit)
- Дубликаты в истории разрешены (каждый просмотр — отдельная запись)
- Заметки — только текст, без форматирования
- Нет экспорта избранного
