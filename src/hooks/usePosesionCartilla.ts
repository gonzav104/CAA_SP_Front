import { ApiError } from '../services/api'
import { esCreadorDe } from '../lib/cartilla'
import { formatError } from '../lib/utils'
import type { CartillaDetalle } from '../types'
import { useCartilla } from './cartillas'
import { useAuth } from './useAuth'

/**
 * Posesión de una cartilla, derivada del detalle YA cargado por `useCartilla`
 * (change cartillas-revival, Fase E1, obs #85 Decisión 5).
 *
 * `no-encontrada` (404) vs `error` (cualquier otra falla) son estados
 * honestamente distintos: el backend nunca responde 403 para una cartilla
 * ajena (obs #81, 14 tests de integración, cero `isForbidden`) — un 404 no
 * distingue "no existe" de "existe pero no es tuya", así que NO se puede
 * afirmar "ajena" sin un 200 con `creadorId` en la mano.
 */
export type AccesoCartilla =
  | { estado: 'cargando' }
  | { estado: 'no-encontrada' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'propia'; cartilla: CartillaDetalle }
  | { estado: 'ajena'; cartilla: CartillaDetalle }

/**
 * Deriva `AccesoCartilla` sobre `useCartilla(pacienteId, cartillaId)`
 * (`src/hooks/cartillas.ts:35-46`) + `useAuth()`. TanStack Query deduplica
 * por la misma `cartillaKeys.detail(...)` key que ya usan `CartillaView` y
 * `EditorCartilla` — esto NUNCA dispara un segundo fetch.
 */
export function usePosesionCartilla(
  pacienteId: string | undefined,
  cartillaId: string | undefined,
): AccesoCartilla {
  const { usuario } = useAuth()
  const query = useCartilla(pacienteId, cartillaId)

  if (query.isPending) {
    return { estado: 'cargando' }
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return { estado: 'no-encontrada' }
    }
    return { estado: 'error', mensaje: formatError(query.error) }
  }

  const cartilla = query.data
  if (!cartilla) {
    return { estado: 'no-encontrada' }
  }

  return esCreadorDe(usuario, cartilla)
    ? { estado: 'propia', cartilla }
    : { estado: 'ajena', cartilla }
}
