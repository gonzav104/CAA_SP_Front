/** Permiso de acceso del usuario actual sobre un paciente. Union, NO enum. */
export type Permiso = 'LECTURA' | 'EDICION_LIMITADA'

/**
 * PacienteResponseDTO. GET/POST /api/pacientes, GET/PUT /api/pacientes/{id}.
 * Validado contra Swagger real: NO trae creadorId/diagnostico/updatedAt; apellido
 * SIEMPRE presente; agrega miPermiso.
 */
export interface Paciente {
  id: string // UUID
  nombre: string
  apellido: string
  fechaNacimiento: string // ISO date
  creadoEn: string // ISO datetime
  /** Determina si el usuario actual puede editar este paciente. */
  miPermiso: Permiso
}

/**
 * PacienteRegistroDTO (POST /api/pacientes) y PacienteActualizacionDTO
 * (PUT /api/pacientes/{id}) — mismo contrato. apellido y fechaNacimiento son
 * REQUIRED (no opcionales como teníamos).
 */
export interface PacienteInput {
  nombre: string
  apellido: string
  fechaNacimiento: string // ISO date
}
