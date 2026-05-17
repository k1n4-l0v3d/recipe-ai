package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/auth"
	"recipe-ai/internal/db"
	"recipe-ai/internal/domain"
)

// CabinetHandler handles all personal cabinet endpoints.
type CabinetHandler struct {
	db *db.DB
}

// NewCabinetHandler creates a CabinetHandler.
func NewCabinetHandler(database *db.DB) *CabinetHandler {
	return &CabinetHandler{db: database}
}

func currentUserID(c *gin.Context) (string, bool) {
	user, ok := UserFromContext(c)
	if !ok {
		return "", false
	}
	return user.ID, true
}

// ── Profile ────────────────────────────────────────────────────────────────

// PUT /api/profile/name
func (h *CabinetHandler) UpdateName(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "не авторизован"})
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	if body.Name == "" || len(body.Name) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "имя обязательно (до 100 символов)"})
		return
	}
	if err := h.db.UpdateUserName(c.Request.Context(), userID, body.Name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// PUT /api/profile/password
func (h *CabinetHandler) UpdatePassword(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "не авторизован"})
		return
	}
	var body struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}
	if len(body.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "новый пароль минимум 8 символов"})
		return
	}

	user, err := h.db.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	_, hash, err := h.db.GetUserByEmail(c.Request.Context(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	if !auth.CheckPassword(hash, body.CurrentPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "неверный текущий пароль"})
		return
	}
	newHash, err := auth.HashPassword(body.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	if err := h.db.UpdateUserPassword(c.Request.Context(), userID, newHash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ── Favorites ──────────────────────────────────────────────────────────────

// GET /api/favorites
func (h *CabinetHandler) GetFavorites(c *gin.Context) {
	userID, _ := currentUserID(c)
	items, err := h.db.GetFavorites(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	if items == nil {
		items = []domain.RecipePreview{}
	}
	c.JSON(http.StatusOK, items)
}

// POST /api/favorites
func (h *CabinetHandler) AddFavorite(c *gin.Context) {
	userID, _ := currentUserID(c)
	var body struct {
		RecipeID     string `json:"recipe_id"`
		RecipeName   string `json:"recipe_name"`
		ImageKeyword string `json:"image_keyword"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.RecipeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}
	if err := h.db.AddFavorite(c.Request.Context(), userID, body.RecipeID, body.RecipeName, body.ImageKeyword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DELETE /api/favorites/:id
func (h *CabinetHandler) RemoveFavorite(c *gin.Context) {
	userID, _ := currentUserID(c)
	recipeID := c.Param("id")
	if err := h.db.RemoveFavorite(c.Request.Context(), userID, recipeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /api/favorites/:id/check
func (h *CabinetHandler) CheckFavorite(c *gin.Context) {
	userID, _ := currentUserID(c)
	recipeID := c.Param("id")
	isFav, err := h.db.IsFavorite(c.Request.Context(), userID, recipeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"is_favorite": isFav})
}

// ── History ────────────────────────────────────────────────────────────────

// GET /api/history
func (h *CabinetHandler) GetHistory(c *gin.Context) {
	userID, _ := currentUserID(c)
	items, err := h.db.GetHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	if items == nil {
		items = []domain.RecipePreview{}
	}
	c.JSON(http.StatusOK, items)
}

// POST /api/history
func (h *CabinetHandler) AddHistory(c *gin.Context) {
	userID, _ := currentUserID(c)
	var body struct {
		RecipeID     string `json:"recipe_id"`
		RecipeName   string `json:"recipe_name"`
		ImageKeyword string `json:"image_keyword"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.RecipeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}
	if err := h.db.AddHistory(c.Request.Context(), userID, body.RecipeID, body.RecipeName, body.ImageKeyword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DELETE /api/history
func (h *CabinetHandler) ClearHistory(c *gin.Context) {
	userID, _ := currentUserID(c)
	if err := h.db.ClearHistory(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ── Notes ──────────────────────────────────────────────────────────────────

// GET /api/notes
func (h *CabinetHandler) GetAllNotes(c *gin.Context) {
	userID, _ := currentUserID(c)
	items, err := h.db.GetAllNotes(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	if items == nil {
		items = []domain.Note{}
	}
	c.JSON(http.StatusOK, items)
}

// GET /api/notes/:recipe_id
func (h *CabinetHandler) GetNote(c *gin.Context) {
	userID, _ := currentUserID(c)
	recipeID := c.Param("recipe_id")
	note, err := h.db.GetNote(c.Request.Context(), userID, recipeID)
	if err == db.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"content": ""})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, note)
}

// PUT /api/notes/:recipe_id
func (h *CabinetHandler) UpsertNote(c *gin.Context) {
	userID, _ := currentUserID(c)
	recipeID := c.Param("recipe_id")
	var body struct {
		RecipeName string `json:"recipe_name"`
		Content    string `json:"content"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "невалидный запрос"})
		return
	}
	note, err := h.db.UpsertNote(c.Request.Context(), userID, recipeID, body.RecipeName, body.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, note)
}

// DELETE /api/notes/:recipe_id
func (h *CabinetHandler) DeleteNote(c *gin.Context) {
	userID, _ := currentUserID(c)
	recipeID := c.Param("recipe_id")
	if err := h.db.DeleteNote(c.Request.Context(), userID, recipeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сервера"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
