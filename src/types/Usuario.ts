/** Rol de usuario en CAA_SP. Union type, NO enum (erasableSyntaxOnly). */
export type Rol = 'TERAPEUTA' | 'FAMILIAR'

/**
 * UsuarioResponseDTO. GET /api/usuarios/me, POST /api/usuarios/registro.
 * Validado contra Swagger real (v3/api-docs): NO trae fotoUrl ni telefono.
 */
export interface Usuario {
  id: string // UUID
  email: string
  nombre: string
  rol: Rol
  creadoEn: string // ISO datetime
}

/** LoginRequestDTO → POST /auth/login. */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * AuthResponseDTO — INFORMATIVO. El backend setea la cookie httpOnly `jwt`
 * automáticamente; este token NO se maneja a mano en el frontend. Solo se tipa
 * por completitud del contrato; el flujo real de auth ignora este payload.
 */
export interface AuthResponse {
  token: string
  tipo: string
}

/** UsuarioRegistroDTO → POST /api/usuarios/registro. Rol REQUERIDO. */
export interface RegistroRequest {
  email: string
  password: string
  nombre: string
  rol: Rol
}

/** GoogleLoginDTO → POST /auth/google. `idToken` (NO `credential`). */
export interface GoogleAuthRequest {
  idToken: string
}

/** GoogleCompletarRegistroDTO → POST /auth/google/completar-registro. */
export interface GoogleCompletarRegistroRequest {
  idToken: string
  rol: Rol
}

/**
 * GoogleAuthResponseDTO → el login con Google responde con `requiereRol`
 * (NO `requiereCompletarRegistro`). Si `requiereRol === true`, redirigir al
 * registro con los datos de Google prellenados.
 */
export interface GoogleAuthResponse {
  requiereRol: boolean
  tipo: string
  email: string
  nombre: string
}
