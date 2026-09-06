import { Check, Frown, LayoutGrid, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarraFrase } from '../../components/BarraFrase'
import { ThumbPictograma } from '../../components/ThumbPictograma'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { useCartilla } from '../../hooks/cartillas'
import { useConstructorOraciones } from '../../hooks/constructor-oraciones'
import { imagenUrlDeItem, ordenarPorOrden, ordenarPorOrdenVisual } from '../../lib/cartilla'
import { normalizeColorHex } from '../../lib/color'
import { detener, hablar } from '../../lib/tts'
import { cn } from '../../lib/utils'
import type { CategoriaDetalle } from '../../types'

/**
 * Modo de uso (Zona B, T9): pantalla full-screen del chico en
 * /uso/:pacienteId/:cartillaId, montada FUERA del DashboardLayout (D7) —
 * sin sidebar, sin navbar, sin «professionalismo sobrio».
 *
 * - Header simple con el nombre de la cartilla y botón Salir (X grande) que
 *   SIEMPRE pide confirmación antes de irse (KU-1, D10): el chico no se va
 *   por error.
 * - Panel izquierdo de categorías con el color sólido de cada una
 *   (Categoria.colorHex → normalizeColorHex, D8). Tocar una categoría la
 *   selecciona Y habla su nombre (ayuda a navegar).
 * - Barra de oraciones (RI-12): arriba del grid. Tocar un pictograma AGREGA su
 *   texto a la frase (ya NO habla directo, RI-12). El botón «Decir» concatena
 *   la frase y la habla (RI-13, con cancel() previo).
 * - Grid principal de pictogramas: tiles ≥120px (imagen arriba, etiqueta
 *   abajo, alto contraste).
 * - Estados de carga, error y vacío amigables, sin jerga técnica (KU-4).
 */
