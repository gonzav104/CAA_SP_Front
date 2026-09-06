import type { ItemCartilla, ItemDetalle, Pictograma } from '../types'

/**
 * URL de imagen de un pictograma global (objeto completo del selector del editor).
 */
export function imagenUrlDePictograma(pictograma: Pictograma | undefined): string | undefined {
  return pictograma?.imagenUrl
}

/**
 * URL de la imagen de un item, según la forma del DTO:
 * - ItemDetalle (detalle anidado de cartilla): `pictograma` viene resuelto como
 *   objeto → `imagenUrl` directa.
 * - ItemCartilla (listado por categoría): solo trae `recursoGlobalId`/`recursoCustomId`
 *   (UUID). Resolver la URL requiere un endpoint de pictograma puntual.
 *   // TODO: endpoint pendiente — por ahora devuelve undefined (placeholder en ThumbPictograma).
 */
export function imagenUrlDeItem(item: ItemCartilla | ItemDetalle): string | undefined {
  if ('pictograma' in item && item.pictograma) {
    return item.pictograma.imagenUrl
  }
  return undefined
}

/** Texto que habla el TTS (textoHablado en ambas formas del DTO). */
export function textoHabladoDeItem(item: ItemCartilla | ItemDetalle): string {
  return item.textoHablado
}

/**
 * Copia ordenada estable por `orden` (categorías — el backend expone el campo
 * en el listado y en el detalle). Si ningún elemento trae `orden`, conserva el
 * orden original del arreglo (sort estable de ES2019+).
 */
export function ordenarPorOrden<T extends { orden?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
}

/**
 * Copia ordenada estable por `ordenVisual` (items del detalle anidado).
 * Mismo criterio que `ordenarPorOrden` pero con el campo del ItemDetalle.
 */
export function ordenarPorOrdenVisual<T extends { ordenVisual?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.ordenVisual ?? 0) - (b.ordenVisual ?? 0))
}