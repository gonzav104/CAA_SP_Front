import axios, { AxiosError } from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
  timeout: 15000,
})

export class ApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Endpoints que pueden responder 401 sin implicar sesión expirada.
 * `/api/usuarios/me` está incluido: el AuthProvider lo consulta al montar y un 401
 * ahí solo significa "no hay sesión" (usuario null) — nunca debe hard-redirectear.
 * `/auth/google` y `/auth/google/completar-registro`: flujos de autenticación
 * previos a la sesión — un 401 ahí tampoco es una sesión caída.
 */
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/logout',
  '/auth/google',
  '/auth/google/completar-registro',
  '/api/usuarios/registro',
  '/api/usuarios/me',
]

function errorMessage(error: AxiosError<unknown>): string {
  if (error.code === 'ECONNABORTED') {
    return 'El servidor no respondió. Intentalo de nuevo.'
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor.'
  }
  const data = error.response.data
  if (typeof data === 'object' && data !== null) {
    const { message } = data as { message?: unknown }
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }
  return `Error ${error.response.status}`
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isPublic = PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint))
    const onPublicPage =
      window.location.pathname === '/login' || window.location.pathname === '/registro'

    if (status === 401 && !isPublic && !onPublicPage) {
      window.location.assign('/login')
    }

    return Promise.reject(new ApiError(status ?? 0, errorMessage(error), error.response?.data))
  },
)