import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { AppHeader } from './shell/AppHeader'
import { AppSidebar } from './shell/AppSidebar'
import { MobileNavDrawer } from './shell/MobileNavDrawer'
import { construirNavItems } from './shell/navItems'
import { tituloDeSeccion } from './shell/tituloDeSeccion'

/**
 * Shell de la Zona A (D6): composición de sidebar fija + drawer móvil + header.
 * Owns únicamente el estado del drawer, el cierre al cambiar de ruta y el
 * short-circuit de auth. El cierre por Escape ahora vive scopeado dentro de
 * `MobileNavDrawer` (parte de su focus trap), ya no es un listener permanente
 * en `window`. Toda la presentación vive en `./shell/*`, consumiendo
 * `construirNavItems` como fuente única de items.
 */
export function DashboardLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const disparadorRef = useRef<HTMLButtonElement>(null)

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

  // TODO(paciente-overview PR2): `AppSidebar`/`MobileNavDrawer` todavía esperan
  // `NavItemDef[]` (render plano); acá se aplana `NavGroup[]` como shim de
  // compatibilidad hasta que PR2 los actualice para renderizar grupos
  // (encabezados, dividers, `enfasis`). El orden y el contenido no cambian.
  const items = construirNavItems({ rol: usuario.rol, pacienteId }).flatMap((grupo) => grupo.items)
  const titulo = tituloDeSeccion(location.pathname)

  const manejarLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const cerrarDrawer = () => setDrawerAbierto(false)

  return (
    <div className="min-h-svh bg-muted/40">
      <AppSidebar items={items} />
      <MobileNavDrawer
        abierto={drawerAbierto}
        onCerrar={cerrarDrawer}
        items={items}
        disparadorRef={disparadorRef}
      />

      <div className="flex min-h-svh flex-col lg:pl-64" inert={drawerAbierto || undefined}>
        <AppHeader
          usuario={usuario}
          titulo={titulo}
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
