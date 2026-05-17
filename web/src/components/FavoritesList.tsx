import { Link } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import { usePexelsImage } from '../hooks/usePexelsImage'

function FavoriteCard({ recipe_id, recipe_name, image_keyword, onRemove }: {
  recipe_id: string; recipe_name: string; image_keyword: string; onRemove: () => void
}) {
  const imageUrl = usePexelsImage(image_keyword || undefined)
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
      <Link to={`/recipe/${recipe_id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {imageUrl && (
          <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-3)' }}>
            <img src={imageUrl} alt={recipe_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{recipe_name}</div>
        </div>
      </Link>
      <button
        onClick={onRemove}
        aria-label="Убрать из избранного"
        style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ❤️
      </button>
    </div>
  )
}

export default function FavoritesList() {
  const { favorites, loading, remove } = useFavorites()

  if (loading) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Загрузка...</div>

  if (favorites.length === 0) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🤍</div>
      <div style={{ fontSize: 14 }}>Нет избранных рецептов</div>
      <div style={{ fontSize: 12, marginTop: 6 }}>Нажми ❤️ на любой странице рецепта</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {favorites.map(f => (
        <FavoriteCard
          key={f.recipe_id}
          recipe_id={f.recipe_id}
          recipe_name={f.recipe_name}
          image_keyword={f.image_keyword}
          onRemove={() => remove(f.recipe_id)}
        />
      ))}
    </div>
  )
}
