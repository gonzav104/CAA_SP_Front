import type { ReactNode } from 'react'
import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { CardVacio, ErrorCarga } from '../estados'
import { formatError } from '../../lib/utils'

const GRID_CLASSNAME = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'

/**
 * Forma estructural mínima que necesita `PacientesGrid` del resultado de
 * `usePacientes()` (o cualquier query equivalente). Se define localmente en
 * vez de importar `UseQueryResult` para que el componente siga siendo
 * presentacional y no dependa de la librería de queries.
 */
export interface ResultadoConsulta<T> {
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  data: T[] | undefined
  error: unknown
  refetch: () => void | Promise<unknown>
}

interface EstadoVacio {
  icono: ReactNode
  titulo: string
  descripcion: string
  /** CTA opcional del estado vacío (p.ej. «Nuevo paciente»); no todos los roles lo tienen. */
  accion?: ReactNode
}

/** Skeleton de la grilla mientras carga la consulta (solo el contenido, sin el header de la página). */
function GridSkeleton({ cantidad }: { cantidad: number }) {
  return (
    <div className={GRID_CLASSNAME}>
      {Array.from({ length: cantidad }, (_, indice) => (
        <Card key={indice} className="shadow-sm">
          <CardContent className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Resuelve los cuatro estados de una consulta de pacientes (carga, error,
 * vacío, éxito) y renderiza la grilla de tarjetas correspondiente. Reutiliza
 * `ErrorCarga`/`CardVacio` de `estados.tsx` en vez de duplicar su markup.
 */
export function PacientesGrid<T extends { id: string }>({
  resultado,
  renderItem,
  vacio,
  cantidadSkeleton = 4,
}: {
  resultado: ResultadoConsulta<T>
  renderItem: (item: T) => ReactNode
  vacio: EstadoVacio
  cantidadSkeleton?: number
}) {
  if (resultado.isPending) {
    return <GridSkeleton cantidad={cantidadSkeleton} />
  }

  if (resultado.isError) {
    return (
      <ErrorCarga mensaje={formatError(resultado.error)} onReintentar={() => void resultado.refetch()} />
    )
  }

  const items = resultado.data ?? []

  if (items.length === 0) {
    return (
      <CardVacio icono={vacio.icono} titulo={vacio.titulo} descripcion={vacio.descripcion}>
        {vacio.accion}
      </CardVacio>
    )
  }

  return <div className={GRID_CLASSNAME}>{items.map((item) => renderItem(item))}</div>
}
