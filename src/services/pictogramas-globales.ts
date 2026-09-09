import type {
  MaterializarPictogramaGlobalRequest,
  MaterializarPictogramaGlobalResponse,
} from '../types'
import { api } from './api'

/**
 * Materialización de un pictograma ARASAAC como pictograma global (AD-4,
 * endpoint NUEVO del backend CAA_SP — Fase 2 del change).
 * Usa `api` (CON withCredentials): va a NUESTRO backend, autenticado por
 * cookie jwt httpOnly. `GET /api/pictogramas-globales` sigue en services/cartillas.ts.
 *
 * Contrato: POST /api/pictogramas-globales/materializar {arasaacId, etiqueta}
 * → 201 recién materializado; 200 = dedupe hit (mismo UUID, idempotente).
 */
export async function materializarPictogramaGlobal(
  input: MaterializarPictogramaGlobalRequest,
): Promise<MaterializarPictogramaGlobalResponse> {
  const { data } = await api.post<MaterializarPictogramaGlobalResponse>(
    '/api/pictogramas-globales/materializar',
    input,
  )
  return data
}