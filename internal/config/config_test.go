package config_test

import (
	"os"
	"testing"

	"recipe-ai/internal/config"
)

func TestLoad(t *testing.T) {
	os.Setenv("GROQ_API_KEY", "test-groq")
	os.Setenv("TAVILY_API_KEY", "test-tavily")
	os.Setenv("PORT", "9090")
	defer func() {
		os.Unsetenv("GROQ_API_KEY")
		os.Unsetenv("TAVILY_API_KEY")
		os.Unsetenv("PORT")
	}()

	cfg := config.Load()

	if cfg.GroqAPIKey != "test-groq" {
		t.Errorf("expected GroqAPIKey=test-groq, got %s", cfg.GroqAPIKey)
	}
	if cfg.TavilyAPIKey != "test-tavily" {
		t.Errorf("expected TavilyAPIKey=test-tavily, got %s", cfg.TavilyAPIKey)
	}
	if cfg.Port != "9090" {
		t.Errorf("expected Port=9090, got %s", cfg.Port)
	}
}

func TestLoadDefaultPort(t *testing.T) {
	original, exists := os.LookupEnv("PORT")
	os.Unsetenv("PORT")
	defer func() {
		if exists {
			os.Setenv("PORT", original)
		} else {
			os.Unsetenv("PORT")
		}
	}()

	cfg := config.Load()
	if cfg.Port != "8080" {
		t.Errorf("expected default Port=8080, got %s", cfg.Port)
	}
}
