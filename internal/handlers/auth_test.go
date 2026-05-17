package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"recipe-ai/internal/handlers"
)

func TestRegisterValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cases := []struct {
		name     string
		body     map[string]any
		wantCode int
	}{
		{"missing name", map[string]any{"email": "a@b.com", "password": "12345678"}, http.StatusBadRequest},
		{"short password", map[string]any{"name": "X", "email": "a@b.com", "password": "short"}, http.StatusBadRequest},
		{"bad email", map[string]any{"name": "X", "email": "notanemail", "password": "12345678"}, http.StatusBadRequest},
	}

	// nil DB — validation runs before DB calls
	h := handlers.NewAuthHandler(nil)
	router := gin.New()
	router.POST("/register", h.Register)

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			b, _ := json.Marshal(tc.body)
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)
			if w.Code != tc.wantCode {
				t.Errorf("want %d, got %d: %s", tc.wantCode, w.Code, w.Body.String())
			}
		})
	}
}
