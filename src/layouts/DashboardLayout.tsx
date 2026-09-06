import {
  CalendarDays,
  HeartPulse,
  Image,
  LayoutGrid,
  LogOut,
  Menu,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/utils'

interface NavItemProps {
  to: string
  icon: LucideIcon
  /** Marca el item activo solo cuando la ruta coincide exacta (p.ej. base /pacientes). */
  end?: boolean
  children: string
}

/**
 * Item de navegación del sidebar: NavLink con estado activo en azul (Zona A).
 * El estado activo se calcula sobre `pathname + search` del location: con `end`
 * se resalta solo en la coincidencia exacta (p.ej. «Pacientes» en /pacientes),
 * sin `end` se resalta cuando el pathname empieza por `to` (items por paciente).
 */
function NavItem({ to, icon: Icon, end, children }: NavItemProps) {
  const location = useLocation()
  const activo = end
    ? location.pathname + location.search === to
    : (location.pathname + location.search).startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        activo
          ? 'bg-blue-600 text-white'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </NavLink>
  )
}

/** Iniciales para el fallback del avatar (p.ej. «Ana María» → «AM»). */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : ''
  return (primera + ultima).toUpperCase()
}

/** Nombre de la sección activa para el título del header. */
function tituloDeSeccion(pathname: string): string {
  const segmentos = pathname.split('/').filter(Boolean)
  if (segmentos[0] === 'familiar') return 'Mi familia'
  if (segmentos[0] === 'pacientes') {
    if (segmentos.length >= 3) {
      const sub = segmentos[2]
      if (sub === 'cartillas') return 'Cartillas'
      if (sub === 'sesiones' && segmentos[3] === 'nuevo') return 'Nueva sesión'
      if (sub === 'sesiones' && segmentos[3] === 'editar') return 'Editar sesión'
      if (sub === 'sesiones') return 'Sesiones'
      if (sub === 'colaboradores' && segmentos[3] === 'agregar') return 'Agregar colaborador'
      if (sub === 'colaboradores') return 'Colaboradores'
      if (sub === 'pictogramas') return 'Pictogramas'
    }
    if (segmentos.length === 2) return 'Paciente'
  }
  return 'Pacientes'
}

/**
 * Shell de la Zona A (D6): sidebar fija con navegación global + contextual.
 * - «Pacientes» (o «Mi familia») siempre visible, según rol (RI-2).
 * - Dentro de /pacientes/:id aparecen los items contextuales de primer nivel:
 *   Cartillas (todos), Sesiones y Colaboradores SOLO para rol TERAPEUTA.
 * - Header con título de sección + avatar del usuario con logout.
 */
export function DashboardLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  // Cierra el drawer al cambiar de ruta (navegación desde el menú).
  /* eslint-disable react/set-state-in-effect -- patrón requerido por design: el estado del drawer vive acá y la navegación cambia la ruta externamente. */
  useEffect(() => {
    setDrawerAbierto(false)
  }, [location.pathname])
  /* eslint-enable react/set-state-in-effect */

  // Escape cierra el drawer (accesibilidad).
  useEffect(() => {
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setDrawerAbierto(false)
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [])

  // ProtectedRoute garantiza sesión: si por alguna razón no hay usuario,
  // no se renderiza nada (el guard redirige a /login).
  if (!usuario) {
    return null
  }

  const esTerapeuta = usuario.rol === 'TERAPEUTA'
  const esFamiliar = usuario.rol === 'FAMILIAR'
  const titulo = tituloDeSeccion(location.pathname)
  const rolLabel = esTerapeuta ? 'Terapeuta' : 'Familiar'

  const manejarLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const cerrarDrawer = () => setDrawerAbierto(false)

  // Contenido compartido del sidebar (nav global + contextual).
  const contenidoSidebar = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <HeartPulse className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">CAA</span>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
        aria-label="Navegación principal"
      >
        {esFamiliar ? (
          <NavItem to="/familiar" icon={Users} end>
            Mi familia
          </NavItem>
        ) : (
          <NavItem to="/pacientes" icon={Users} end>
            Pacientes
          </NavItem>
        )}

        {/* Items contextuales de primer nivel: solo dentro de un paciente.
            Un FAMILIAR jamás ve Sesiones ni Colaboradores (RI-2). */}
        {pacienteId && esTerapeuta && (
          <NavItem to={`/pacientes/${pacienteId}/cartillas`} icon={LayoutGrid}>
            Cartillas
          </NavItem>
        )}
        {pacienteId && esTerapeuta && (
          <NavItem to={`/pacientes/${pacienteId}/sesiones`} icon={CalendarDays}>
            Sesiones
          </NavItem>
        )}
        {pacienteId && esTerapeuta && (
          <NavItem to={`/pacientes/${pacienteId}/colaboradores`} icon={UsersRound}>
            Colaboradores
          </NavItem>
        )}
        {pacienteId && esTerapeuta && (
          <NavItem to={`/pacientes/${pacienteId}/pictogramas`} icon={Image}>
            Pictogramas
          </NavItem>
        )}
      </nav>
    </>
  )

  return (
    <div className="min-h-svh bg-muted/40">
      {/* Sidebar fija (desktop ≥1024px) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {contenidoSidebar}
      </aside>

      {/* Drawer (mobile/tablet <1024px) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:hidden',
          drawerAbierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {contenidoSidebar}
      </aside>

      {/* Backdrop del drawer: solo se muestra cuando drawer abierto */}
      {drawerAbierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={cerrarDrawer}
          aria-hidden="true"
        />
      )}

      {/* Columna principal */}
      <div className="flex min-h-svh flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 lg:hidden"
              aria-label="Abrir menú de navegación"
              aria-expanded={drawerAbierto}
              onClick={() => setDrawerAbierto(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
            <h1 className="truncate text-lg font-semibold tracking-tight">{titulo}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:block">{usuario.nombre}</span>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {rolLabel}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menú de usuario"
                  className="rounded-full outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Avatar>
                    <AvatarFallback>{iniciales(usuario.nombre)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{usuario.nombre}</span>
                    <span className="text-xs font-normal text-muted-foreground">{usuario.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => void manejarLogout()}>
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}