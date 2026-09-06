/**
 * SesionResponseDTO (GET /api/pacientes/{id}/sesiones) — SOLO rol TERAPEUTA.
 * Un FAMILIAR nunca ve esta entidad (ni link, ni tab, ni ruta).
 * Validado contra Swagger real: `fechaHora` (NO `fecha`), sin duracionMinutos,
 * con disposicion/observaciones/estrategiasYProximosPasos.
 */
export interface Sesion {
  id: string // UUID
  fechaHora: string // ISO datetime
  disposicion: string
  objetivosTrabajados: string
  observaciones: string
  estrategiasYProximosPasos: string
  creadoEn: string // ISO datetime
  pacienteId: string // UUID
}

/**
 * SesionRegistroDTO (POST /api/pacientes/{id}/sesiones).
 * `fechaHora` y `objetivosTrabajados` REQUIRED; el resto opcional.
 */
export interface SesionInput {
  fechaHora: string // ISO datetime
  disposicion?: string
  objetivosTrabajados: string
  observaciones?: string
  estrategiasYProximosPasos?: string
}
