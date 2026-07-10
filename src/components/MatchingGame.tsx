import { useMemo, useState } from 'react'
import type { VocabCard } from '../types'
import { shuffle } from '../lib/quiz'
import { Result } from './TranslationQuiz'

interface Props {
  cards: VocabCard[]
  onFinish: (fraction: number) => void
  onBack: () => void
}

const CHUNK = 6

export function MatchingGame({ cards, onFinish, onBack }: Props) {
  const chunks = useMemo(() => {
    const shuffled = shuffle(cards)
    const out: VocabCard[][] = []
    for (let i = 0; i < shuffled.length; i += CHUNK) out.push(shuffled.slice(i, i + CHUNK))
    return out
  }, [cards])

  const [round, setRound] = useState(0)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [selLeft, setSelLeft] = useState<string | null>(null)
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)

  const chunk = chunks[round]
  // Column orders are stable per round.
  const leftOrder = useMemo(() => shuffle(chunk), [round]) // terms
  const rightOrder = useMemo(() => shuffle(chunk), [round]) // translations
  const totalPairs = cards.length

  function pickRight(rightId: string) {
    if (!selLeft) return
    if (selLeft === rightId) {
      const nextMatched = new Set(matched).add(rightId)
      setMatched(nextMatched)
      setSelLeft(null)
      // Round complete?
      if (chunk.every((c) => nextMatched.has(c.id))) {
        if (round + 1 >= chunks.length) {
          setFinished(true)
          onFinish(totalPairs / (totalPairs + mistakes))
        } else {
          setRound((r) => r + 1)
          setMatched(new Set())
        }
      }
    } else {
      setMistakes((m) => m + 1)
      setWrong({ left: selLeft, right: rightId })
      setTimeout(() => setWrong(null), 500)
      setSelLeft(null)
    }
  }

  function restart() {
    setRound(0)
    setMatched(new Set())
    setSelLeft(null)
    setWrong(null)
    setMistakes(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <Result
        correct={totalPairs}
        total={totalPairs + mistakes}
        onRetry={restart}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <button
          onClick={onBack}
          className="rounded-lg px-3 py-1.5 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          ← Назад
        </button>
        <span>
          Раунд {round + 1}/{chunks.length} · ошибок:{' '}
          <b className="text-rose-500">{mistakes}</b>
        </span>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Сопоставление</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Соедините слово с переводом: нажмите слово слева, затем перевод справа.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Terms */}
        <div className="flex flex-col gap-2">
          {leftOrder.map((c) => {
            const done = matched.has(c.id)
            const selected = selLeft === c.id
            const isWrong = wrong?.left === c.id
            return (
              <button
                key={c.id}
                disabled={done}
                onClick={() => setSelLeft(c.id)}
                className={tile(done, selected, isWrong)}
              >
                {c.term}
              </button>
            )
          })}
        </div>
        {/* Translations */}
        <div className="flex flex-col gap-2">
          {rightOrder.map((c) => {
            const done = matched.has(c.id)
            const isWrong = wrong?.right === c.id
            return (
              <button
                key={c.id}
                disabled={done}
                onClick={() => pickRight(c.id)}
                className={tile(done, false, isWrong)}
              >
                {c.ru}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function tile(done: boolean, selected: boolean, wrong: boolean): string {
  const base =
    'rounded-xl border px-3 py-3 text-sm font-medium transition text-left'
  if (done)
    return `${base} border-emerald-400 bg-emerald-50 text-emerald-700 opacity-60 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`
  if (wrong)
    return `${base} border-rose-500 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300`
  if (selected)
    return `${base} border-indigo-500 bg-indigo-100 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-900 dark:text-white`
  return `${base} border-slate-200 bg-white text-slate-800 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100`
}
