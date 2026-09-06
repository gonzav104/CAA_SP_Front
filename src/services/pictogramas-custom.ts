import type { PictogramaCustom } from '../types'
import { api } from './api'

/**
 * Endpoints del dominio pictogramas custom (D3): listado, subida (multipart) y
 * eliminación. Un pictograma custom pertenece a un paciente puntual.
 * POST/PUT son FormData (multipart): etiqueta + archivo (ImageFile).
 * Axios detecta automáticamente el Content-Type multipart/form-data.
 */

/** GET /api/pacientes/{id}/pictogramas-custom — lista de pictogramas custom del paciente. */
export async function listarCustom(pacienteId: string): Promise<PictogramaCustom[]> {
  const { data } = await api.get<PictogramaCustom[]>(
    `/api/pacientes/${pacienteId}/pictogramas-custom`,
  )
  return data
}

/** POST /api/pacientes/{id}/pictogramas-custom — sube un pictograma custom (multipart). */
export async function subirCustom(
  pacienteId: string,
  etiqueta: string,
  archivo: File,
): Promise<PictogramaCustom> {
  const formData = new FormData()
  formData.append('etiqueta', etiqueta)
  formData.append('archivo', archivo)
  const { data } = await api.post<PictogramaCustom>(
    `/api/pacientes/${pacienteId}/pictogramas-custom`,
    formData,
  )
  return data
}

/** DELETE /api/pacientes/{id}/pictogramas-custom/{customId} — elimina un pictograma custom. */
export async function eliminarCustom(pacienteId: string, id: string): Promise<void> {
  await api.delete(`/api/pacientes/${pacienteId}/pictogramas-custom/${id}`)
}
