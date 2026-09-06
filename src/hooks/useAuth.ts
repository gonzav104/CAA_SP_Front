import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context/AuthContext'

/**
 * Acceso al estado de autenticación. Debe usarse dentro de <AuthProvider>.
 * Lanza error claro si se usa fuera del provider (p.ej. en un test o en App raíz).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}