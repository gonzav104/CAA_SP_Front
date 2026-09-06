import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingScreen } from './LoadingScreen'

/**
 * Guard de rutas privadas (Zona A).
 * - Mientras AuthProvider restaura la sesión (GET /api/usuarios/me): spinner full-page.
 * - Sin sesión: redirige a /login.
 * - Con sesión: renderiza las rutas anidadas (<Outlet/>).
 * Se monta como layout-route en src/routes/router.tsx (T5).
 */
export function ProtectedRoute() {
  const { usuario, isInitializing } = useAuth()

  if (isInitializing) {
    return <LoadingScreen label="Cargando aplicación…" />
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}