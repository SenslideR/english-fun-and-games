import { useState } from 'react'
import type { VocabCard } from '../types'
import { pickDistractors, shuffle } from '../lib/quiz'
import { SpeakButton } from './SpeakButton'

interface Props {
  cards: VocabCard[]
  onFinish: (fraction: number) => void
  onBack: () => void
}

interface Question {
  card: VocabCard
  dir: 'en2ru' | 'ru2en'
  prompt: string
  options: { label: string; correct: boolean; term: string }[]
}

function buildQuestions(cards: VocabCard[]): Question[] {
  const pool = cards
  return shuffle(pool).map((card) => {
    const dir: Question['dir'] = Math.random() < 0.5 ? 'en2ru' : 'ru2en'
    const distractors = pickDistractors(pool, card, 3)
    const correctLabel = dir === 'en2ru' ? card.ru : card.term
    const options = shuffle([
      { label: correctLabel, correct: true, term: card.term },
      ...distractors.map((d) => ({
        label: dir === 'en2ru' ? d.ru : d.term,
        correct: false,
        term: d.term,
      })),
    ])
    return {
      card,
      dir,
      prompt: dir === 'en2ru' ? card.term : card.ru,
      options,
    }
  })
}

export function TranslationQuiz({ cards, onFinish, onBack }: Props) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(cards))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = questions[index]
  const total = questions.length

  function choose(i: number) {
    if (picked !== null) return
    setPicked(i)
    if (q.options[i].correct) setCorrect((c) => c + 1)
  }

  function next() {
    if (index + 1 >= total) {
      setFinished(true)
      onFinish(correct / total)
    } else {
      setIndex((i) => i + 1)
      setPicked(null)
    }
  }

  function restart() {
    setQuestions(buildQuestions(cards))
    setIndex(0)
    setPicked(null)
    setCorrect(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <Result
        correct={correct}
        total={total}
        onRetry={restart}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4">
      <TopBar onBack={onBack} correct={correct} index={index} total={total} />

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          {q.dir === 'en2ru' ? 'Переведите на русский' : 'Translate into English'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {q.prompt}
          </span>
          {q.dir === 'en2ru' && <SpeakButton text={q.card.term} />}
        </div>
      </div>

      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const isPicked = picked === i
          const reveal = picked !== null
          const state =
            reveal && opt.correct
              ? 'correct'
              : reveal && isPicked
                ? 'wrong'
                : 'idle'
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`rounded-xl border px-4 py-3 text-left font-medium transition ${
                state === 'correct'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                  : state === 'wrong'
                    ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              } ${picked !== null ? 'cursor-default' : ''}`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <button
          onClick={next}
          className="rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          {index + 1 >= total ? 'Завершить' : 'Далее'}
        </button>
      )}
    </div>
  )
}

export function TopBar({
  onBack,
  correct,
  index,
  total,
}: {
  onBack: () => void
  correct: number
  index: number
  total: number
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <button
          onClick={onBack}
          className="rounded-lg px-3 py-1.5 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          ← Назад
        </button>
        <span>
          Верно: <b className="text-emerald-600 dark:text-emerald-400">{correct}</b> · Вопрос{' '}
          {index + 1}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

export function Result({
  correct,
  total,
  onRetry,
  onBack,
}: {
  correct: number
  total: number
  onRetry: () => void
  onBack: () => void
}) {
  const pct = Math.round((correct / total) * 100)
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-4 pt-10 text-center">
      <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        {correct} / {total} ({pct}%)
      </h2>
      <p className="text-slate-500 dark:text-slate-400">
        {pct >= 80
          ? 'Отличный результат!'
          : pct >= 50
            ? 'Неплохо, ещё немного практики!'
            : 'Стоит повторить карточки.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
        >
          Ещё раз
        </button>
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          На главную
        </button>
      </div>
    </div>
  )
}
