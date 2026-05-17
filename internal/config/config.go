package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	GroqAPIKey   string
	TavilyAPIKey string
	PexelsAPIKey string
	Port         string
}

func Load() *Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		GroqAPIKey:   os.Getenv("GROQ_API_KEY"),
		TavilyAPIKey: os.Getenv("TAVILY_API_KEY"),
		PexelsAPIKey: os.Getenv("PEXELS_API_KEY"),
		Port:         port,
	}
}
