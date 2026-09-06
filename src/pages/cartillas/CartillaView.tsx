import { LayoutGrid, Pencil, Play, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ThumbPictograma } from '../../components/ThumbPictograma'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { DetalleSkeleton, ErrorCarga, CardVacio } from '../../components/estados'
import { useCartilla } from '../../hooks/cartillas'
import { useAuth } from '../../hooks/useAuth'
import { imagenUrlDeItem, ordenarPorOrden, ordenarPorOrdenVisual } from '../../lib/cartilla'
import { normalizeColorHex } from '../../lib/color'
import { formatError } from '../../lib/utils'

/**
 * CartillaView (/pacientes/:pacienteId/cartillas/:idCartilla, T8).
 * Vista de SOLO REVISIÓN dentro del dashboard (Zona A, sobria): categorías como
 * secciones con tira de color derivada de colorHex (inline style, única vía para
 * colores dinámicos) y grid de items en tamaño moderado.
 * NO reproduce audio: eso es el modo de uso (T9, /uso/:pacienteId/:cartillaId);
 * el botón del final es el puente natural a esa ruta.
 * El botón «Editar» solo aparece si el usuario logueado es el creador de la
 * cartilla (gate creadorId — el backend además rechaza edición no autorizada).
 */
export function CartillaView() {
  const { pacienteId, idCartilla } = useParams<{ pacienteId: string; idCartilla: string }>()
  const pid = pacienteId
  const cid = idCartilla
  const idsValidos = pid !== undefined && pid.trim() !== '' && cid !== undefined && cid.trim() !== ''
  const { usuario } = useAuth()
  const cartillaQuery = useCartilla(idsValidos ? pid : undefined, idsValidos ? cid : undefined)

  if (!idsValidos) {
    return <ErrorCarga mensaje="Identificador de cartilla inválido." volverA="/pacientes" />
  }

  if (cartillaQuery.isPending) {
    return <DetalleSkeleton />
  }

  if (cartillaQuery.isError) {
    return (
      <ErrorCarga
        mensaje={formatError(cartillaQuery.error)}
        onReintentar={() => void cartillaQuery.refetch()}
        volverA={`/pacientes/${pid}/cartillas`}
      />
    )
  }

  const cartilla = cartillaQuery.data
  if (!cartilla) {
    return (
      <ErrorCarga
        mensaje="No se encontró la cartilla."
        volverA={`/pacientes/${pid}/cartillas`}
      />
    )
  }

  const esCreador = usuario?.id === cartilla.creadorId
  const categorias = ordenarPorOrden(cartilla.categorias ?? [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{cartilla.nombre}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {cartilla.esPrincipal && (
              <Badge variant="outline">
                <Star className="size-3" aria-hidden="true" />
                Principal
              </Badge>
            )}
            <Badge variant="outline">
              <LayoutGrid className="size-3" aria-hidden="true" />
              {cartilla.categorias.length}{' '}
              {cartilla.categorias.length === 1 ? 'categoría' : 'categorías'}
            </Badge>
          </div>
        </div>
        {esCreador && (
          <Button asChild>
            <Link to={`/pacientes/${pid}/cartillas/${cid}/editar`}>
              <Pencil aria-hidden="true" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      {categorias.length === 0 ? (
        <CardVacio
          icono={<LayoutGrid className="size-5" aria-hidden="true" />}
          titulo="Sin categorías"
          descripcion="Esta cartilla todavía no tiene categorías ni pictogramas."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {categorias.map((categoria) => {
            const items = ordenarPorOrdenVisual(categoria.items ?? [])
            return (
              <section
                key={categoria.id}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <span
                    aria-hidden="true"
                    className="h-6 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: normalizeColorHex(categoria.colorHex) }}
                  />
                  <h3 className="min-w-0 truncate text-base font-semibold tracking-tight">
                    {categoria.nombre}
                  </h3>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="p-4">
                  {items.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Sin items</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-col items-center gap-2 rounded-lg border border-border px-3 py-3 text-center"
                        >
                          <ThumbPictograma
                            src={imagenUrlDeItem(item)}
                            alt={item.textoHablado}
                            className="h-20 w-20"
                          />
                          <span className="text-xs font-medium text-foreground">
                            {item.textoHablado}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <Button asChild variant="outline">
          <Link to={`/pacientes/${pid}/cartillas`}>Volver a cartillas</Link>
        </Button>
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
          <Link to={`/uso/${pid}/${cid}`}>
            <Play aria-hidden="true" />
            Abrir en modo uso
          </Link>
        </Button>
      </div>
    </div>
  )
}