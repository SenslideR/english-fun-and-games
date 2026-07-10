import { useMemo, useState } from 'react'
import { unit3 } from './data/unit3'
import { useProgress } from './hooks/useProgress'
import { Flashcards } from './components/Flashcards'
import { ExercisePlayer } from './components/ExercisePlayer'
import { Crossword } from './components/Crossword'
import { TranslationQuiz } from './components/TranslationQuiz'
import { ListeningQuiz } from './components/ListeningQuiz'
import { MatchingGame } from './components/MatchingGame'

type PracticeId = 'listening' | 'translation' | 'matching'

type View =
  | { name: 'home' }
  | { name: 'deck'; id: string }
  | { name: 'exercise'; id: string }
  | { name: 'crossword' }
  | { name: 'practice'; id: PracticeId }

const PRACTICE: { id: PracticeId; icon: string; title: string; desc: string }[] = [
  { id: 'listening', icon: '🎧', title: 'Аудирование', desc: 'Прослушайте слово и напишите его.' },
  { id: 'translation', icon: '🔀', title: 'Квиз перевода', desc: 'Выберите правильный перевод (RU ↔ EN).' },
  { id: 'matching', icon: '🧠', title: 'Сопоставление', desc: 'Соедините слово с его переводом.' },
]

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const { progress, markCard, saveExerciseScore, reset } = useProgress()

  const unit = unit3

  // All vocabulary cards pooled together for the practice modes.
  const allCards = useMemo(() => unit.decks.flatMap((d) => d.cards), [unit.decks])

  const deckStats = useMemo(() => {
    return Object.fromEntries(
      unit.decks.map((d) => {
        const known = d.cards.filter((c) => (progress.cardBox[c.id] ?? 1) >= 4).length
        return [d.id, { known, total: d.cards.length }]
      }),
    )
  }, [progress.cardBox, unit.decks])

  if (view.name === 'deck') {
    const deck = unit.decks.find((d) => d.id === view.id)!
    return (
      <Shell>
        <Flashcards
          deck={deck}
          cardBox={progress.cardBox}
          onMark={markCard}
          onBack={() => setView({ name: 'home' })}
        />
      </Shell>
    )
  }

  if (view.name === 'exercise') {
    const set = unit.exercises.find((e) => e.id === view.id)!
    return (
      <Shell>
        <ExercisePlayer
          set={set}
          onFinish={(f) => saveExerciseScore(set.id, f)}
          onBack={() => setView({ name: 'home' })}
        />
      </Shell>
    )
  }

  if (view.name === 'crossword' && unit.crossword) {
    const cw = unit.crossword
    return (
      <Shell>
        <Crossword
          data={cw}
          onFinish={(f) => saveExerciseScore(cw.id, f)}
          onBack={() => setView({ name: 'home' })}
        />
      </Shell>
    )
  }

  if (view.name === 'practice') {
    const onFinish = (f: number) => saveExerciseScore(`practice-${view.id}`, f)
    const onBack = () => setView({ name: 'home' })
    return (
      <Shell>
        {view.id === 'listening' && (
          <ListeningQuiz cards={allCards} onFinish={onFinish} onBack={onBack} />
        )}
        {view.id === 'translation' && (
          <TranslationQuiz cards={allCards} onFinish={onFinish} onBack={onBack} />
        )}
        {view.id === 'matching' && (
          <MatchingGame cards={allCards} onFinish={onFinish} onBack={onBack} />
        )}
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4">
        <header className="pt-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
            {unit.subtitle}
          </p>
          <h1 className="mt-1 text-4xl font-black text-slate-900 dark:text-white">
            {unit.title}
          </h1>
        </header>

        {/* Section navigation */}
        <nav className="sticky top-0 z-20 -mx-4 flex flex-wrap justify-center gap-2 border-b border-slate-200 bg-slate-50/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
          {[
            { href: '#decks', label: '📚 Карточки' },
            { href: '#practice', label: '🎯 Тренировка' },
            { href: '#crossword', label: '🧩 Кроссворд' },
            { href: '#exercises', label: '✏️ Упражнения' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Flashcard decks */}
        <section id="decks" className="scroll-mt-20">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
            📚 Карточки для изучения
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {unit.decks.map((deck) => {
              const s = deckStats[deck.id]
              return (
                <button
                  key={deck.id}
                  onClick={() => setView({ name: 'deck', id: deck.id })}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {deck.title}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {deck.description}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(s.known / s.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {s.known}/{s.total} выучено
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Practice modes (generated from the vocabulary) */}
        <section id="practice" className="scroll-mt-20">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
            🎯 Тренировка слов
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PRACTICE.map((p) => {
              const score = progress.exerciseScore[`practice-${p.id}`]
              return (
                <button
                  key={p.id}
                  onClick={() => setView({ name: 'practice', id: p.id })}
                  className="flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                >
                  <span className="flex items-center justify-between text-2xl">
                    {p.icon}
                    {score !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          score >= 0.8
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {Math.round(score * 100)}%
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {p.title}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {p.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Crossword */}
        {unit.crossword && (
          <section id="crossword" className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
              🧩 Кроссворд
            </h2>
            <button
              onClick={() => setView({ name: 'crossword' })}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {unit.crossword.title}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {unit.crossword.instructions}
                </span>
              </div>
              {progress.exerciseScore[unit.crossword.id] !== undefined && (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    progress.exerciseScore[unit.crossword.id] >= 0.99
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  }`}
                >
                  {Math.round(progress.exerciseScore[unit.crossword.id] * 100)}%
                </span>
              )}
            </button>
          </section>
        )}

        {/* Interactive exercises */}
        <section id="exercises" className="scroll-mt-20">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
            ✏️ Интерактивные упражнения
          </h2>
          <p className="mb-3 -mt-1 text-sm text-slate-500 dark:text-slate-400">
            8 заданий из учебника (B–I) + кроссворд A. Нажмите на карточку, чтобы решать.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {unit.exercises.map((ex) => {
              const score = progress.exerciseScore[ex.id]
              return (
                <button
                  key={ex.id}
                  onClick={() => setView({ name: 'exercise', id: ex.id })}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ex.title}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {ex.instructions}
                    </span>
                  </div>
                  {score !== undefined && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        score >= 0.8
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      }`}
                    >
                      {Math.round(score * 100)}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <footer className="pb-6 text-center">
          <button
            onClick={() => {
              if (confirm('Сбросить весь прогресс?')) reset()
            }}
            className="text-xs text-slate-400 underline hover:text-rose-500"
          >
            Сбросить прогресс
          </button>
        </footer>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {children}
    </div>
  )
}
