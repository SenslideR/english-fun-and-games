// Thin wrapper around the Web Speech API (SpeechSynthesis) for pronouncing
// English words and phrases. No external dependencies.

let cachedVoice: SpeechSynthesisVoice | null = null

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Pick the best available English voice, preferring British English. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const byLang = (prefix: string) =>
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix))
  cachedVoice =
    byLang('en-gb') || byLang('en-us') || byLang('en') || voices[0]
  return cachedVoice
}

// Voices may load asynchronously; refresh the cache when they arrive.
if (speechSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    pickVoice()
  }
}

/** Speak the given English text. Cancels anything currently playing. */
export function speak(text: string, lang = 'en-GB') {
  if (!speechSupported() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = pickVoice()
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang || lang
  utterance.rate = 0.9
  utterance.pitch = 1
  synth.speak(utterance)
}
