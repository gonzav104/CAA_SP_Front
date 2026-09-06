import { z } from 'zod'
import type { Paciente, PacienteInput } from '../../types'

/**
 * Formulario de paciente (crear y editar): POST/PUT /api/pacientes.
 * Contra el Swagger real: apellido y fechaNacimiento son REQUIRED; no existe
 * campo diagnostico.
 */
export const pacienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
})

export type PacienteValues = z.infer<typeof pacienteSchema>

/** Valores del form (validados) → DTO del backend. */
export function toPacienteInput(values: PacienteValues): PacienteInput {
  return {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    fechaNacimiento: values.fechaNacimiento,
  }
}

/** Paciente persistido → valores del form (para la edición). */
export function toPacienteValues(paciente: Paciente): PacienteValues {
  return {
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    fechaNacimiento: paciente.fechaNacimiento,
  }
}