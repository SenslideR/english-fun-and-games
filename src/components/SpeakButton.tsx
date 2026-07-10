import { speak, speechSupported } from '../lib/speech'

interface Props {
  text: string
  /** Visual size of the button. */
  size?: 'sm' | 'md'
  className?: string
}

/** A speaker icon button that pronounces the given English text. */
export function SpeakButton({ text, size = 'md', className = '' }: Props) {
  if (!speechSupported()) return null
  const dim = size === 'sm' ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-lg'
  return (
    <button
      type="button"
      title="Произнести"
      aria-label={`Произнести: ${text}`}
      onClick={(e) => {
        e.stopPropagation()
        speak(text)
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-indigo-500 transition hover:bg-indigo-100 hover:text-indigo-700 active:scale-90 dark:text-indigo-400 dark:hover:bg-indigo-900 ${dim} ${className}`}
    >
      🔊
    </button>
  )
}
