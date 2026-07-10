import type { VocabCard } from '../types'

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick `n` distractor cards from the pool, excluding `correct`. */
export function pickDistractors(
  pool: readonly VocabCard[],
  correct: VocabCard,
  n: number,
): VocabCard[] {
  return shuffle(pool.filter((c) => c.id !== correct.id)).slice(0, n)
}

/** Compare two answers case-insensitively, ignoring extra spaces. */
export function answersMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  return norm(a) === norm(b)
}
