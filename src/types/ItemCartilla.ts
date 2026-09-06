import type { PictogramaInfo } from './Pictograma'

/**
 * ItemCartillaResponseDTO (GET list por categoría:
 * /api/pacientes/{id}/cartillas/{id}/categorias/{id}/items).
 * Validado contra Swagger real: `textoHablado` (NO `etiqueta`), `ordenVisual`
 * (NO `orden`), `recursoGlobalId`/`recursoCustomId` (NO `pictograma`).
 */
export interface ItemCartilla {
  id: string // UUID
  categoriaId: string // UUID
  textoHablado: string
  ordenVisual: number // int32
  recursoGlobalId: string | null // UUID — pictograma global asociado, si hay
  recursoCustomId: string | null // UUID — pictograma custom asociado, si hay
  creadoEn: string // ISO datetime
}

/**
 * ItemDetalleResponseDTO (dentro de CategoriaDetalleResponseDTO).
 * Trae el pictograma resuelto como objeto anidado.
 */
export interface ItemDetalle {
  id: string // UUID
  textoHablado: string
  ordenVisual: number // int32
  pictograma: PictogramaInfo
}

/**
 * ItemCartillaRegistroDTO (POST) y ItemCartillaActualizacionDTO (PUT).
 * `textoHablado` REQUIRED; el resto opcional. El item se vincula a un pictograma
 * global (recursoGlobalId) o custom (recursoCustomId).
 */
export interface ItemCartillaInput {
  textoHablado: string
  ordenVisual?: number // int32
  recursoGlobalId?: string // UUID
  recursoCustomId?: string // UUID
}
