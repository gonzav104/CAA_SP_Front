import { z } from 'zod'
import type { Sesion, SesionInput } from '../../types'

/**
 * Schema del formulario de sesión (RI-7): RHF + zodResolver.
 * fechaHora y objetivosTrabajados REQUIRED; el resto opcional.
 */
export const sesionSchema = z.object({
  fechaHora: z.string().min(1, 'La fecha y hora son obligatorias'),
  disposicion: z.string().optional(),
  objetivosTrabajados: z.string().min(1, 'Los objetivos trabajados son obligatorios'),
  observaciones: z.string().optional(),
  estrategiasYProximosPasos: z.string().optional(),
})

export type SesionValues = z.infer<typeof sesionSchema>

/** Valores del form → DTO del backend (POST/PUT .../sesiones). */
export function toSesionInput(values: SesionValues): SesionInput {
  return {
    fechaHora: values.fechaHora,
    objetivosTrabajados: values.objetivosTrabajados.trim(),
    ...(values.disposicion ? { disposicion: values.disposicion.trim() } : {}),
    ...(values.observaciones ? { observaciones: values.observaciones.trim() } : {}),
    ...(values.estrategiasYProximosPasos
      ? { estrategiasYProximosPasos: values.estrategiasYProximosPasos.trim() }
      : {}),
  }
}

/** Sesión persistida → valores del form. */
export function toSesionValues(sesion: Sesion): SesionValues {
  return {
    fechaHora: localDatetimeValue(sesion.fechaHora),
    disposicion: sesion.disposicion || '',
    objetivosTrabajados: sesion.objetivosTrabajados,
    observaciones: sesion.observaciones || '',
    estrategiasYProximosPasos: sesion.estrategiasYProximosPasos || '',
  }
}

/**
 * Convierte un ISO datetime (ej: 2026-09-06T14:30:00) al valor que espera un
 * <input type="datetime-local"> (UTC → local, sin Z). Si ya viene sin Z, lo
 * usa tal cual. Si no puede parsearse, devuelve ''.
 */
function localDatetimeValue(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) && !iso.endsWith('Z')) {
    return iso.slice(0, 16)
  }
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
