import type { Permiso } from './Paciente'

/**
 * ColaboradorResponseDTO (GET /api/pacientes/{id}/colaboradores).
 * Validado contra Swagger real: campos PLANOS (NO objeto usuario anidado),
 * `permiso` (NO `rolAcceso`), NO trae id.
 */
export interface Colaborador {
  usuarioId: string // UUID
  nombre: string
  email: string
  permiso: Permiso
  vinculadoEn: string // ISO datetime
}

/**
 * ColaboradorRegistroDTO (POST /api/pacientes/{id}/colaboradores) —
 * email y permiso REQUIRED.
 * ColaboradorActualizacionDTO (PUT) — solo permiso REQUIRED (mismo shape,
 * email no se exige al actualizar; se deja como campo aceptado por exactitud).
 */
export interface ColaboradorInput {
  email: string
  permiso: Permiso
}
