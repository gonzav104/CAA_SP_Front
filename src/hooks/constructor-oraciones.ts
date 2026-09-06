import { useCallback, useState } from 'react'

/**
 * Estado del constructor de oraciones (RI-12/RI-13/RI-14).
 * Encapsula la semántica CAA: tocar un pictograma AGREGA una palabra al tablero
 * (NO habla al toque); «Decir» concatena la frase completa.
 */

interface UseConstructorOracionesReturn {
  /** Palabras acumuladas en la barra (orden de toque). */
  frase: string[]
  /** Agrega una palabra al final de la frase (tocar pictograma). */
  agregarPalabra: (texto: string) => void
  /** Quita la última palabra de la frase. */
  borrarUltima: () => void
  /** Vacía la frase completa. */
  limpiar: () => void
  /** Quita la palabra en un índice puntual (X individual del chip). */
  removerIndice: (indice: number) => void
  /** Cantidad de palabras (para conditionales de la UI). */
  cantidadPalabras: number
}

export function useConstructorOraciones(): UseConstructorOracionesReturn {
  const [frase, setFrase] = useState<string[]>([])

  const agregarPalabra = useCallback((texto: string) => {
    setFrase((actual) => [...actual, texto])
  }, [])

  const borrarUltima = useCallback(() => {
    setFrase((actual) => actual.slice(0, -1))
  }, [])

  const limpiar = useCallback(() => {
    setFrase([])
  }, [])

  const removerIndice = useCallback((indice: number) => {
    setFrase((actual) => actual.filter((_, i) => i !== indice))
  }, [])

  return {
    frase,
    agregarPalabra,
    borrarUltima,
    limpiar,
    removerIndice,
    cantidadPalabras: frase.length,
  }
}
