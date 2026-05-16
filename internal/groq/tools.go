package groq

import (
	"encoding/json"

	openai "github.com/sashabaranov/go-openai"
)

// searchRecipesTool is the function calling tool Groq uses to trigger Tavily search.
var searchRecipesTool = openai.Tool{
	Type: openai.ToolTypeFunction,
	Function: &openai.FunctionDefinition{
		Name:        "search_recipes",
		Description: "Ищет рецепты и кулинарную информацию в интернете через форумы и кулинарные сайты. Используй когда нужен конкретный рецепт или актуальная информация.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"query": map[string]any{
					"type":        "string",
					"description": "Поисковый запрос на русском языке, например: 'рецепт борща со свеклой'",
				},
			},
			"required": []string{"query"},
		},
	},
}

// ToolCallQuery extracts the search query from a Groq tool call argument JSON string.
func ToolCallQuery(arguments string) (string, error) {
	var args struct {
		Query string `json:"query"`
	}
	if err := json.Unmarshal([]byte(arguments), &args); err != nil {
		return "", err
	}
	return args.Query, nil
}
