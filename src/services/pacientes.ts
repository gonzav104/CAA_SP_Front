import type { Paciente, PacienteInput } from '../types'
import { api } from './api'

/**
 * Endpoints del dominio pacientes (D3): funciones tipadas sobre el cliente axios.
 * Todos los IDs son UUID (string). Las respuestas son arreglos planos (el
 * backend no devuelve Page<T>).
 */

/** GET /api/pacientes — lista de pacientes. */
export async function listarPacientes(): Promise<Paciente[]> {
  const { data } = await api.get<Paciente[]>('/api/pacientes')
  return data
}

/** POST /api/pacientes — crea un paciente y devuelve la entidad persistida. */
export async function crearPaciente(input: PacienteInput): Promise<Paciente> {
  const { data } = await api.post<Paciente>('/api/pacientes', input)
  return data
}

/** GET /api/pacientes/{id} — detalle de un paciente. */
export async function obtenerPaciente(id: string): Promise<Paciente> {
  const { data } = await api.get<Paciente>(`/api/pacientes/${id}`)
  return data
}

/** PUT /api/pacientes/{id} — actualiza los campos editables del paciente. */
export async function actualizarPaciente(id: string, input: PacienteInput): Promise<Paciente> {
  const { data } = await api.put<Paciente>(`/api/pacientes/${id}`, input)
  return data
}

/** DELETE /api/pacientes/{id} — elimina el paciente y sus datos asociados. */
export async function eliminarPaciente(id: string): Promise<void> {
  await api.delete(`/api/pacientes/${id}`)
}
