.PHONY: dev dev-backend dev-frontend build test clean

# Start Go backend (requires .env with GROQ_API_KEY and TAVILY_API_KEY)
dev-backend:
	go run ./cmd/server

# Start React dev server with proxy to Go backend
dev-frontend:
	cd web && npm run dev

# Note: run dev-backend and dev-frontend in separate terminals
dev:
	@echo "Run in two terminals:"
	@echo "  Terminal 1: make dev-backend"
	@echo "  Terminal 2: make dev-frontend"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:8080"

# Build production binary (builds React first, then Go)
build:
	cd web && npm install && npm run build
	go build -o server ./cmd/server

# Run all Go tests
test:
	go test ./... -v

# Clean build artifacts
clean:
	rm -f server
	rm -rf web/dist
