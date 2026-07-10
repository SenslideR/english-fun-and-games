import { useMemo, useState } from 'react'
import type { Deck } from '../types'
import { SpeakButton } from './SpeakButton'

interface Props {
  deck: Deck
  cardBox: Record<string, number>
  onMark: (cardId: string, known: boolean) => void
  onBack: () => void
}

export function Flashcards({ deck, cardBox, onMark, onBack }: Props) {
  // Order cards so the least-known ones come first.
  const order = useMemo(
    () =>
      [...deck.cards].sort(
        (a, b) => (cardBox[a.id] ?? 1) - (cardBox[b.id] ?? 1),
      ),
    // Only re-sort when the deck changes, not on every mark (avoids jumping).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck.id],
  )

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)

  const card = order[index]
  const total = order.length

  function advance(known: boolean) {
    onMark(card.id, known)
    setFlipped(false)
    setDone((d) => d + 1)
    setIndex((i) => (i + 1) % total)
  }

  const box = cardBox[card.id] ?? 1

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4">
      <div className="flex w-full items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <button
          onClick={onBack}
          className="rounded-lg px-3 py-1.5 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          ← Назад
        </button>
        <span>
          Изучено за сессию: <b>{done}</b>
        </span>
      </div>

      <div className="w-full text-center">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {deck.title}
        </h2>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Карточка {index + 1} из {total}
        </p>
      </div>

      {/* Flip card */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="perspective group h-64 w-full focus:outline-none"
        aria-label="Перевернуть карточку"
      >
        <div
          className={`preserve-3d relative h-full w-full transition-transform duration-500 ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">
                {card.term}
              </span>
              <SpeakButton text={card.term} />
            </div>
            {card.pos && (
              <span className="mt-2 rounded-full bg-slate-100 px-3 py-0.5 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                {card.pos}
              </span>
            )}
            <span className="mt-6 text-xs text-slate-400">
              нажмите, чтобы перевернуть
            </span>
          </div>

          {/* Back */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-indigo-200 bg-indigo-50 p-6 text-center shadow-lg dark:border-indigo-800 dark:bg-indigo-950">
            <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">
              {card.ru}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {card.definition}
            </span>
            {card.example && (
              <span className="flex items-center gap-1.5 text-sm italic text-slate-500 dark:text-slate-400">
                «{card.example}»
                <SpeakButton text={card.example} size="sm" />
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Rating */}
      <div className="flex w-full gap-3">
        <button
          onClick={() => advance(false)}
          className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-3 font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
        >
          Повторить
        </button>
        <button
          onClick={() => advance(true)}
          className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-3 font-semibold text-emerald-600 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
        >
          Знаю
        </button>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-2 w-6 rounded-full ${
              n <= box ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
            title={`Уровень запоминания: ${box}/5`}
          />
        ))}
      </div>
    </div>
  )
}
