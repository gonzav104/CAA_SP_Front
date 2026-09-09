/**
 * Mapeo de resultados de la API pública de ARASAAC (AD-5).
 * Funciones PURAS y unit-testables: sin imports de runtime, cero `any`.
 *
 * Formato REAL del response (verificado 2026-09-08 con curl "agua"):
 * [{ _id: number, keywords: [{ keyword, type: number 1-5, meaning?, plural?,
 *    hasLocution? }], schematic: boolean, score, tags, categories, ... }]
 * - NO hay campo `language` en la respuesta.
 * - `type` de keywords es NUMÉRICO (1..5), no string.
 * - El array `keywords` ya viene ordenado por relevancia del API.
 */

/**
 * Resultado crudo de GET /pictograms/es/search/{kw}.
 * Solo se modelan los campos que consume el mapeo; el resto del payload
 * (tags, categories, created, lastUpdated...) se ignora por contrato frágil.
 */
export interface ResultadoArasaacRaw {
  _id: number
  keywords: Array<{
    keyword: string
    type: number
    meaning?: string
    plural?: string
    hasLocution?: boolean
  }>
  schematic: boolean
  score?: number
}

/** Resultado mapeado para el grid del selector (Fase 2). */
export interface ResultadoArasaac {
  arasaacId: number
  etiqueta: string
  imagenUrl: string
  schematic: boolean
}

/** URL de la imagen 300px del pictograma en el CDN estático de ARASAAC. */
export function imagenUrlArasaac(arasaacId: number): string {
  return `https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_300.png`
}

/**
 * Mapea un ítem crudo del response ARASAAC a ResultadoArasaac.
 * Etiqueta con fallbacks en orden:
 *   1. primer keyword del array (el API ordena por relevancia)
 *   2. cualquier keyword no vacío del array
 *   3. `Pictograma {_id}` (sin keywords utilizables)
 * Si `_id` no es un número entero positivo → null (se filtra del grid).
 */
export function mapearResultadoArasaac(raw: ResultadoArasaacRaw): ResultadoArasaac | null {
  if (typeof raw._id !== 'number' || !Number.isInteger(raw._id) || raw._id <= 0) {
    return null
  }
  const keywords = Array.isArray(raw.keywords) ? raw.keywords : []

  const primera = keywords[0]?.keyword
  let etiqueta = ''
  if (typeof primera === 'string' && primera.trim() !== '') {
    etiqueta = primera
  } else {
    for (const keyword of keywords) {
      if (typeof keyword.keyword === 'string' && keyword.keyword.trim() !== '') {
        etiqueta = keyword.keyword
        break
      }
    }
  }
  if (etiqueta === '') {
    etiqueta = `Pictograma ${raw._id}`
  }

  return {
    arasaacId: raw._id,
    etiqueta,
    imagenUrl: imagenUrlArasaac(raw._id),
    schematic: raw.schematic === true,
  }
}