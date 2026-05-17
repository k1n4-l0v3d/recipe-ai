package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/db"
	"recipe-ai/internal/domain"
)

// AdminHandler handles all /api/admin/* endpoints.
type AdminHandler struct {
	db *db.DB
}

// NewAdminHandler creates an AdminHandler.
func NewAdminHandler(database *db.DB) *AdminHandler {
	return &AdminHandler{db: database}
}

// GetStats returns aggregate statistics.
// GET /api/admin/stats
func (h *AdminHandler) GetStats(c *gin.Context) {
	stats, err := h.db.GetAdminStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// GetUsers returns all users.
// GET /api/admin/users
func (h *AdminHandler) GetUsers(c *gin.Context) {
	users, err := h.db.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	if users == nil {
		users = []domain.User{}
	}
	c.JSON(http.StatusOK, users)
}

// SetRole changes a user's role.
// PUT /api/admin/users/:id/role
func (h *AdminHandler) SetRole(c *gin.Context) {
	current, _ := UserFromContext(c)
	targetID := c.Param("id")

	if current != nil && current.ID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "нельзя изменить свою роль"})
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || (body.Role != "user" && body.Role != "admin") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "роль должна быть 'user' или 'admin'"})
		return
	}

	if err := h.db.SetUserRole(c.Request.Context(), targetID, body.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// SetBan bans or unbans a user.
// PUT /api/admin/users/:id/ban
func (h *AdminHandler) SetBan(c *gin.Context) {
	current, _ := UserFromContext(c)
	targetID := c.Param("id")

	if current != nil && current.ID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "нельзя заблокировать себя"})
		return
	}

	var body struct {
		IsBanned bool `json:"is_banned"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}

	if err := h.db.SetUserBanned(c.Request.Context(), targetID, body.IsBanned); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetSessions returns all active sessions with user info.
// GET /api/admin/sessions
func (h *AdminHandler) GetSessions(c *gin.Context) {
	sessions, err := h.db.GetAllSessions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	if sessions == nil {
		sessions = []domain.SessionInfo{}
	}
	c.JSON(http.StatusOK, sessions)
}

// TerminateSession force-terminates a session.
// DELETE /api/admin/sessions/:id
func (h *AdminHandler) TerminateSession(c *gin.Context) {
	mySessionID, _ := c.Cookie("session_id")
	targetID := c.Param("id")

	if mySessionID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "нельзя завершить свою сессию"})
		return
	}

	if err := h.db.DeleteSessionByID(c.Request.Context(), targetID); err != nil {
		if err == db.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "сессия не найдена"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
