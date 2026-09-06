/**
 * Wrapper de Web Speech API (D9) para el modo de uso (Zona B).
 *
 * Centraliza:
 * - El guard de feature detection (`soportado`) para navegadores sin TTS.
 * - La cancelación previa a cada emisión (AGENTS.md: `speechSynthesis.cancel()`
 *   ANTES de cada toque nuevo — escenario KU-3: dos toques rápidos, el segundo
 *   corta al primero).
 * - La selección de voz en español con preferencia rioplatense: `es-AR` —si el
 *   sistema operativo la tiene instalada— luego latinoamérica (`es-419`,
 *   `es-MX`, `es-US`, `es-CO`, etc.) y recién al final `es-ES` como último
 *   recurso. La Web Speech API usa las voces del SO, así que la «argentinidad»
 *   depende de qué voces tenga instaladas la máquina; el front prioriza la más
 *   cercana y, si mañana se instala una es-AR, la toma automáticamente.
 *
 * No hace falta trackear onstart/onend del utterance: el estado «está hablando»
 * no se usa en la UI. El requisito mínimo (que no rompa si no hay voces) se
 * cumple dejando `utterance.voice` sin asignar: el navegador resuelve solo
 * con `lang = 'es-ES'`.
 */

let voces: SpeechSynthesisVoice[] = []
let vocesInicializadas = false

/** true si el navegador expone Web Speech API (guard de feature detection). */
export function soportado(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Corta cualquier emisión en curso. No-op seguro si no hay soporte. */
export function detener(): void {
  if (!soportado()) return
  window.speechSynthesis.cancel()
}

/**
 * Dispara la carga de voces una única vez: en algunos navegadores (Chrome)
 * `getVoices()` devuelve una lista vacía hasta que se dispara `voiceschanged`.
 */
function inicializarVoces(): void {
  if (!soportado() || vocesInicializadas) return
  vocesInicializadas = true
  voces = window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    voces = window.speechSynthesis.getVoices()
  })
}

/**
 * Preferencia de voces en español, de la más cercana al rioplatense a la más
 * lejana. `es-AR` primero; latinoamérica en el medio; `es-ES` al final.
 */
const PREFERENCIA_ES: ReadonlyArray<string> = [
  'es-AR',
  'es-419',
  'es-MX',
  'es-US',
  'es-CO',
  'es-CL',
  'es-PE',
  'es-VE',
  'es-ES',
]

function primeraVozEspanol(): SpeechSynthesisVoice | undefined {
  const espanolas = voces.filter((voz) => voz.lang.toLowerCase().startsWith('es'))
  if (espanolas.length === 0) return undefined

  for (const lang of PREFERENCIA_ES) {
    const candidata = espanolas.find((voz) => voz.lang.toLowerCase() === lang.toLowerCase())
    if (candidata) return candidata
  }
  // Si el SO tiene una variante es-* que no está en la lista (p. ej. es-GT),
  // usamos la primera en español que haya en lugar de es-ES.
  return espanolas[0]
}

/**
 * Habla `texto` en voz alta. Cancela cualquier emisión previa antes de hablar.
 * `rate` y `pitch` fijos en 1 (voz natural, sin efectos).
 */
export function hablar(texto: string): void {
  if (!soportado() || texto.trim() === '') return
  inicializarVoces()

  const synth = window.speechSynthesis
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(texto)
  const voz = primeraVozEspanol()
  if (voz) {
    utterance.voice = voz
    utterance.lang = voz.lang
  } else {
    utterance.lang = 'es-ES'
  }
  utterance.rate = 1
  utterance.pitch = 1
  synth.speak(utterance)
}