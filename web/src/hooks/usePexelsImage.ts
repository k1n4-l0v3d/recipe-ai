import { useState, useEffect } from 'react'

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY as string | undefined

// usePexelsImage fetches a food image URL from Pexels for the given keyword.
// Returns null while loading or if no image is found.
export function usePexelsImage(keyword: string | undefined): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!keyword || !PEXELS_KEY) return

    let cancelled = false
    fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}+food&per_page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    )
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.photos?.[0]?.src?.medium) {
          setImageUrl(data.photos[0].src.medium)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [keyword])

  return imageUrl
}
