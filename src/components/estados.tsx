import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Skeleton } from './ui/skeleton'

/**
 * Estados compartidos de las vistas de la Zona A (sobrios):
 * skeleton de detalle, error con reintento/volver, vacío con CTA opcional
 * y skeleton de filas para listas/tabs. Vivían en pages/pacientes/estados.tsx;
 * se promovieron acá en T8 porque las vistas de cartillas los usan también.
 */

/** Skeleton del detalle/edición (header + acciones + cuerpo). */
export function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  )
}

/** Card de error con acciones opcionales: reintentar y/o volver (link). */
export function ErrorCarga({
  mensaje,
  onReintentar,
  volverA,
}: {
  mensaje: string
  onReintentar?: () => void
  /** Si se pasa, muestra un botón «Volver» como link a esa ruta. */
  volverA?: string
}) {
  return (
    <Card className="py-12 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">No se pudo cargar</p>
          <p className="mt-1 text-sm text-muted-foreground">{mensaje}</p>
        </div>
        <div className="flex gap-2">
          {onReintentar && (
            <Button variant="outline" onClick={onReintentar}>
              Reintentar
            </Button>
          )}
          {volverA && (
            <Button asChild variant="outline">
              <Link to={volverA}>Volver</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** Card de estado vacío con título, descripción y CTA opcional. */
export function CardVacio({
  icono,
  titulo,
  descripcion,
  children,
}: {
  icono: ReactNode
  titulo: string
  descripcion: string
  children?: ReactNode
}) {
  return (
    <Card className="py-12 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icono}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{titulo}</p>
          <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

/** Skeleton de filas para listas dentro de tabs (sesiones/colaboradores/cartillas). */
export function FilasSkeleton({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: cantidad }, (_, indice) => (
          <div key={indice} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}