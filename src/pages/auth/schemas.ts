import { z } from 'zod'
import type { GoogleCompletarRegistroRequest, RegistroRequest } from '../../types'

/** Roles disponibles para el registro. Union de strings (no enum — erasableSyntaxOnly). */
const ROLES = ['TERAPEUTA', 'FAMILIAR'] as const

/**
 * Patrón de password del backend (UsarioRegistroDTO): min 8, debe contener
 * mayúscula, minúscula, dígito y carácter especial. Espejo del regex del Swagger.
 */
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

const PASSWORD_MSG =
  'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo'

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
