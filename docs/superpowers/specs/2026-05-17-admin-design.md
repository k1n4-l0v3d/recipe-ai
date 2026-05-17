# Админ-панель — Дизайн-спецификация

**Дата:** 2026-05-17
**Статус:** Согласовано
**Часть:** 3 из 3 (Auth ✅ → Cabinet → Admin)
**Зависит от:** Auth system + Cabinet (favorites/history tables для статистики)

---

## Обзор

Страница `/admin` с боковым меню (Статистика / Пользователи / Сессии). Доступна только пользователям с `role = 'admin'`. Позволяет просматривать статистику, управлять пользователями (назначать роли, банить) и принудительно завершать сессии.

---

## Новые поля в БД

### migrations/006_users_banned.sql
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
```

---

## Структура файлов

```
migrations/
  006_users_banned.sql

internal/
  db/
    admin.go         # GetAllUsers, SetUserRole, SetUserBanned, GetAllSessions, DeleteSession (уже есть)
  auth/
    middleware.go    # ДОБАВИТЬ: RequireAdmin middleware
  handlers/
    admin.go         # /api/admin/* endpoints

web/src/
  pages/
    Admin.tsx            # /admin — layout с sidebar
  components/
    AdminStats.tsx        # раздел Статистика
    AdminUsers.tsx        # раздел Пользователи
    AdminSessions.tsx     # раздел Сессии
```

---

## RequireAdmin middleware

```go
// internal/auth/middleware.go — добавить
func RequireAdmin(database *db.DB) gin.HandlerFunc {
  return func(c *gin.Context) {
    sessionID, err := c.Cookie("session_id")
    if err != nil { c.AbortWithStatusJSON(401, gin.H{"error": "не авторизован"}); return }

    user, err := database.GetUserBySession(c.Request.Context(), sessionID)
    if err != nil { c.AbortWithStatusJSON(401, gin.H{"error": "сессия истекла"}); return }

    if user.Role != "admin" { c.AbortWithStatusJSON(403, gin.H{"error": "нет доступа"}); return }

    c.Set("user", user)
    c.Next()
  }
}
```

---

## API эндпоинты (все требуют role=admin)

### Статистика
```
GET /api/admin/stats
→ {
    total_users: int,
    active_sessions: int,
    total_favorites: int,
    new_users_week: int
  }
```

### Пользователи
```
GET    /api/admin/users              → User[] (все, включая is_banned)
PUT    /api/admin/users/:id/role     body: { role: "user"|"admin" }
PUT    /api/admin/users/:id/ban      body: { is_banned: true|false }
```

### Сессии
```
GET    /api/admin/sessions           → Session[] (user_id, user_name, created_at, expires_at)
DELETE /api/admin/sessions/:id       принудительно завершить сессию
```

---

## Блокировка пользователя

При входе (`POST /api/auth/login`) добавить проверку:
```go
if user.IsBanned {
  c.JSON(http.StatusForbidden, gin.H{"error": "аккаунт заблокирован"})
  return
}
```

Поле `is_banned` добавляется в `domain.User` и считывается в `GetUserByEmail`.

---

## Типы данных

```go
// internal/domain/types.go — обновить User
type User struct {
  ID        string `json:"id"`
  Name      string `json:"name"`
  Email     string `json:"email"`
  Role      string `json:"role"`
  IsBanned  bool   `json:"is_banned"`
  CreatedAt string `json:"created_at"`
}

// Добавить
type AdminStats struct {
  TotalUsers     int `json:"total_users"`
  ActiveSessions int `json:"active_sessions"`
  TotalFavorites int `json:"total_favorites"`
  NewUsersWeek   int `json:"new_users_week"`
}

type SessionInfo struct {
  ID        string `json:"id"`
  UserID    string `json:"user_id"`
  UserName  string `json:"user_name"`
  UserEmail string `json:"user_email"`
  CreatedAt string `json:"created_at"`
  ExpiresAt string `json:"expires_at"`
}
```

---

## Фронтенд

### Страница /admin

- `AdminRoute` — если `user === null` → редирект `/`, если `user.role !== 'admin'` → редирект `/`
- Layout: боковое меню слева + контент справа
- Боковое меню: Статистика / Пользователи / Сессии (активный раздел подсвечен оранжевым)

### AdminStats

- 4 карточки: Всего пользователей, Активных сессий, Всего избранных, Новых за неделю
- Данные загружаются при монтировании

### AdminUsers

- Таблица: Имя, Email, Роль, Зарегистрирован, Заблокирован, Действия
- Строки заблокированных пользователей — приглушены (opacity 0.5), красный бейдж «banned»
- Кнопки в колонке «Действия»:
  - «admin» / «user» — переключить роль (нельзя снять роль у себя)
  - «бан» / «разбан» — нельзя заблокировать себя
- Подтверждение перед баном: `window.confirm('Заблокировать пользователя?')`

### AdminSessions

- Таблица: Пользователь, Email, Создана, Истекает, Действие
- Кнопка «Завершить» (красная) — нельзя завершить свою сессию
- Подтверждение: `window.confirm('Завершить сессию?')`

---

## Безопасность

- Все `/api/admin/*` защищены `RequireAdmin` middleware на бэкенде
- Фронтенд проверяет `user.role === 'admin'` только для показа UI — бэкенд является единственным источником авторитета
- Нельзя заблокировать или изменить роль себя (проверка `user.id !== currentUser.id`)
- Нельзя завершить свою текущую сессию

---

## Ограничения MVP

- Нет поиска/фильтрации пользователей (добавить если > 1000 пользователей)
- Нет пагинации (добавить позже)
- Нет логов действий администратора
- Статистика без графиков (только числа)
