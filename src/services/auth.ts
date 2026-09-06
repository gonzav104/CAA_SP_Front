import type {
  AuthResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
  GoogleCompletarRegistroRequest,
  LoginRequest,
  RegistroRequest,
  Usuario,
} from '../types'
import { api } from './api'

/**
 * POST /auth/login — deja la cookie httpOnly jwt en el navegador.
 * El body de respuesta (AuthResponseDTO { token, tipo }) es INFORMATIVO:
 * la cookie la setea el backend sola; acá se descarta.
 */
export async function login(data: LoginRequest): Promise<void> {
  await api.post<AuthResponse>('/auth/login', data)
}

/** POST /auth/logout — invalida la cookie httpOnly. */
export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

/**
 * POST /api/usuarios/registro — crea la cuenta y devuelve el UsuarioResponseDTO.
 * Si el backend emite la cookie jwt en la respuesta, la sesión queda activa;
 * si no, el usuario deberá loguearse después.
 */
export async function registro(data: RegistroRequest): Promise<Usuario> {
  const { data: usuario } = await api.post<Usuario>('/api/usuarios/registro', data)
  return usuario
}

/**
 * POST /auth/google — login/signup con idToken de Google Identity Services.
 * Responde GoogleAuthResponseDTO { requiereRol, tipo, email, nombre }.
 */
export async function loginConGoogle(idToken: string): Promise<GoogleAuthResponse> {
  const body: GoogleAuthRequest = { idToken }
  const { data } = await api.post<GoogleAuthResponse>('/auth/google', body)
  return data
}

/**
 * POST /auth/google/completar-registro — completa un registro Google pendiente.
 * Toma GoogleCompletarRegistroDTO { idToken, rol }; email/nombre ya los conoce
 * el backend de la cuenta de Google. La cookie la setea solo el backend.
 */
export async function completarRegistro(data: GoogleCompletarRegistroRequest): Promise<void> {
  await api.post<void>('/auth/google/completar-registro', data)
}

/** GET /api/usuarios/me — usuario de la sesión actual (401 ⇒ no hay sesión). */
export async function getMe(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/api/usuarios/me')
  return data
}
