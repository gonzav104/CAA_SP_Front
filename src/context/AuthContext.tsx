import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '../services/auth'
import type {
  GoogleAuthResponse,
  GoogleCompletarRegistroRequest,
  LoginRequest,
  RegistroRequest,
  Usuario,
} from '../types'

export interface AuthContextValue {
  usuario: Usuario | null
  isInitializing: boolean
  /** POST /auth/login. La cookie la setea el backend; acá se refetcha /me. */
  login: (data: LoginRequest) => Promise<Usuario>
  /**
   * POST /api/usuarios/registro. Crea la cuenta y devuelve el usuario creado.
   * Si el backend no emite cookie, la UI redirige a /login vía el guard de rutas.
   */
  registro: (data: RegistroRequest) => Promise<Usuario>
  /** POST /auth/logout. Ignora errores de red y limpia el caché de queries. */
  logout: () => Promise<void>
  /**
   * POST /auth/google. Retorna GoogleAuthResponseDTO. Si `requiereRol === true`
   * el registro Google quedó a medio completar → la UI redirige a /registro;
   * de lo contrario la cookie queda seteada y se carga el usuario vía /me.
   */
  loginConGoogle: (idToken: string) => Promise<GoogleAuthResponse>
  /** POST /auth/google/completar-registro. Setea `usuario` al completar. */
  completarRegistro: (data: GoogleCompletarRegistroRequest) => Promise<Usuario>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let active = true

    authService
      .getMe()
      .then(
        (me) => {
          if (active) setUsuario(me)
        },
        () => {
          // 401 (sin sesión) o error de red (backend caído): usuario null.
          // El login lo reintentará. Nunca rompe el flujo ni dispara redirect.
          if (active) setUsuario(null)
        },
      )
      .finally(() => {
        if (active) setIsInitializing(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (data: LoginRequest): Promise<Usuario> => {
    await authService.login(data)
    const u = await authService.getMe()
    setUsuario(u)
    return u
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout()
    } catch {
      // Errores de red no deben impedir cerrar la sesión local.
    } finally {
      setUsuario(null)
      queryClient.clear()
    }
  }, [queryClient])

  const registro = useCallback(async (data: RegistroRequest): Promise<Usuario> => {
    const u = await authService.registro(data)
    setUsuario(u)
    return u
  }, [])

  const loginConGoogle = useCallback(
    async (idToken: string): Promise<GoogleAuthResponse> => {
      const resultado = await authService.loginConGoogle(idToken)
      // Solo hay sesión completa si `requiereRol === false` (cookie seteada por
      // el backend): se carga el usuario vía /me.
      if (!resultado.requiereRol) {
        const u = await authService.getMe()
        setUsuario(u)
      }
      return resultado
    },
    [],
  )

  const completarRegistro = useCallback(
    async (data: GoogleCompletarRegistroRequest): Promise<Usuario> => {
      await authService.completarRegistro(data)
      const u = await authService.getMe()
      setUsuario(u)
      return u
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, isInitializing, login, registro, logout, loginConGoogle, completarRegistro }),
    [usuario, isInitializing, login, registro, logout, loginConGoogle, completarRegistro],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
