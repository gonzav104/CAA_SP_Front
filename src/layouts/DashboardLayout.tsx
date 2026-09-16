import { Outlet, useLocation, useMatches, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePaciente } from '../hooks/pacientes'
import { nombreCompleto } from '../lib/paciente'
import { AppHeader } from './shell/AppHeader'
import { AppSidebar } from './shell/AppSidebar'
import { MobileNavDrawer } from './shell/MobileNavDrawer'
import { construirNavItems } from './shell/navItems'

/**
 * Metadata de ruta leída vía `useMatches` (design `sdd/paciente-overview`,
 * obs #65): reemplaza el pathname-parsing que antes vivía en un helper
 * dedicado, ya eliminado. RR7 tipa `handle` como `unknown` por defecto —
 * esta interfaz local solo tipa el cast en este punto de lectura (no se
 * comparte con `routes/router.tsx`, que define su propia copia local para
 * tipar los `handle` que declara).
 */
interface RouteHandle {
  titulo: string
}

/** Título usado cuando ninguna ruta activa expone `handle.titulo` (p.ej. `/pacientes`, `/`). */
const TITULO_POR_DEFECTO = 'Pacientes'

/**
 * Shell de la Zona A (D6): composición de sidebar fija + drawer móvil + header.
 * Owns únicamente el estado del drawer, el cierre al cambiar de ruta y el
 * short-circuit de auth. El cierre por Escape ahora vive scopeado dentro de
 * `MobileNavDrawer` (parte de su focus trap), ya no es un listener permanente
 * en `window`. Toda la presentación vive en `./shell/*`, consumiendo
 * `construirNavItems` como fuente única de items (ahora `NavGroup[]`,
 * renderizados con estructura por `SidebarNav`) y `usePaciente` como única
 * fuente del nombre de paciente, threadeado a `AppHeader` por props.
 */
export function DashboardLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const matches = useMatches()
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const disparadorRef = useRef<HTMLButtonElement>(null)
  const pacienteQuery = usePaciente(pacienteId)

  // Cierra el drawer al cambiar de ruta (navegación desde el menú).
  /* eslint-disable react/set-state-in-effect -- patrón requerido por design: el estado del drawer vive acá y la navegación cambia la ruta externamente. */
  useEffect(() => {
    setDrawerAbierto(false)
  }, [location.pathname])
  /* eslint-enable react/set-state-in-effect */

  // ProtectedRoute garantiza sesión: si por alguna razón no hay usuario,
  // no se renderiza nada (el guard redirige a /login).
  if (!usuario) {
    return null
  }

  const grupos = construirNavItems({ rol: usuario.rol, pacienteId })

  // El match más profundo (findLast) que declare `handle.titulo` gana: una
  // ruta hija sin handle propio hereda el título de su ancestro más cercano
  // que sí lo declare.
  const matchConTitulo = matches.findLast((match) => (match.handle as RouteHandle | undefined)?.titulo)
  const titulo = (matchConTitulo?.handle as RouteHandle | undefined)?.titulo ?? TITULO_POR_DEFECTO

  const nombrePaciente = pacienteQuery.data ? nombreCompleto(pacienteQuery.data) : undefined
  const pacienteCargando = Boolean(pacienteId) && pacienteQuery.isPending

  const manejarLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const cerrarDrawer = () => setDrawerAbierto(false)

  return (
    <div className="min-h-svh bg-muted/40">
      <AppSidebar groups={grupos} />
      <MobileNavDrawer
        abierto={drawerAbierto}
        onCerrar={cerrarDrawer}
        groups={grupos}
        disparadorRef={disparadorRef}
      />

      <div className="flex min-h-svh flex-col lg:pl-64" inert={drawerAbierto || undefined}>
        <AppHeader
          usuario={usuario}
          titulo={titulo}
          nombrePaciente={nombrePaciente}
          pacienteCargando={pacienteCargando}
          drawerAbierto={drawerAbierto}
          onAbrirDrawer={() => setDrawerAbierto(true)}
          onLogout={() => void manejarLogout()}
          disparadorRef={disparadorRef}
        />

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
