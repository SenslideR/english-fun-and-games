// Core data model for the English learning app.

export interface VocabCard {
  id: string
  /** The English word or phrase to learn. */
  term: string
  /** Part of speech, e.g. "v", "n", "adj", "n phr". */
  pos?: string
  /** Short English definition. */
  definition: string
  /** Russian translation. */
  ru: string
  /** Optional example sentence. */
  example?: string
}

export type ExerciseKind = 'choice' | 'input'

export interface ExerciseItem {
  id: string
  /** Text shown before the gap. */
  before: string
  /** Text shown after the gap. */
  after?: string
  /** For 'choice' items: the options to pick from. */
  options?: string[]
  /** Accepted answers (compared case-insensitively, trimmed). */
  answers: string[]
  /** Optional hint, e.g. the ALL-CAPS base word for word-formation tasks. */
  hint?: string
}

export interface ExerciseSet {
  id: string
  title: string
  instructions: string
  kind: ExerciseKind
  items: ExerciseItem[]
  /** Optional bank of words shown above the exercise. */
  wordBank?: string[]
}

export interface Deck {
  id: string
  title: string
  description: string
  cards: VocabCard[]
}

export interface CrosswordEntry {
  number: number
  answer: string
  clue: string
  /** Zero-based coordinates of the entry's first letter. */
  row: number
  col: number
  dir: 'across' | 'down'
}

export interface Crossword {
  id: string
  title: string
  instructions: string
  rows: number
  cols: number
  entries: CrosswordEntry[]
}

export interface Unit {
  id: string
  title: string
  subtitle: string
  decks: Deck[]
  exercises: ExerciseSet[]
  crossword?: Crossword
}
