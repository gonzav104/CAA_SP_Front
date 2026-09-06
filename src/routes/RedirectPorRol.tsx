import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Bifurcación por rol (RI-1):
 * - TERAPEUTA → /pacientes (guarda el index de la Zona A)
 * - FAMILIAR → /familiar (también protege /pacientes: un familiar que intente
 *   acceder directamente es redirigido a su dashboard terminal)
 */
export function RedirectPorRol() {
  const { usuario } = useAuth()

  if (!usuario) {
    return null
  }

  return <Navigate to={usuario.rol === 'TERAPEUTA' ? '/pacientes' : '/familiar'} replace />
}
