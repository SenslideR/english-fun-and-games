import { useCallback, useEffect, useState } from 'react'

export interface Progress {
  /** Card id -> "box" number for simple spaced repetition (1 = new, higher = known). */
  cardBox: Record<string, number>
  /** Exercise set id -> best score fraction 0..1. */
  exerciseScore: Record<string, number>
}

const STORAGE_KEY = 'english-app:progress:v1'

const empty: Progress = { cardBox: {}, exerciseScore: {} }

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<Progress>
    return { cardBox: parsed.cardBox ?? {}, exerciseScore: parsed.exerciseScore ?? {} }
  } catch {
    return empty
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [progress])

  const markCard = useCallback((cardId: string, known: boolean) => {
    setProgress((p) => {
      const current = p.cardBox[cardId] ?? 1
      const next = known ? Math.min(current + 1, 5) : 1
      return { ...p, cardBox: { ...p.cardBox, [cardId]: next } }
    })
  }, [])

  const saveExerciseScore = useCallback((setId: string, fraction: number) => {
    setProgress((p) => {
      const best = Math.max(p.exerciseScore[setId] ?? 0, fraction)
      return { ...p, exerciseScore: { ...p.exerciseScore, [setId]: best } }
    })
  }, [])

  const reset = useCallback(() => setProgress(empty), [])

  return { progress, markCard, saveExerciseScore, reset }
}
