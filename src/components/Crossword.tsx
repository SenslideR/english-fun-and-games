import { useMemo, useRef, useState } from 'react'
import type { Crossword as CrosswordData, CrosswordEntry } from '../types'

interface Props {
  data: CrosswordData
  onFinish: (fraction: number) => void
  onBack: () => void
}

type Dir = 'across' | 'down'
const cellKey = (r: number, c: number) => `${r},${c}`

interface CellInfo {
  solution: string
  number?: number
  across?: CrosswordEntry
  down?: CrosswordEntry
}

export function Crossword({ data, onFinish, onBack }: Props) {
  // Build a map of active cells with their solution letter and entry links.
  const { cells, solutionCount } = useMemo(() => {
    const map = new Map<string, CellInfo>()
    for (const entry of data.entries) {
      for (let i = 0; i < entry.answer.length; i++) {
        const r = entry.dir === 'across' ? entry.row : entry.row + i
        const c = entry.dir === 'across' ? entry.col + i : entry.col
        const k = cellKey(r, c)
        const info = map.get(k) ?? { solution: entry.answer[i] }
        info.solution = entry.answer[i]
        if (entry.dir === 'across') info.across = entry
        else info.down = entry
        if (i === 0) info.number = entry.number
        map.set(k, info)
      }
    }
    return { cells: map, solutionCount: map.size }
  }, [data])

  const [letters, setLetters] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [active, setActive] = useState<{ r: number; c: number; dir: Dir } | null>(null)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  function focusCell(r: number, c: number) {
    inputs.current[cellKey(r, c)]?.focus()
  }

  function onCellClick(r: number, c: number) {
    const info = cells.get(cellKey(r, c))!
    // Toggle direction if the cell belongs to both and it's already active.
    let dir: Dir = info.across ? 'across' : 'down'
    if (active && active.r === r && active.c === c && info.across && info.down) {
      dir = active.dir === 'across' ? 'down' : 'across'
    } else if (!info.across) {
      dir = 'down'
    }
    setActive({ r, c, dir })
  }

  function step(r: number, c: number, dir: Dir, delta: number): [number, number] {
    return dir === 'across' ? [r, c + delta] : [r + delta, c]
  }

  function onKey(e: React.KeyboardEvent, r: number, c: number) {
    const dir = active?.dir ?? (cells.get(cellKey(r, c))!.across ? 'across' : 'down')
    if (e.key === 'Backspace') {
      if (!letters[cellKey(r, c)]) {
        const [pr, pc] = step(r, c, dir, -1)
        if (cells.has(cellKey(pr, pc))) {
          setActive({ r: pr, c: pc, dir })
          focusCell(pr, pc)
        }
      } else {
        setLetters((p) => ({ ...p, [cellKey(r, c)]: '' }))
      }
      return
    }
    const arrows: Record<string, [number, Dir]> = {
      ArrowRight: [1, 'across'],
      ArrowLeft: [-1, 'across'],
      ArrowDown: [1, 'down'],
      ArrowUp: [-1, 'down'],
    }
    if (arrows[e.key]) {
      e.preventDefault()
      const [delta, d] = arrows[e.key]
      const [nr, nc] = step(r, c, d, delta)
      if (cells.has(cellKey(nr, nc))) {
        setActive({ r: nr, c: nc, dir: d })
        focusCell(nr, nc)
      }
    }
  }

  function onInput(r: number, c: number, value: string) {
    const ch = value.slice(-1).toUpperCase()
    if (ch && !/[A-Z]/.test(ch)) return
    setLetters((p) => ({ ...p, [cellKey(r, c)]: ch }))
    setChecked(false)
    if (ch) {
      const dir = active?.dir ?? (cells.get(cellKey(r, c))!.across ? 'across' : 'down')
      const [nr, nc] = step(r, c, dir, 1)
      if (cells.has(cellKey(nr, nc))) {
        setActive({ r: nr, c: nc, dir })
        focusCell(nr, nc)
      }
    }
  }

  function isInActiveWord(r: number, c: number): boolean {
    if (!active) return false
    const entry = active.dir === 'across' ? cells.get(cellKey(active.r, active.c))?.across : cells.get(cellKey(active.r, active.c))?.down
    if (!entry) return false
    for (let i = 0; i < entry.answer.length; i++) {
      const er = entry.dir === 'across' ? entry.row : entry.row + i
      const ec = entry.dir === 'across' ? entry.col + i : entry.col
      if (er === r && ec === c) return true
    }
    return false
  }

  const correctCount = useMemo(
    () =>
      [...cells.entries()].filter(([k, info]) => letters[k] === info.solution).length,
    [letters, cells],
  )

  function check() {
    setChecked(true)
    onFinish(correctCount / solutionCount)
  }

  function reveal() {
    const full: Record<string, string> = {}
    for (const [k, info] of cells) full[k] = info.solution
    setLetters(full)
    setChecked(true)
    onFinish(1)
  }

  const across = data.entries.filter((e) => e.dir === 'across')
  const down = data.entries.filter((e) => e.dir === 'down')
  const solved = correctCount === solutionCount

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <button
          onClick={onBack}
          className="rounded-lg px-3 py-1.5 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          ← Назад
        </button>
        <span>
          Заполнено верно:{' '}
          <b className="text-emerald-600 dark:text-emerald-400">{correctCount}</b> / {solutionCount}
        </span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.instructions}</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Grid */}
        <div className="overflow-x-auto">
          <div
            className="grid w-max gap-0.5"
            style={{ gridTemplateColumns: `repeat(${data.cols}, 2rem)` }}
          >
            {Array.from({ length: data.rows * data.cols }).map((_, idx) => {
              const r = Math.floor(idx / data.cols)
              const c = idx % data.cols
              const info = cells.get(cellKey(r, c))
              if (!info) return <div key={idx} className="h-8 w-8" />
              const k = cellKey(r, c)
              const val = letters[k] ?? ''
              const wrong = checked && val && val !== info.solution
              const right = checked && val === info.solution
              const highlighted = isInActiveWord(r, c)
              const focused = active?.r === r && active?.c === c
              return (
                <div key={idx} className="relative h-8 w-8">
                  {info.number && (
                    <span className="pointer-events-none absolute left-0.5 top-0 z-10 text-[9px] font-bold leading-none text-slate-500 dark:text-slate-400">
                      {info.number}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputs.current[k] = el
                    }}
                    value={val}
                    onClick={() => onCellClick(r, c)}
                    onChange={(e) => onInput(r, c, e.target.value)}
                    onKeyDown={(e) => onKey(e, r, c)}
                    maxLength={1}
                    inputMode="text"
                    className={`h-8 w-8 rounded-[3px] border text-center text-sm font-bold uppercase caret-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      wrong
                        ? 'border-rose-400 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : right
                          ? 'border-emerald-400 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : focused
                            ? 'border-indigo-500 bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-white'
                            : highlighted
                              ? 'border-indigo-200 bg-indigo-50 text-slate-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-white'
                              : 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                    }`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Clues */}
        <div className="flex flex-1 flex-col gap-5 text-left text-sm">
          <ClueList title="Across →" entries={across} active={active} cells={cells} onPick={(e) => { setActive({ r: e.row, c: e.col, dir: 'across' }); focusCell(e.row, e.col) }} />
          <ClueList title="Down ↓" entries={down} active={active} cells={cells} onPick={(e) => { setActive({ r: e.row, c: e.col, dir: 'down' }); focusCell(e.row, e.col) }} />
        </div>
      </div>

      {solved && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          🎉 Кроссворд полностью решён!
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={check}
          className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Проверить
        </button>
        <button
          onClick={() => {
            if (confirm('Показать все ответы?')) reveal()
          }}
          className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Показать ответы
        </button>
      </div>
    </div>
  )
}

function ClueList({
  title,
  entries,
  active,
  cells,
  onPick,
}: {
  title: string
  entries: CrosswordEntry[]
  active: { r: number; c: number; dir: Dir } | null
  cells: Map<string, CellInfo>
  onPick: (e: CrosswordEntry) => void
}) {
  const activeEntry =
    active &&
    (active.dir === 'across'
      ? cells.get(cellKey(active.r, active.c))?.across
      : cells.get(cellKey(active.r, active.c))?.down)
  return (
    <div>
      <h3 className="mb-2 font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {entries.map((e) => {
          const isActive = activeEntry === e
          return (
            <li key={`${e.dir}-${e.number}`}>
              <button
                onClick={() => onPick(e)}
                className={`w-full rounded-md px-2 py-1 text-left transition ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <b className="mr-1">{e.number}.</b>
                {e.clue}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
