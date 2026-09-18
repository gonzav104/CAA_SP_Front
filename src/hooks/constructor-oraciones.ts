import { useCallback, useState } from 'react'

/**
 * Estado del constructor de oraciones (RI-12/RI-13/RI-14).
 * Encapsula la semántica CAA: tocar un pictograma AGREGA una palabra al tablero
 * (NO habla al toque); «Decir» concatena la frase completa.
 *
 * Persistencia (sdd/modo-uso-zona-b, D3): `sessionStorage`, clave
 * `caa:frase:{pacienteId}:{cartillaId}`, envoltura versionada
 * `{ v, frase, borrada }`, escrita sincrónicamente en cada mutación e
 * hidratada de forma perezosa (lazy `useState` initializer) para que la
 * hidratación ocurra antes del primer render. Sobrevive reload, navegación
 * atrás/adelante y descarte/restauración de pestaña por el SO; NO sobrevive
 * un reinicio completo del navegador — alcance aceptado explícitamente.
 *
 * Esta decisión no cita investigación específica de CAA porque no existe
 * (research obs #112/#114, brecha confirmada dos veces); se justifica
 * únicamente en W3C COGA §4.5.2 "Let Users Go Back" / §4.5.4 "Design Forms
 * to Prevent Mistakes" (fuente S5). `localStorage` fue rechazado a propósito:
 * resucitaría una frase vieja días después en un dispositivo clínico
 * compartido, precargando el tablero del chico con palabras que no son
 * suyas.
 *
 * Toda falla de storage (no disponible, cuota excedida, valor corrupto,
 * clave equivocada) degrada en silencio al comportamiento in-memory de
 * siempre — la capacidad del chico de hablar nunca depende de que el
 * storage funcione.
 */

const VERSION_ENVOLTORIO = 1

interface EnvolturaFrase {
  v: typeof VERSION_ENVOLTORIO
  frase: string[]
  /** Frase recién "limpiada", recuperable con `deshacer()` hasta el próximo `agregarPalabra`. */
  borrada: string[] | null
}

const ENVOLTURA_VACIA: EnvolturaFrase = { v: VERSION_ENVOLTORIO, frase: [], borrada: null }

function claveStorage(pacienteId: string, cartillaId: string): string {
  return `caa:frase:${pacienteId}:${cartillaId}`
}

function esArregloDeStrings(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((elemento) => typeof elemento === 'string')
}

function esEnvolturaValida(valor: unknown): valor is EnvolturaFrase {
  if (typeof valor !== 'object' || valor === null) return false
  const candidato = valor as Record<string, unknown>
  if (candidato.v !== VERSION_ENVOLTORIO) return false
  if (!esArregloDeStrings(candidato.frase)) return false
  if (candidato.borrada !== null && !esArregloDeStrings(candidato.borrada)) return false
  return true
}

/**
 * Lee y valida la envoltura persistida. Cualquier falla (storage no
 * disponible, JSON corrupto, forma equivocada) degrada a `null`, nunca
 * lanza.
 */
function leerEnvoltura(clave: string): EnvolturaFrase | null {
  try {
    const crudo = window.sessionStorage.getItem(clave)
    if (crudo === null) return null
    const parseado: unknown = JSON.parse(crudo)
    return esEnvolturaValida(parseado) ? parseado : null
  } catch {
    return null
  }
}

/** Escribe la envoltura. Cuota excedida o storage no disponible se ignoran en silencio. */
function escribirEnvoltura(clave: string, envoltura: EnvolturaFrase): void {
  try {
    window.sessionStorage.setItem(clave, JSON.stringify(envoltura))
  } catch {
    // La composición sigue en memoria; solo se pierde la persistencia entre
    // reloads para esta mutación.
  }
}

interface UseConstructorOracionesReturn {
  /** Palabras acumuladas en la barra (orden de toque). */
  frase: string[]
  /** Frase recién limpiada, disponible para `deshacer()`, o `null` si no hay nada que restaurar. */
  borrada: string[] | null
  /** Agrega una palabra al final de la frase (tocar pictograma). */
  agregarPalabra: (texto: string) => void
  /** Quita la última palabra de la frase. */
  borrarUltima: () => void
  /** Vacía la frase completa, guardándola en `borrada` para poder deshacerlo. */
  limpiar: () => void
  /** Quita la palabra en un índice puntual (X individual del chip). */
  removerIndice: (indice: number) => void
  /** Restaura la última frase limpiada. No-op si no hay nada que deshacer. */
  deshacer: () => void
  /** Cantidad de palabras (para condicionales de la UI). */
  cantidadPalabras: number
}

export function useConstructorOraciones(
  pacienteId: string,
  cartillaId: string,
): UseConstructorOracionesReturn {
  const clave = claveStorage(pacienteId, cartillaId)

  const [envoltura, setEnvoltura] = useState<EnvolturaFrase>(
    () => leerEnvoltura(clave) ?? ENVOLTURA_VACIA,
  )

  const actualizar = useCallback(
    (calcular: (actual: EnvolturaFrase) => EnvolturaFrase) => {
      setEnvoltura((actual) => {
        const siguiente = calcular(actual)
        escribirEnvoltura(clave, siguiente)
        return siguiente
      })
    },
    [clave],
  )

  const agregarPalabra = useCallback(
    (texto: string) => {
      actualizar((actual) => ({ v: VERSION_ENVOLTORIO, frase: [...actual.frase, texto], borrada: null }))
    },
    [actualizar],
  )

  const borrarUltima = useCallback(() => {
    actualizar((actual) => ({ ...actual, frase: actual.frase.slice(0, -1) }))
  }, [actualizar])

  const limpiar = useCallback(() => {
    actualizar((actual) =>
      actual.frase.length === 0 ? actual : { v: VERSION_ENVOLTORIO, frase: [], borrada: actual.frase },
    )
  }, [actualizar])

  const removerIndice = useCallback(
    (indice: number) => {
      actualizar((actual) => ({ ...actual, frase: actual.frase.filter((_, i) => i !== indice) }))
    },
    [actualizar],
  )

  const deshacer = useCallback(() => {
    actualizar((actual) =>
      actual.borrada === null ? actual : { v: VERSION_ENVOLTORIO, frase: actual.borrada, borrada: null },
    )
  }, [actualizar])

  return {
    frase: envoltura.frase,
    borrada: envoltura.borrada,
    agregarPalabra,
    borrarUltima,
    limpiar,
    removerIndice,
    deshacer,
    cantidadPalabras: envoltura.frase.length,
  }
}
