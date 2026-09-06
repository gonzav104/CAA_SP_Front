import type { Colaborador, ColaboradorInput } from '../types'
import { api } from './api'

/**
 * Endpoints del dominio colaboradores (D3): CRUD de colaboradores de un paciente.
 * SOLO rol TERAPEUTA. Todos los IDs son UUID (string).
 */

/** GET /api/pacientes/{id}/colaboradores — lista de colaboradores del paciente. */
export async function listarColaboradores(pacienteId: string): Promise<Colaborador[]> {
  const { data } = await api.get<Colaborador[]>(`/api/pacientes/${pacienteId}/colaboradores`)
  return data
}

/** POST /api/pacientes/{id}/colaboradores — agrega un colaborador. */
export async function agregarColaborador(
  pacienteId: string,
  input: ColaboradorInput,
): Promise<Colaborador> {
  const { data } = await api.post<Colaborador>(
    `/api/pacientes/${pacienteId}/colaboradores`,
    input,
  )
  return data
}

/** DELETE /api/pacientes/{id}/colaboradores/{usuarioId} — elimina un colaborador. */
export async function eliminarColaborador(
  pacienteId: string,
  usuarioId: string,
): Promise<void> {
  await api.delete(`/api/pacientes/${pacienteId}/colaboradores/${usuarioId}`)
}
