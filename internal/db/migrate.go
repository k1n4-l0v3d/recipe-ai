package db

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Migrate applies all SQL files in migrationsDir that have not yet been applied.
func (db *DB) Migrate(ctx context.Context, migrationsDir string) error {
	_, err := db.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename   TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`)
	if err != nil {
		return fmt.Errorf("migrate: create tracking table: %w", err)
	}

	rows, err := db.pool.Query(ctx, "SELECT filename FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("migrate: query applied: %w", err)
	}
	applied := make(map[string]bool)
	for rows.Next() {
		var f string
		if err := rows.Scan(&f); err != nil {
			return err
		}
		applied[f] = true
	}
	rows.Close()

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("migrate: read dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, name := range files {
		if applied[name] {
			continue
		}
		content, err := os.ReadFile(filepath.Join(migrationsDir, name))
		if err != nil {
			return fmt.Errorf("migrate: read %s: %w", name, err)
		}
		if _, err := db.pool.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("migrate: apply %s: %w", name, err)
		}
		if _, err := db.pool.Exec(ctx,
			"INSERT INTO schema_migrations(filename) VALUES($1)", name,
		); err != nil {
			return fmt.Errorf("migrate: record %s: %w", name, err)
		}
	}
	return nil
}
