import { useMemo, useState } from 'react'
import type { ExerciseSet } from '../types'
import { SpeakButton } from './SpeakButton'

interface Props {
  set: ExerciseSet
  onFinish: (fraction: number) => void
  onBack: () => void
}

type Status = 'unanswered' | 'correct' | 'wrong'

function normalise(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function ExercisePlayer({ set, onFinish, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState<Record<string, Status>>({})
  const [finished, setFinished] = useState(false)

  function statusOf(id: string): Status {
    return checked[id] ?? 'unanswered'
  }

  function check(id: string, value: string) {
    const item = set.items.find((i) => i.id === id)!
    const ok = item.answers.some((a) => normalise(a) === normalise(value))
    setAnswers((p) => ({ ...p, [id]: value }))
    setChecked((p) => ({ ...p, [id]: ok ? 'correct' : 'wrong' }))
  }

  const correctCount = useMemo(
    () => Object.values(checked).filter((s) => s === 'correct').length,
    [checked],
  )
  const answeredCount = Object.keys(checked).length
  const total = set.items.length

  function finish() {
    setFinished(true)
    onFinish(correctCount / total)
  }

  function retry() {
    setAnswers({})
    setChecked({})
    setFinished(false)
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
          Верно: <b className="text-emerald-600 dark:text-emerald-400">{correctCount}</b> / {total}
        </span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{set.title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{set.instructions}</p>
      </div>

      {set.wordBank && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          {set.wordBank.map((w) => (
            <span
              key={w}
              className="inline-flex items-center gap-1 rounded-lg bg-white py-1 pl-2.5 pr-1 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200"
            >
              {w}
              <SpeakButton text={w} size="sm" />
            </span>
          ))}
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {set.items.map((item, i) => {
          const status = statusOf(item.id)
          const value = answers[item.id] ?? ''
          return (
            <li
              key={item.id}
              className={`rounded-xl border p-4 transition ${
                status === 'correct'
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                  : status === 'wrong'
                    ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 text-slate-800 dark:text-slate-100">
                <span className="mr-1 text-sm font-semibold text-slate-400">{i + 1}.</span>
                <span>{item.before}</span>

                {set.kind === 'input' ? (
                  <input
                    value={value}
                    onChange={(e) => setAnswers((p) => ({ ...p, [item.id]: e.target.value }))}
                    onBlur={(e) => e.target.value && check(item.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && value) check(item.id, value)
                    }}
                    disabled={status === 'correct'}
                    placeholder="…"
                    className="w-32 rounded-md border-b-2 border-indigo-300 bg-transparent px-2 py-0.5 text-center font-medium text-indigo-700 focus:border-indigo-500 focus:outline-none disabled:opacity-70 dark:text-indigo-300"
                  />
                ) : (
                  <span className="inline-flex gap-1.5">
                    {item.options!.map((opt) => {
                      const picked = value === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => check(item.id, opt)}
                          disabled={status === 'correct'}
                          className={`rounded-lg border px-3 py-1 text-sm font-medium transition ${
                            picked && status === 'correct'
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : picked && status === 'wrong'
                                ? 'border-rose-500 bg-rose-500 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </span>
                )}

                {item.after && <span>{item.after}</span>}

                {item.hint && (
                  <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    {item.hint}
                  </span>
                )}
              </div>

              {status === 'wrong' && (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                  Правильный ответ: <b>{item.answers[0]}</b>
                </p>
              )}
            </li>
          )
        })}
      </ol>

      {!finished ? (
        <button
          onClick={finish}
          disabled={answeredCount < total}
          className="rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {answeredCount < total
            ? `Ответьте на все (${answeredCount}/${total})`
            : 'Завершить'}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center dark:border-indigo-800 dark:bg-indigo-950">
          <p className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
            Результат: {correctCount} / {total} ({Math.round((correctCount / total) * 100)}%)
          </p>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="rounded-lg border border-indigo-300 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300"
            >
              Ещё раз
            </button>
            <button
              onClick={onBack}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              К списку
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
