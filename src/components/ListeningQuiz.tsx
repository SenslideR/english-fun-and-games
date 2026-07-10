import { useEffect, useState } from 'react'
import type { VocabCard } from '../types'
import { answersMatch, shuffle } from '../lib/quiz'
import { speak } from '../lib/speech'
import { Result, TopBar } from './TranslationQuiz'

interface Props {
  cards: VocabCard[]
  onFinish: (fraction: number) => void
  onBack: () => void
}

export function ListeningQuiz({ cards, onFinish, onBack }: Props) {
  const [deck, setDeck] = useState<VocabCard[]>(() => shuffle(cards))
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)

  const card = deck[index]
  const total = deck.length
  const isRight = checked && answersMatch(value, card.term)

  // Play the word automatically when a new question appears.
  useEffect(() => {
    if (!finished) speak(card.term)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished])

  function check() {
    if (checked || !value.trim()) return
    setChecked(true)
    if (answersMatch(value, card.term)) setCorrect((c) => c + 1)
  }

  function next() {
    if (index + 1 >= total) {
      setFinished(true)
      onFinish(correct / total)
    } else {
      setIndex((i) => i + 1)
      setValue('')
      setChecked(false)
    }
  }

  function restart() {
    setDeck(shuffle(cards))
    setIndex(0)
    setValue('')
    setChecked(false)
    setCorrect(0)
    setFinished(false)
  }

  if (finished) {
    return <Result correct={correct} total={total} onRetry={restart} onBack={onBack} />
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4">
      <TopBar onBack={onBack} correct={correct} index={index} total={total} />

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          Прослушайте и напишите слово
        </span>
        <button
          onClick={() => speak(card.term)}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-5xl transition hover:scale-105 active:scale-95 dark:bg-indigo-900"
          aria-label="Прослушать ещё раз"
          title="Прослушать ещё раз"
        >
          🔊
        </button>
        <span className="text-xs text-slate-400">нажмите, чтобы повторить</span>
      </div>

      <input
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (checked ? next() : check())
        }}
        disabled={checked}
        placeholder="Введите услышанное слово…"
        className={`w-full rounded-xl border-2 px-4 py-3 text-center text-lg font-medium focus:outline-none disabled:opacity-90 ${
          checked
            ? isRight
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
            : 'border-slate-300 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
        }`}
      />

      {checked && !isRight && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Правильно: <b className="text-slate-800 dark:text-slate-100">{card.term}</b> —{' '}
          {card.ru}
        </p>
      )}
      {checked && isRight && (
        <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
          Верно! <b>{card.term}</b> — {card.ru}
        </p>
      )}

      <button
        onClick={checked ? next : check}
        disabled={!value.trim()}
        className="rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {checked ? (index + 1 >= total ? 'Завершить' : 'Далее') : 'Проверить'}
      </button>
    </div>
  )
}
