import type { CategoriaDetalle } from './Categoria'

/**
 * CartillaResponseDTO (GET list /api/pacientes/{id}/cartillas).
 * Validado contra Swagger real: NO trae descripcion/updatedAt/categorias;
 * agrega esPrincipal.
 */
export interface Cartilla {
  id: string // UUID
  pacienteId: string // UUID
  creadorId: string // UUID
  nombre: string
  esPrincipal: boolean
  creadoEn: string // ISO datetime
}

/**
 * CartillaDetalleResponseDTO (GET de una cartilla puntual).
 * DTO separado: trae las categorías anidadas (NO pacienteId/creadoEn/descripcion).
 * creadorId existe acá → gate del EditorCartilla.
 */
export interface CartillaDetalle {
  id: string // UUID
  creadorId: string // UUID
  nombre: string
  esPrincipal: boolean
  categorias: CategoriaDetalle[]
}

/**
 * CartillaRegistroDTO (POST) y CartillaActualizacionDTO (PUT).
 * `esPrincipal` es opcional en ambos.
 */
export interface CartillaInput {
  nombre: string
  esPrincipal?: boolean
}
