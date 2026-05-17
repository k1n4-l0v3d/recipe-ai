package db

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"recipe-ai/internal/domain"
)

// ── Favorites ──────────────────────────────────────────────────────────────

func (db *DB) GetFavorites(ctx context.Context, userID string) ([]domain.RecipePreview, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT recipe_id, recipe_name, COALESCE(image_keyword,''), added_at::text
		FROM favorites WHERE user_id = $1 ORDER BY added_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("db: get favorites: %w", err)
	}
	defer rows.Close()

	var result []domain.RecipePreview
	for rows.Next() {
		var p domain.RecipePreview
		if err := rows.Scan(&p.RecipeID, &p.RecipeName, &p.ImageKeyword, &p.AddedAt); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, nil
}

func (db *DB) AddFavorite(ctx context.Context, userID, recipeID, recipeName, imageKeyword string) error {
	_, err := db.pool.Exec(ctx, `
		INSERT INTO favorites(user_id, recipe_id, recipe_name, image_keyword)
		VALUES($1,$2,$3,$4) ON CONFLICT(user_id,recipe_id) DO NOTHING
	`, userID, recipeID, recipeName, imageKeyword)
	if err != nil {
		return fmt.Errorf("db: add favorite: %w", err)
	}
	return nil
}

func (db *DB) RemoveFavorite(ctx context.Context, userID, recipeID string) error {
	_, err := db.pool.Exec(ctx,
		"DELETE FROM favorites WHERE user_id=$1 AND recipe_id=$2", userID, recipeID)
	return err
}

func (db *DB) IsFavorite(ctx context.Context, userID, recipeID string) (bool, error) {
	var exists bool
	err := db.pool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id=$1 AND recipe_id=$2)",
		userID, recipeID).Scan(&exists)
	return exists, err
}

// ── History ────────────────────────────────────────────────────────────────

func (db *DB) GetHistory(ctx context.Context, userID string) ([]domain.RecipePreview, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT recipe_id, recipe_name, COALESCE(image_keyword,''), viewed_at::text
		FROM history WHERE user_id = $1 ORDER BY viewed_at DESC LIMIT 50
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("db: get history: %w", err)
	}
	defer rows.Close()

	var result []domain.RecipePreview
	for rows.Next() {
		var p domain.RecipePreview
		if err := rows.Scan(&p.RecipeID, &p.RecipeName, &p.ImageKeyword, &p.ViewedAt); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, nil
}

func (db *DB) AddHistory(ctx context.Context, userID, recipeID, recipeName, imageKeyword string) error {
	_, err := db.pool.Exec(ctx, `
		INSERT INTO history(user_id, recipe_id, recipe_name, image_keyword)
		VALUES($1,$2,$3,$4)
	`, userID, recipeID, recipeName, imageKeyword)
	return err
}

func (db *DB) ClearHistory(ctx context.Context, userID string) error {
	_, err := db.pool.Exec(ctx, "DELETE FROM history WHERE user_id=$1", userID)
	return err
}

// ── Notes ──────────────────────────────────────────────────────────────────

func (db *DB) GetNote(ctx context.Context, userID, recipeID string) (*domain.Note, error) {
	var n domain.Note
	err := db.pool.QueryRow(ctx, `
		SELECT recipe_id, recipe_name, content, updated_at::text
		FROM notes WHERE user_id=$1 AND recipe_id=$2
	`, userID, recipeID).Scan(&n.RecipeID, &n.RecipeName, &n.Content, &n.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("db: get note: %w", err)
	}
	return &n, nil
}

func (db *DB) UpsertNote(ctx context.Context, userID, recipeID, recipeName, content string) (*domain.Note, error) {
	var n domain.Note
	err := db.pool.QueryRow(ctx, `
		INSERT INTO notes(user_id, recipe_id, recipe_name, content, updated_at)
		VALUES($1,$2,$3,$4,now())
		ON CONFLICT(user_id,recipe_id) DO UPDATE
		  SET content=$4, recipe_name=$3, updated_at=now()
		RETURNING recipe_id, recipe_name, content, updated_at::text
	`, userID, recipeID, recipeName, content).Scan(&n.RecipeID, &n.RecipeName, &n.Content, &n.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("db: upsert note: %w", err)
	}
	return &n, nil
}

func (db *DB) DeleteNote(ctx context.Context, userID, recipeID string) error {
	_, err := db.pool.Exec(ctx,
		"DELETE FROM notes WHERE user_id=$1 AND recipe_id=$2", userID, recipeID)
	return err
}

func (db *DB) GetAllNotes(ctx context.Context, userID string) ([]domain.Note, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT recipe_id, recipe_name, content, updated_at::text
		FROM notes WHERE user_id=$1 ORDER BY updated_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("db: get all notes: %w", err)
	}
	defer rows.Close()

	var result []domain.Note
	for rows.Next() {
		var n domain.Note
		if err := rows.Scan(&n.RecipeID, &n.RecipeName, &n.Content, &n.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, n)
	}
	return result, nil
}

// ── Profile ────────────────────────────────────────────────────────────────

func (db *DB) UpdateUserName(ctx context.Context, userID, name string) error {
	_, err := db.pool.Exec(ctx, "UPDATE users SET name=$1 WHERE id=$2", name, userID)
	return err
}

func (db *DB) UpdateUserPassword(ctx context.Context, userID, newHash string) error {
	_, err := db.pool.Exec(ctx, "UPDATE users SET password_hash=$1 WHERE id=$2", newHash, userID)
	return err
}
