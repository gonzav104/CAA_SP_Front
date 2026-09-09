import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy, Suspense, type ReactElement } from 'react'
import { ErrorElement } from '../components/ErrorElement'
import { LoadingScreen } from '../components/LoadingScreen'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { RedirectPorRol } from './RedirectPorRol'
import { useAuth } from '../hooks/useAuth'

/**
 * Code-splitting (Fix 6): cada página es un chunk separado vía React.lazy.
 * - ModoUso (Zona B) es el chunk con más prioridad de separación: el chico
 *   entra directo a /uso/... y no debe pagar el bundle del dashboard completo.
 * - Infraestructura (ErrorElement, ProtectedRoute, DashboardLayout, guards,
 *   RedirectPorRol) queda EAGER: es chica y se necesita en toda navegación.
 * - Un solo <Suspense> como layout-route envuelve todas las rutas con
 *   <Outlet/>; mientras un chunk carga se muestra <LoadingScreen/>.
 */
const Login = lazy(() => import('../pages/auth/Login').then((m) => ({ default: m.Login })))
const Registro = lazy(() => import('../pages/auth/Registro').then((m) => ({ default: m.Registro })))
const OlvidePassword = lazy(() =>
  import('../pages/auth/OlvidePassword').then((m) => ({ default: m.OlvidePassword })),
)
const RestablecerPassword = lazy(() =>
  import('../pages/auth/RestablecerPassword').then((m) => ({ default: m.RestablecerPassword })),
)
const CartillaView = lazy(() =>
  import('../pages/cartillas/CartillaView').then((m) => ({ default: m.CartillaView })),
)
const EditorCartilla = lazy(() =>
  import('../pages/cartillas/EditorCartilla').then((m) => ({ default: m.EditorCartilla })),
)
const ListaCartillas = lazy(() =>
  import('../pages/cartillas/ListaCartillas').then((m) => ({ default: m.ListaCartillas })),
)
const AgregarColaborador = lazy(() =>
  import('../pages/colaboradores/AgregarColaborador').then((m) => ({ default: m.AgregarColaborador })),
)
const ListaColaboradores = lazy(() =>
  import('../pages/colaboradores/ListaColaboradores').then((m) => ({
    default: m.ListaColaboradores,
  })),
)
const FamiliarDashboard = lazy(() =>
  import('../pages/familiar/FamiliarDashboard').then((m) => ({ default: m.FamiliarDashboard })),
)
const ModoUso = lazy(() => import('../pages/modo-uso/ModoUso').then((m) => ({ default: m.ModoUso })))
const EditarPaciente = lazy(() =>
  import('../pages/pacientes/EditarPaciente').then((m) => ({ default: m.EditarPaciente })),
)
const ListaPacientes = lazy(() =>
  import('../pages/pacientes/Lista').then((m) => ({ default: m.ListaPacientes })),
)
const NuevoPaciente = lazy(() =>
  import('../pages/pacientes/NuevoPaciente').then((m) => ({ default: m.NuevoPaciente })),
)
const PictogramasCustom = lazy(() =>
  import('../pages/pacientes/PictogramasCustom').then((m) => ({ default: m.PictogramasCustom })),
)
const EditarSesion = lazy(() =>
  import('../pages/sesiones/EditarSesion').then((m) => ({ default: m.EditarSesion })),
)
const ListaSesiones = lazy(() =>
  import('../pages/sesiones/ListaSesiones').then((m) => ({ default: m.ListaSesiones })),
)
const NuevaSesion = lazy(() =>
  import('../pages/sesiones/NuevaSesion').then((m) => ({ default: m.NuevaSesion })),
)

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
 * - Suspense layout-route: fallback <LoadingScreen/> mientras carga un chunk.
 */
export const router = createBrowserRouter([
  {
    errorElement: <ErrorElement />,
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Registro /> },
      { path: '/olvide-password', element: <OlvidePassword /> },
      { path: '/restablecer-password', element: <RestablecerPassword /> },
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
              {
                path: 'pacientes/:pacienteId/sesiones/nuevo',
                element: (
                  <RequiereTerapeuta>
                    <NuevaSesion />
                  </RequiereTerapeuta>
                ),
              },
              {
                path: 'pacientes/:pacienteId/sesiones/:idSesion/editar',
                element: (
                  <RequiereTerapeuta>
                    <EditarSesion />
                  </RequiereTerapeuta>
                ),
              },
              {
                path: 'pacientes/:pacienteId/colaboradores',
                element: <ListaColaboradores />,
              },
              {
                path: 'pacientes/:pacienteId/colaboradores/agregar',
                element: (
                  <RequiereTerapeuta>
                    <AgregarColaborador />
                  </RequiereTerapeuta>
                ),
              },
              {
                path: 'pacientes/:pacienteId/pictogramas',
                element: <PictogramasCustom />,
              },
              { path: 'pacientes/:pacienteId/editar', element: <RequiereTerapeuta><EditarPaciente /></RequiereTerapeuta> },
              {
                // El detalle intermedio se obvió: la URL raíz de un paciente
                // redirige directo a sus cartillas, el destino al que llevaba
                // el click desde la lista de pacientes.
                path: 'pacientes/:pacienteId',
                element: <Navigate to="cartillas" replace />,
              },
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