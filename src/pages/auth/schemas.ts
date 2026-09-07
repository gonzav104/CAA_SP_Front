import { z } from 'zod'
import type { GoogleCompletarRegistroRequest, RegistroRequest } from '../../types'

/** Roles disponibles para el registro. Union de strings (no enum — erasableSyntaxOnly). */
const ROLES = ['TERAPEUTA', 'FAMILIAR'] as const

/**
 * Piezas del patrón de password del backend (UsarioRegistroDTO) — espejo del
 * regex del Swagger. Se exportan por separado para que el checklist en vivo
 * del registro use EXACTAMENTE las mismas reglas que la validación de submit.
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_LOWER = /[a-z]/
export const PASSWORD_UPPER = /[A-Z]/
export const PASSWORD_DIGIT = /\d/
export const PASSWORD_SYMBOL = /[^A-Za-z0-9]/

/** Patrón completo del password: min 8, mayúscula, minúscula, dígito y símbolo. */
const PASSWORD_PATTERN = new RegExp(
  `^(?=.*${PASSWORD_LOWER.source})(?=.*${PASSWORD_UPPER.source})(?=.*${PASSWORD_DIGIT.source})(?=.*${PASSWORD_SYMBOL.source}).{${PASSWORD_MIN_LENGTH},}$`,
)

const PASSWORD_MSG = `Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con mayúscula, minúscula, número y símbolo`

/**
 * Formulario de login: POST /auth/login.
 * Nota: en zod v4 el email válido se valida con `z.email()` (top-level);
 * `z.string().email()` quedó deprecado.
 */
export const loginSchema = z.object({
  email: z.email('Ingresá un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type LoginValues = z.infer<typeof loginSchema>

/**
 * Formulario de registro: POST /api/usuarios/registro.
 * El rol es REQUERIDO en el backend (UsarioRegistroDTO) — el form garantiza el
 * default en `defaultValues`; no se usa `.optional()`.
 */
export const registroSchema = z
  .object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.email('Ingresá un email válido'),
    password: z.string().regex(PASSWORD_PATTERN, PASSWORD_MSG),
    confirmarPassword: z.string(),
    rol: z.enum(ROLES),
  })
  .refine((datos) => datos.password === datos.confirmarPassword, {
    // zod v4: el mensaje personalizado de un check se pasa con `error` (no `message`).
    error: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  })

export type RegistroValues = z.infer<typeof registroSchema>

/**
 * Mapea el form de registro al DTO del backend: el schema valida
 * `confirmarPassword`, pero RegistroRequest NO tiene ese campo — el payload
 * enviado no debe arrastrarlo.
 */
export function toRegistroRequest(values: RegistroValues): RegistroRequest {
  return {
    nombre: values.nombre,
    email: values.email,
    password: values.password,
    rol: values.rol,
  }
}

/**
 * Completar registro Google: POST /auth/google/completar-registro.
 * El backend ya conoce email/nombre de la cuenta de Google; el frontend solo
 * debe enviar el idToken y elegir el rol.
 */
export const completarRegistroSchema = z.object({
  rol: z.enum(ROLES),
})

export type CompletarRegistroValues = z.infer<typeof completarRegistroSchema>

/** Mapea el form de completar registro al DTO del backend (agrega el idToken). */
export function toCompletarRegistroRequest(
  idToken: string,
  values: CompletarRegistroValues,
): GoogleCompletarRegistroRequest {
  return {
    idToken,
    rol: values.rol,
  }
}
