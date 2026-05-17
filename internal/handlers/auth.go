package handlers

import (
	"net/http"
	"net/mail"
	"strings"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/auth"
	"recipe-ai/internal/db"
	"recipe-ai/internal/domain"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	db *db.DB
}

// NewAuthHandler creates an AuthHandler with the given DB.
func NewAuthHandler(database *db.DB) *AuthHandler {
	return &AuthHandler{db: database}
}

func setSessionCookie(c *gin.Context, sessionID string) {
	c.SetCookie("session_id", sessionID, 60*60*24*30, "/", "", false, true)
}

func clearSessionCookie(c *gin.Context) {
	c.SetCookie("session_id", "", -1, "/", "", false, true)
}

// Register creates a new user account.
// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Email = strings.TrimSpace(strings.ToLower(body.Email))

	if body.Name == "" || len(body.Name) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "имя обязательно (до 100 символов)"})
		return
	}
	if _, err := mail.ParseAddress(body.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный email"})
		return
	}
	if len(body.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "пароль минимум 8 символов"})
		return
	}

	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "БД недоступна"})
		return
	}

	hash, err := auth.HashPassword(body.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}

	user, err := h.db.CreateUser(c.Request.Context(), body.Name, body.Email, hash)
	if err != nil {
		if err == db.ErrEmailTaken {
			c.JSON(http.StatusConflict, gin.H{"error": "email уже занят"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}

	sessionID, err := h.db.CreateSession(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}

	setSessionCookie(c, sessionID)
	c.JSON(http.StatusCreated, gin.H{"user": user})
}

// Login authenticates an existing user.
// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))

	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "БД недоступна"})
		return
	}

	user, hash, err := h.db.GetUserByEmail(c.Request.Context(), body.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "неверный email или пароль"})
		return
	}

	if !auth.CheckPassword(hash, body.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "неверный email или пароль"})
		return
	}

	if user.IsBanned {
		c.JSON(http.StatusForbidden, gin.H{"error": "аккаунт заблокирован"})
		return
	}

	sessionID, err := h.db.CreateSession(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}

	setSessionCookie(c, sessionID)
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// Logout deletes the current session.
// POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err == nil && h.db != nil {
		_ = h.db.DeleteSession(c.Request.Context(), sessionID)
	}
	clearSessionCookie(c)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Me returns the currently authenticated user.
// GET /api/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "не авторизован"})
		return
	}
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "БД недоступна"})
		return
	}

	user, err := h.db.GetUserBySession(c.Request.Context(), sessionID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "сессия истекла"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UserFromContext extracts the authenticated user from Gin context (set by RequireAuth).
func UserFromContext(c *gin.Context) (*domain.User, bool) {
	v, ok := c.Get("user")
	if !ok {
		return nil, false
	}
	u, ok := v.(*domain.User)
	return u, ok
}
