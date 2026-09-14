import { LogOut, Menu } from 'lucide-react'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import type { Usuario } from '../../types/Usuario'

interface AppHeaderProps {
  usuario: Usuario
  titulo: string
  drawerAbierto: boolean
  onAbrirDrawer: () => void
  onLogout: () => void
}

/** Iniciales para el fallback del avatar (p.ej. «Ana María» → «AM»). */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : ''
  return (primera + ultima).toUpperCase()
}

/**
 * Header de la Zona A: trigger del drawer móvil, título de sección
 * (`tituloDeSeccion`), y menú de usuario con logout.
 */
export function AppHeader({
  usuario,
  titulo,
  drawerAbierto,
  onAbrirDrawer,
  onLogout,
}: AppHeaderProps) {
  const rolLabel = usuario.rol === 'TERAPEUTA' ? 'Terapeuta' : 'Familiar'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 lg:hidden"
          aria-label="Abrir menú de navegación"
          aria-expanded={drawerAbierto}
          onClick={onAbrirDrawer}
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
            <DropdownMenuItem variant="destructive" onSelect={onLogout}>
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
