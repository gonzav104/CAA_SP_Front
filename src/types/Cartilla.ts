import type { CategoriaDetalle } from './Categoria'

/**
 * Paradigma de organización del tablero de ModoUso. Union, NO enum — mismo
 * criterio que `Permiso` (types/Paciente.ts). Mirrorea el campo `paradigma`
 * de `CartillaDetalleResponseDTO`/`CartillaRegistroDTO`/`CartillaActualizacionDTO`
 * (backend caa_sp, commit 1c52cb6): valores literales en minúscula,
 * byte-a-byte iguales a estos dos strings. Un valor no soportado (incluido
 * `'escena-visual'`) es rechazado por el backend con HTTP 400 — nunca llega
 * a persistirse. `'escena-visual'` (Visual Scene Display) NO es parte de
 * este tipo porque el backend no lo modela; el tipo ampliado que Zona B
 * consume (con `'escena-visual'` declarado pero jamás devuelto) vive en
 * `src/pages/modo-uso/organizacion.ts`.
 */
export type ParadigmaTablero = 'taxonomica' | 'esquematica'

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
  /** Default server-side en creación: 'taxonomica' (sdd/modo-uso-zona-b PR4b). */
  paradigma: ParadigmaTablero
  categorias: CategoriaDetalle[]
}

/**
 * CartillaRegistroDTO (POST) y CartillaActualizacionDTO (PUT).
 * `esPrincipal` es opcional en ambos. `paradigma` también es opcional en
 * ambos: al crear, omitirlo default a 'taxonomica' server-side; al
 * actualizar, omitirlo preserva el valor existente (semántica de update
 * parcial, sdd/modo-uso-zona-b PR4b).
 */
export interface CartillaInput {
  nombre: string
  esPrincipal?: boolean
  paradigma?: ParadigmaTablero
}
