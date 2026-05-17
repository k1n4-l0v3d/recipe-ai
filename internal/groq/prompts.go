package groq

import "fmt"

const systemChatPrompt = `Ты профессиональный кулинарный ассистент. Отвечай ТОЛЬКО на русском языке.
Ты помогаешь пользователям находить рецепты и отвечаешь на кулинарные вопросы.
Когда пользователь просит найти новый рецепт или тебе нужна актуальная информация из интернета — используй инструмент search_recipes.
Для общих вопросов (замена ингредиентов, техники приготовления, советы) — отвечай сразу из своих знаний.
Если в контексте указан открытый рецепт — отвечай в контексте именно этого блюда.
Будь дружелюбным, конкретным и полезным. Используй эмодзи умеренно.`

func chatSystemWithContext(recipeCtx string) string {
	if recipeCtx == "" {
		return systemChatPrompt
	}
	return systemChatPrompt + fmt.Sprintf("\n\nПользователь сейчас смотрит рецепт: %s", recipeCtx)
}

func categoryListPrompt(categoryName string) string {
	return fmt.Sprintf(`Сгенерируй список из 8 рецептов в категории "%s".
Верни ТОЛЬКО валидный JSON массив (без markdown, без пояснений) в таком формате:
[
  {
    "name": "Название блюда",
    "description": "Краткое описание в 1 предложении",
    "time": "30 мин",
    "difficulty": "Легко",
    "tags": ["тег1", "тег2"],
    "image_keyword": "greek salad"
  }
]
Difficulty должен быть одним из: "Легко", "Средне", "Сложно".
Названия и описания на русском языке.
image_keyword — 1-3 слова на АНГЛИЙСКОМ языке для поиска фотографии этого блюда (например: "pasta carbonara", "borscht soup", "caesar salad").`, categoryName)
}

func recipeDetailPrompt(recipeName string) string {
	return fmt.Sprintf(`Сгенерируй подробный рецепт для блюда "%s".
Верни ТОЛЬКО валидный JSON объект (без markdown, без пояснений) в таком формате:
{
  "name": "Название",
  "cuisine": "Страна/кухня",
  "time": "45 мин",
  "difficulty": "Средне",
  "description": "Описание блюда в 2 предложениях",
  "tags": ["тег1", "тег2"],
  "image_keyword": "paella seafood",
  "ingredients": [
    {"name": "Ингредиент", "amount": "200г"}
  ],
  "steps": [
    "Шаг 1: ...",
    "Шаг 2: ..."
  ]
}
Difficulty должен быть одним из: "Легко", "Средне", "Сложно".
Всё на русском языке. Ингредиентов 5-12, шагов 4-10.
image_keyword — 1-3 слова на АНГЛИЙСКОМ языке для поиска фотографии этого блюда (например: "beef stew", "chocolate cake", "fish tacos").`, recipeName)
}
