/**
 * Decisión de confirmación del selector de pictogramas (ux-cartilla-pictogramos).
 * Función PURA y unit-testable (D3): aísla la decisión materializar-vs-aplicar
 * del componente — SeleccionPictograma solo ejecuta el resultado.
 *
 * Ciclo de imports: este módulo importa `PictogramaElegido` (TYPE-ONLY) desde
 * SeleccionPictograma.tsx y la página importa `decidirConfirmacion` (runtime)
 * desde acá → el import type se borra en compilación, no hay ciclo de runtime.
 */
import type { ResultadoArasaac } from './arasaac'
import type { Pictograma } from '../types'
import type { PictogramaElegido } from '../pages/cartillas/SeleccionPictograma'

/**
 * Selección PENDIENTE (confirm-first): lo que el usuario marcó en un tile,
 * aún sin aplicar. El dialog NO se cierra hasta «Confirmar».
 */
export type SeleccionPendiente =
  | { tipo: 'global'; globalId: string }
  | { tipo: 'custom'; customId: string }
  | { tipo: 'arasaac'; resultado: ResultadoArasaac }

/** Decisión de confirmación: aplicar una elección o materializar un ARASAAC nuevo. */
export type DesicionConfirmacion =
  | { tipo: 'aplicar'; elegido: PictogramaElegido }
  | { tipo: 'materializar'; arasaacId: number; etiqueta: string }

/**
 * Decide qué hacer al confirmar una selección pendiente:
 * - global/custom → aplicar directo (el id marcado en el tile).
 * - arasaac → si su `arasaacId` YA está materializado entre los globales,
 *   aplicar el MISMO UUID (match por arasaacId, idempotencia del backend);
 *   si no → materializar (POST) y aplicar el UUID resultante.
 */
export function decidirConfirmacion(
  pendiente: SeleccionPendiente,
  globales: Pictograma[],
): DesicionConfirmacion {
  switch (pendiente.tipo) {
    case 'global':
      return { tipo: 'aplicar', elegido: { globalId: pendiente.globalId } }
    case 'custom':
      return { tipo: 'aplicar', elegido: { customId: pendiente.customId } }
    case 'arasaac': {
      const existente = globales.find(
        (pictograma) => pictograma.arasaacId === pendiente.resultado.arasaacId,
      )
      if (existente) {
        return { tipo: 'aplicar', elegido: { globalId: existente.id } }
      }
      return {
        tipo: 'materializar',
        arasaacId: pendiente.resultado.arasaacId,
        etiqueta: pendiente.resultado.etiqueta,
      }
    }
  }
}