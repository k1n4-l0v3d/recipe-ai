package handlers_test

import (
	"bufio"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	openai "github.com/sashabaranov/go-openai"
	"recipe-ai/internal/domain"
	"recipe-ai/internal/handlers"
)

type mockChatClient struct {
	response *handlers.GroqChatResponse
	messages []openai.ChatCompletionMessage
}

func (m *mockChatClient) Chat(_ context.Context, msgs []domain.ChatMessage, ctx string) (*handlers.GroqChatResponse, error) {
	return m.response, nil
}

func (m *mockChatClient) BuildMessagesForStream(msgs []domain.ChatMessage, recipeCtx, toolCallID, assistantContent, toolResult string) []openai.ChatCompletionMessage {
	return m.messages
}

// StreamChatWithContext satisfies GroqStreamer — not called in the no-tool-use test path.
func (m *mockChatClient) StreamChatWithContext(_ context.Context, _ []openai.ChatCompletionMessage) (*openai.ChatCompletionStream, error) {
	return nil, nil
}

type mockTavilyClient struct{}

func (m *mockTavilyClient) Search(_ context.Context, _ string) (*handlers.TavilySearchResult, error) {
	return &handlers.TavilySearchResult{URLs: []string{"https://eda.ru"}, Content: "рецепт борща"}, nil
}

func TestChatHandlerNoToolUse(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockGroq := &mockChatClient{
		response: &handlers.GroqChatResponse{Content: "Можно заменить куркумой"},
	}
	mockTavily := &mockTavilyClient{}

	router := gin.New()
	router.POST("/api/chat", handlers.ChatSSE(mockGroq, mockTavily))

	body := `{"messages":[{"role":"user","content":"Чем заменить шафран?"}],"recipe_context":""}`
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/chat", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Parse SSE events
	var events []domain.SSEEvent
	scanner := bufio.NewScanner(w.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			var event domain.SSEEvent
			json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &event)
			events = append(events, event)
		}
	}

	if len(events) == 0 {
		t.Fatal("expected at least one SSE event")
	}
	lastEvent := events[len(events)-1]
	if lastEvent.Type != "done" {
		t.Errorf("expected last event type=done, got %s", lastEvent.Type)
	}
}
