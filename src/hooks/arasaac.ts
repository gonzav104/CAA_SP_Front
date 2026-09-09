import { useQuery } from '@tanstack/react-query'
import { buscarEnArasaac } from '../services/arasaac'
import { arasaacKeys } from './queryKeys'

/**
 * Búsqueda en el catálogo ARASAAC (AD-3). El llamador aplica el debounce
 * (useDebouncedValue 250ms) ANTES de pasar el término, así no hay refetch por
 * keystroke; acá solo se filtra por cantidad de caracteres.
 * - enabled: recién con 2+ caracteres (trim) — con menos no se consulta.
 * - staleTime 5min + retry 1: la API externa es lenta/costosa; la degradación
 *   natural (tab ARASAAC caído → seguir usando los 24 globales) es de Fase 2.
 */
export function useBuscarArasaac(termino: string) {
  const terminoLimpio = termino.trim()
  return useQuery({
    queryKey: arasaacKeys.search(terminoLimpio),
    queryFn: () => buscarEnArasaac(terminoLimpio),
    enabled: terminoLimpio.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}