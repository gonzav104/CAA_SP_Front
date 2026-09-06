import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { ErrorElement } from '../components/ErrorElement'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { Login } from '../pages/auth/Login'
import { Registro } from '../pages/auth/Registro'
import { CartillaView } from '../pages/cartillas/CartillaView'
import { EditorCartilla } from '../pages/cartillas/EditorCartilla'
import { ListaCartillas } from '../pages/cartillas/ListaCartillas'
import { AgregarColaborador } from '../pages/colaboradores/AgregarColaborador'
import { ListaColaboradores } from '../pages/colaboradores/ListaColaboradores'
import { FamiliarDashboard } from '../pages/familiar/FamiliarDashboard'
import { ModoUso } from '../pages/modo-uso/ModoUso'
import { EditarPaciente } from '../pages/pacientes/EditarPaciente'
import { ListaPacientes } from '../pages/pacientes/Lista'
import { NuevoPaciente } from '../pages/pacientes/NuevoPaciente'
import { PacienteDetalle } from '../pages/pacientes/PacienteDetalle'
import { PictogramasCustom } from '../pages/pacientes/PictogramasCustom'
import { EditarSesion } from '../pages/sesiones/EditarSesion'
import { ListaSesiones } from '../pages/sesiones/ListaSesiones'
import { NuevaSesion } from '../pages/sesiones/NuevaSesion'
import { RedirectPorRol } from './RedirectPorRol'
import { useAuth } from '../hooks/useAuth'

/**
 * Data router de la app (D1).
 * - /login y /registro: públicas.
 * - ProtectedRoute como layout-route (D4): guard de la Zona A.
 * - DashboardLayout anidado (D6/D7): /pacientes vive DENTRO del shell; el
 *   index de la zona protegida bifurca por rol (RI-1): TERAPEUTA → /pacientes,
 *   FAMILIAR → /familiar. FAMILIAR accediendo a /pacientes → redirect a /familiar.
 * - Gestión de pacientes (T7) + cartillas (T8) + sesiones y colaboradores como
 *   páginas propias (B3). Los segmentos dinámicos se nombran `:pacienteId` /
 *   `:idCartilla` para coincidir con el useParams de las páginas.
 * - /uso/:pacienteId/:cartillaId (Zona B, modo uso) cuelga DIRECTAMENTE de
 *   ProtectedRoute — fuera del DashboardLayout (D7): el chico no hereda sidebar
 *   ni navbar del dashboard.
 * - errorElement raíz: página sobria para errores inesperados.
 */
export const router = createBrowserRouter([
  {
    errorElement: <ErrorElement />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Registro /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <RedirectPorRol /> },
              {
                path: 'pacientes',
                element: <PacientesIndex />,
              },
              { path: 'pacientes/nuevo', element: <RequiereTerapeuta><NuevoPaciente /></RequiereTerapeuta> },
              { path: 'pacientes/:pacienteId/cartillas', element: <ListaCartillas /> },
              {
                path: 'pacientes/:pacienteId/cartillas/:idCartilla',
                element: <CartillaView />,
              },
              {
                path: 'pacientes/:pacienteId/cartillas/:idCartilla/editar',
                element: <EditorCartilla />,
              },
              { path: 'pacientes/:pacienteId/sesiones', element: <ListaSesiones /> },
              { path: 'pacientes/:pacienteId/sesiones/nuevo', element: <NuevaSesion /> },
              {
                path: 'pacientes/:pacienteId/sesiones/:idSesion/editar',
                element: <EditarSesion />,
              },
              {
                path: 'pacientes/:pacienteId/colaboradores',
                element: <ListaColaboradores />,
              },
              {
                path: 'pacientes/:pacienteId/colaboradores/agregar',
                element: <AgregarColaborador />,
              },
              {
                path: 'pacientes/:pacienteId/pictogramas',
                element: <PictogramasCustom />,
              },
              { path: 'pacientes/:pacienteId/editar', element: <RequiereTerapeuta><EditarPaciente /></RequiereTerapeuta> },
              { path: 'pacientes/:pacienteId', element: <PacienteDetalle /> },
              { path: 'familiar', element: <FamiliarDashboard /> },
            ],
          },
          {
            // Zona B (D7): full-screen, sin layout del dashboard. CartillaView
            // enlaza acá con «Abrir en modo uso».
            path: 'uso/:pacienteId/:cartillaId',
            element: <ModoUso />,
          },
        ],
      },
    ],
  },
])

/**
 * Lista de pacientes: SOLO TERAPEUTA. Un FAMILIAR que intente acceder a
 * /pacientes es redirigido a /familiar (RI-1 — su dashboard terminal).
 */
function PacientesIndex() {
  const { usuario } = useAuth()
  if (!usuario) {
    return null
  }
  if (usuario.rol === 'FAMILIAR') {
    return <Navigate to="/familiar" replace />
  }
  return <ListaPacientes />
}

/**
 * Rutas de gestión de pacientes (crear/editar): SOLO TERAPEUTA. Un FAMILIAR
 * que escriba la URL a mano (p. ej. /pacientes/:id/editar) es redirigido a
 * /familiar — jamás ve un formulario de gestión (RI-2).
 */
function RequiereTerapeuta({ children }: { children: ReactElement }) {
  const { usuario } = useAuth()
  if (!usuario) {
    return null
  }
  if (usuario.rol === 'FAMILIAR') {
    return <Navigate to="/familiar" replace />
  }
  return children
}