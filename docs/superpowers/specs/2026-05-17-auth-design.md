# Авторизация — Дизайн-спецификация

**Дата:** 2026-05-17
**Статус:** Согласовано
**Часть:** 1 из 3 (Auth → Personal Cabinet → Admin)

---

## Обзор

Email + пароль авторизация с cookie-сессиями и PostgreSQL. Модальное окно входа/регистрации поверх текущей страницы. После входа навбар показывает аватар и имя пользователя с выпадающим меню.

---

## Стек

| Слой | Технология |
|---|---|
| БД | PostgreSQL (pgx/v5) |
| Пароли | bcrypt (cost 12) |
| Сессии | Cookie httpOnly + sessions таблица в PostgreSQL |
| Миграции | SQL-файлы, применяются при старте сервера |
| Фронт | React AuthContext + модальное окно |

---

## Новые переменные окружения

```
DATABASE_URL=postgres://user:pass@localhost:5432/recipeai
SESSION_SECRET=random-32-byte-secret
```

---

## Структура файлов

```
migrations/
  001_users.sql
  002_sessions.sql

internal/
  db/
    db.go           # подключение pgx, pool
    users.go        # CreateUser, GetUserByEmail, GetUserByID
    sessions.go     # CreateSession, GetSessionByID, DeleteSession
    migrate.go      # применение миграций из папки migrations/

  auth/
    password.go     # HashPassword(plain) string, CheckPassword(hash, plain) bool
    session.go      # NewSessionID() string, сессия 30 дней
    middleware.go   # RequireAuth gin middleware — проверяет cookie, кладёт user в ctx

  handlers/
    auth.go         # POST /register, POST /login, POST /logout, GET /me

web/src/
  context/
    AuthContext.tsx   # createContext, AuthProvider, user state, login/logout actions
  hooks/
    useAuth.ts        # хук доступа к AuthContext
  components/
    AuthModal.tsx     # модалка с вкладками Войти / Регистрация
    Navbar.tsx        # добавить кнопку Войти / аватар + dropdown
```

---

## Схема БД

### migrations/001_users.sql
```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### migrations/002_sessions.sql
```sql
CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days'
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
```

---

## API эндпоинты

### POST /api/auth/register
**Body:** `{ "name": "Илья", "email": "...", "password": "..." }`

Валидация:
- name: непустое, max 100 символов
- email: валидный формат
- password: минимум 8 символов

Успех `201`: создаёт user, создаёт сессию, устанавливает cookie, возвращает `{ "user": { id, name, email, role } }`.

Ошибки: `400` (невалидные данные), `409` (email уже занят).

### POST /api/auth/login
**Body:** `{ "email": "...", "password": "..." }`

Проверяет bcrypt, создаёт сессию в БД, устанавливает httpOnly cookie `session_id`.

Успех `200`: `{ "user": { id, name, email, role } }`

Ошибки: `401` (неверный email/пароль).

### POST /api/auth/logout
Удаляет сессию из БД, очищает cookie.
Успех `200`.

### GET /api/auth/me
Читает cookie → находит сессию в БД → возвращает пользователя.
Успех `200`: `{ "user": { id, name, email, role } }`
`401` если нет cookie или сессия истекла.

---

## Cookie

```go
c.SetCookie(
  "session_id",  // name
  sessionID,     // value (UUID)
  60*60*24*30,   // max-age: 30 дней
  "/",           // path
  "",            // domain
  false,         // secure (true на Render/HTTPS)
  true,          // httpOnly — JS не видит
)
```

---

## Auth Middleware

```go
func RequireAuth(db *db.DB) gin.HandlerFunc {
  return func(c *gin.Context) {
    sessionID, err := c.Cookie("session_id")
    if err != nil { c.AbortWithStatus(401); return }
    
    user, err := db.GetUserBySession(c.Request.Context(), sessionID)
    if err != nil { c.AbortWithStatus(401); return }
    
    c.Set("user", user)
    c.Next()
  }
}
```

Будет использоваться для защиты `/api/profile/*` и `/api/admin/*` (в следующих частях).

---

## Фронтенд

### AuthContext

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
```

При старте приложения `AuthProvider` вызывает `GET /api/auth/me` — если пользователь уже залогинен (есть cookie), подставляет его в контекст.

### AuthModal

- Две вкладки: «Войти» / «Регистрация» (переключаются без перезагрузки)
- Анимация появления через Framer Motion (fade + scale)
- Закрывается кликом по фону или кнопкой ×
- Показывает ошибки сервера под формой (красный текст)
- Кнопка disabled + спиннер во время запроса

### Navbar

Логика:
- `user === null` → кнопка «Войти» (открывает AuthModal)
- `user !== null` → аватар с инициалом + имя → кликабельный dropdown:
  - 👤 Личный кабинет → /profile (следующая часть)
  - ❤️ Избранные → /favorites (следующая часть)
  - ↪ Выйти → вызывает `logout()`

### credentials: 'include'

Все `fetch`-запросы к `/api/*` должны передавать cookie:
```typescript
// web/src/api/client.ts — добавить к get() и другим fetch вызовам
const res = await fetch(url, { credentials: 'include' })
```

---

## Ограничения

- Функция "Забыл пароль" — не входит в MVP
- Подтверждение email — не входит в MVP
- Rate limiting на /login — не входит в MVP (добавить позже)
- `secure: true` на cookie включить когда будет HTTPS (Render)
