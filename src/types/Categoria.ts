import type { ItemDetalle } from './ItemCartilla'

/**
 * CategoriaResponseDTO (GET list /api/pacientes/{id}/cartillas/{id}/categorias).
 * Validado contra Swagger real: NO trae items en el listado; solo en el detalle.
 * colorHex sigue la convención Fitzgerald.
 */
export interface Categoria {
  id: string // UUID
  cartillaId: string // UUID
  nombre: string
  /** Formato #rrggbb (convención Fitzgerald). Zona B lo usa como fondo; Zona A solo como dot. */
  colorHex: string
  orden: number // int32
  creadoEn: string // ISO datetime
}

/**
 * CategoriaDetalleResponseDTO (dentro de CartillaDetalleResponseDTO).
 * Trae los items anidados de la categoría.
 */
export interface CategoriaDetalle {
  id: string // UUID
  nombre: string
  colorHex: string
  orden: number // int32
  items: ItemDetalle[]
}

/**
 * CategoriaRegistroDTO (POST) — colorHex REQUIRED con pattern ^#[0-9A-Fa-f]{6}$.
 * CategoriaActualizacionDTO (PUT) — colorHex REQUIRED, misma forma.
 */
export interface CategoriaInput {
  nombre: string
  colorHex: string // #rrggbb
  orden?: number // int32
}