export function ModoUso() {
  const { pacienteId, cartillaId } = useParams<{ pacienteId: string; cartillaId: string }>()
  const pid = pacienteId
  const cid = cartillaId
  const idsValidos = pid !== undefined && pid.trim() !== '' && cid !== undefined && cid.trim() !== ''
  const navegar = useNavigate()
  const cartillaQuery = useCartilla(idsValidos ? pid : undefined, idsValidos ? cid : undefined)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null)
  const { frase, agregarPalabra, borrarUltima, limpiar, removerIndice, cantidadPalabras } =
    useConstructorOraciones()

  // Al desmontar (salir o volver), corta cualquier emisión en curso.
  useEffect(() => () => detener(), [])

  if (!idsValidos) {
    return <PantallaError mensaje="No se pudo cargar la cartilla." volverA="/pacientes" />
  }

  if (cartillaQuery.isPending) {
    return (
      <div
        role="status"
        className="flex h-dvh flex-col items-center justify-center gap-4 bg-amber-50"
      >
        <Loader2 className="size-10 animate-spin text-amber-500" aria-hidden="true" />
        <p className="text-lg font-semibold text-slate-700">Preparando la cartilla…</p>
        <span className="sr-only">Preparando la cartilla…</span>
      </div>
    )
  }

  if (cartillaQuery.isError) {
    return (
      <PantallaError
        mensaje="No se pudo cargar la cartilla"
        onReintentar={() => void cartillaQuery.refetch()}
        volverA={`/pacientes/${pid}`}
      />
    )
  }

  const cartilla = cartillaQuery.data
  if (!cartilla) {
    return <PantallaError mensaje="No se encontró la cartilla." volverA={`/pacientes/${pid}`} />
  }

  const categorias = ordenarPorOrden(cartilla.categorias ?? [])
  // Si el chico todavía no eligió categoría, la activa es la primera.
  const categoriaActiva = categorias.find((c) => c.id === categoriaSeleccionada) ?? categorias[0]
  const items = ordenarPorOrdenVisual(categoriaActiva?.items ?? [])

  const seleccionarCategoria = (categoria: CategoriaDetalle) => {
    setCategoriaSeleccionada(categoria.id)
    hablar(categoria.nombre)
  }

  const decirFrase = () => {
    if (cantidadPalabras === 0) return
    detener()
    hablar(frase.join(' '))
  }

  const confirmarSalida = () => {
    detener()
    navegar(`/pacientes/${pid}`)
  }

  return (
    <div className="flex h-dvh touch-manipulation select-none flex-col overflow-hidden overscroll-none bg-amber-50">
      <header className="safe-area-t flex min-h-16 shrink-0 items-center justify-between gap-3 border-b-2 border-amber-200 bg-white/70 px-3 py-2 sm:px-5">
        <h1 className="min-w-0 flex-1 text-xl font-bold leading-tight tracking-tight text-slate-800 sm:text-2xl">
          {cartilla.nombre}
        </h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="h-11 shrink-0 rounded-full border-2 border-amber-300 bg-white px-4 text-base font-semibold text-slate-700 shadow-sm hover:bg-amber-50"
            >
              <X className="size-5" aria-hidden="true" />
              Salir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Salir del modo de uso?</AlertDialogTitle>
              <AlertDialogDescription>
                {cantidadPalabras > 0
                  ? 'Tenés una frase armada. Si salís, se pierde y se corta el audio.'
                  : 'Si salís, volvemos a la cartilla y se corta el audio.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Quedarme</AlertDialogCancel>
              <AlertDialogAction onClick={confirmarSalida}>Salir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <BarraFrase
        frase={frase}
        onDecir={decirFrase}
        onBorrarUltima={borrarUltima}
        onLimpiar={limpiar}
        onRemoverIndice={removerIndice}
      />

      {categorias.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <LayoutGrid className="size-12 text-amber-500" aria-hidden="true" />
            <p className="text-xl font-bold text-slate-800">Esta cartilla no tiene categorías</p>
            <p className="text-base text-slate-600">
              Pedile a tu terapeuta que le agregue pictogramas para empezar a usarla.
            </p>
            <Button asChild>
              <Link to={`/pacientes/${pid}`}>Volver</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Strip horizontal de categorías (<md): scrollable, pills redondeadas */}
          <nav
            aria-label="Categorías"
            className="flex shrink-0 gap-2 overflow-x-auto border-b-2 border-amber-200 bg-amber-100/60 px-3 py-2 md:hidden"
          >
            {categorias.map((categoria) => {
              const activa = categoria.id === categoriaActiva?.id
              return (
                <Button
                  key={categoria.id}
                  type="button"
                  variant="default"
                  onClick={() => seleccionarCategoria(categoria)}
                  aria-pressed={activa}
                  className={cn(
                    'min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:brightness-110 active:scale-95',
                    activa && 'ring-4 ring-black/50',
                  )}
                  style={{ backgroundColor: normalizeColorHex(categoria.colorHex) }}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {activa && (
                      <Check className="size-4 shrink-0 drop-shadow-md" aria-hidden="true" />
                    )}
                    <span className="line-clamp-2">{categoria.nombre}</span>
                  </span>
                </Button>
              )
            })}
          </nav>

          {/* Nav vertical de categorías (≥md): lateral como siempre */}
          <nav
            aria-label="Categorías"
            className="hidden w-40 shrink-0 flex-col gap-2 overflow-y-auto border-r-2 border-amber-200 bg-amber-100/60 p-3 md:flex sm:w-48"
          >
            {categorias.map((categoria) => {
              const activa = categoria.id === categoriaActiva?.id
              return (
                <Button
                  key={categoria.id}
                  type="button"
                  variant="default"
                  onClick={() => seleccionarCategoria(categoria)}
                  aria-pressed={activa}
                  className={cn(
                    'relative h-auto min-h-14 shrink-0 rounded-xl px-2 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:brightness-110 active:scale-95 sm:text-base',
                    activa && 'ring-4 ring-black/50',
                  )}
                  style={{ backgroundColor: normalizeColorHex(categoria.colorHex) }}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {activa && (
                      <Check className="size-4 shrink-0 drop-shadow-md" aria-hidden="true" />
                    )}
                    <span className="line-clamp-2">{categoria.nombre}</span>
                  </span>
                </Button>
              )
            })}
          </nav>

          <section className="flex min-w-0 flex-1 flex-col">
            {items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                  <LayoutGrid className="size-10 text-amber-400" aria-hidden="true" />
                  <p className="text-lg font-bold text-slate-700">
                    No hay pictogramas en esta categoría
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
                <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
                  {items.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="default"
                      onClick={() => agregarPalabra(item.textoHablado)}
                      aria-label={`Agregar ${item.textoHablado} a la frase`}
                      className="flex min-h-[120px] min-w-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/70 bg-white p-2 text-slate-800 shadow-sm transition-transform hover:bg-white hover:shadow-md active:scale-95"
                    >
                      <ThumbPictograma
                        src={imagenUrlDeItem(item)}
                        alt={item.textoHablado}
                        className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                      />
                      <span className="line-clamp-3 min-w-0 break-words text-center text-lg font-bold leading-tight sm:text-xl">
                        {item.textoHablado}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

/**
 * Pantalla de error amigable del modo de uso (KU-4: sin jerga técnica):
 * mensaje simple + reintentar opcional + botón Volver.
 */
function PantallaError({
  mensaje,
  onReintentar,
  volverA,
}: {
  mensaje: string
  onReintentar?: () => void
  volverA: string
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-amber-50 p-6 text-center">
      <Frown className="size-12 text-amber-500" aria-hidden="true" />
      <p className="text-xl font-bold text-slate-800">{mensaje}</p>
      <p className="text-base text-slate-600">Revisá la conexión y probá de nuevo.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {onReintentar && (
          <Button variant="outline" onClick={onReintentar}>
            Reintentar
          </Button>
        )}
        <Button asChild>
          <Link to={volverA}>Volver</Link>
        </Button>
      </div>
    </div>
  )
}