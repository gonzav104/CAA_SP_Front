import type { Sesion, SesionInput } from '../types'
import { api } from './api'

/**
 * Endpoints del dominio sesiones (D3): CRUD de sesiones de un paciente.
 * SOLO rol TERAPEUTA. Todos los IDs son UUID (string).
 */

/** GET /api/pacientes/{id}/sesiones — lista de sesiones del paciente. */
export async function listarSesiones(pacienteId: string): Promise<Sesion[]> {
  const { data } = await api.get<Sesion[]>(`/api/pacientes/${pacienteId}/sesiones`)
  return data
}

/** POST /api/pacientes/{id}/sesiones — crea una sesión y devuelve la entidad. */
export async function crearSesion(pacienteId: string, input: SesionInput): Promise<Sesion> {
  const { data } = await api.post<Sesion>(`/api/pacientes/${pacienteId}/sesiones`, input)
  return data
}

/** GET /api/pacientes/{id}/sesiones/{sesionId} — sesión puntual. */
export async function obtenerSesion(pacienteId: string, sesionId: string): Promise<Sesion> {
  const { data } = await api.get<Sesion>(`/api/pacientes/${pacienteId}/sesiones/${sesionId}`)
  return data
}

/** PUT /api/pacientes/{id}/sesiones/{sesionId} — actualiza la sesión. */
export async function actualizarSesion(
  pacienteId: string,
  sesionId: string,
  input: SesionInput,
): Promise<Sesion> {
  const { data } = await api.put<Sesion>(
    `/api/pacientes/${pacienteId}/sesiones/${sesionId}`,
    input,
  )
  return data
}

/** DELETE /api/pacientes/{id}/sesiones/{sesionId} — elimina la sesión. */
export async function eliminarSesion(pacienteId: string, sesionId: string): Promise<void> {
  await api.delete(`/api/pacientes/${pacienteId}/sesiones/${sesionId}`)
}
