import { Check, Loader2, Pencil, Search, SearchX, TriangleAlert } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ThumbPictograma } from '../../components/ThumbPictograma'
import { Button } from '../../components/ui/button'
import { Field, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Skeleton } from '../../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useBuscarArasaac } from '../../hooks/arasaac'
import { usePictogramasGlobales } from '../../hooks/cartillas'
import { usePictogramasCustom } from '../../hooks/pictogramas-custom'
import { useMaterializarPictogramaGlobal } from '../../hooks/pictogramas-globales'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { mapearResultadoArasaac, type ResultadoArasaac } from '../../lib/arasaac'
import { decidirConfirmacion, type SeleccionPendiente } from '../../lib/seleccionPictograma'
import { cn } from '../../lib/utils'
import type { Pictograma, PictogramaCustom } from '../../types'

/**
 * SeleccionPictograma (obs #85, Decisiones 1-3): panel NO modal para elegir el
 * pictograma de un item del editor. Se monta EN EL LUGAR dentro del `<form>`
 * de `FormItemInline` (nunca en un Portal — para un panel no-modal la
 * posición en el DOM ES el orden de tabulación). El trigger que lo abre
 * permanece montado; `FormItemInline` restaura el foco ahí en cada cierre.
 *
 * Lo que Radix `Dialog` daba gratis y este panel repone a mano (tabla
 * exhaustiva en obs #85, Decisión 2):
 *  - foco al abrir → efecto de montaje sobre `inputArasaacRef`.
 *  - Esc cierra → `onKeyDown` en la raíz, no-op mientras materializa.
 *  - restaurar foco al cerrar → hand-written en el padre (`FormItemInline`),
 *    vía los props `onAbiertoChange`/`onConfirmar` (sin cambios de forma).
 *  - nombre/descripción accesibles → `role="group"` + `aria-labelledby` +
 *    `aria-describedby`, en vez de `DialogTitle`/`DialogDescription`.
 *
 * Lo que Radix `Dialog` daba gratis y este panel DELIBERADAMENTE no repone
 * (obs #85, Decisión 2 — un panel no-modal no debe simularlos):
 *  - trap de foco, `aria-modal`, fondo inerte.
 *  - cierre por click en overlay/X (Cancelar es el único cierre-sin-aplicar).
 *
 * Defectos NUEVOS que introduce este punto de montaje (obs #85, Decisión 1,
 * consecuencias) y que este mismo archivo/`FormItemInline` neutralizan:
 *  1. Los `<input>` del panel ahora son descendientes del `<form>` del padre
 *     → Enter los enviaría. Guard: `onKeyDown` bloquea Enter sobre un
 *     `<input>` con `preventDefault`.
 *  2. Confirmar sostiene el foco durante el POST de materialize → NO puede
 *     ser `disabled` (perdería el foco al fondo del documento). Usa
 *     `aria-disabled`+`aria-busy` y el guard ya existente en `confirmar()`.
 *  3. Guardar el item con selección pendiente la descartaría en silencio →
 *     el submit lock vive en `FormItemInline`, no acá.
 *
 * Flujo confirm-first (sin cambios): click en un tile marca una selección
 * PENDIENTE (estado local; el panel NO se cierra); «Confirmar» aplica y
 * cierra; Esc/Cancelar descartan sin aplicar. La materialización ARASAAC
 * ocurre al Confirmar, no al click del tile.
 *
 * Tabs (comportamiento sin cambios):
 *  1. Buscar en ARASAAC (default): Input + useDebouncedValue 250ms +
 *     useBuscarArasaac (API pública, cliente SIN cookie). Click en un
 *     resultado lo marca pendiente; al Confirmar:
 *       - si su arasaacId YA está en «Globales guardados» → se aplica el
 *         mismo UUID (instante, sin mutation — decidirConfirmacion);
 *       - si no → useMaterializarPictogramaGlobal (POST idempotente por
 *         arasaac_id unique) → se aplica el UUID nuevo + invalidate.
 *  2. Globales guardados: grilla radiogroup (role=radio + aria-checked).
 *     Elegir un global limpia el custom.
 *  3. Custom del paciente: grilla radiogroup; elegir un custom limpia el
 *     global.
 *
 * Selección mutuamente excluyente global/custom (RI-18, schemas.ts, sin
 * cambios); el padre (`FormItemInline`) aplica la elección con
 * `form.setValue` al confirmar.
 */

/** Valor actual del form del padre (para pintar la selección vigente). */
export interface SeleccionPictogramaValor {
  recursoGlobalId?: string
  recursoCustomId?: string
}

/** Elección final: a lo sumo UNA de las dos idas (global o custom). */
export interface PictogramaElegido {
  globalId?: string
  customId?: string
}

/* ------------------------------ Piezas internas ------------------------------ */

/** Tile de la grilla radiogroup: imagen + etiqueta con estados idle/aplicado/pendiente. */
function TilePictograma({
  imagenUrl,
  etiqueta,
  aplicado,
  pendiente,
  deshabilitado,
  onSeleccionar,
}: {
  imagenUrl: string
  etiqueta: string
  /** El valor VIGENTE del form (selección actual del item en este open). */
  aplicado: boolean
  /** Selección PENDIENTE del usuario en este open (el radio elegido). */
  pendiente: boolean
  deshabilitado?: boolean
  onSeleccionar: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={pendiente}
      title={etiqueta}
      disabled={deshabilitado}
      onClick={onSeleccionar}
      aria-label={aplicado && !pendiente ? `${etiqueta} — Selección actual` : etiqueta}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-lg border p-2 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50 disabled:opacity-60',
        pendiente
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : aplicado
            ? 'border-ring/40 ring-1 ring-ring'
            : 'border-border hover:border-muted-foreground/40',
      )}
    >
      {pendiente ? (
        <span className="absolute right-1.5 top-1.5 flex items-center rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground">
          <Pencil className="size-3" aria-hidden="true" />
        </span>
      ) : aplicado ? (
        <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-ring px-1.5 text-xs text-ring-foreground">
          <Check className="size-3" aria-hidden="true" />
          Actual
        </span>
      ) : null}
      <ThumbPictograma src={imagenUrl} alt={etiqueta} className="size-20" />
      <span className="min-h-8 w-full break-words text-center text-xs text-muted-foreground line-clamp-2">
        {etiqueta}
      </span>
    </button>
  )
}

/** Esqueleto de la grilla mientras cargan datos (tabs y búsqueda ARASAAC). */
function GrillaSkeleton({ cantidad = 10 }: { cantidad?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: cantidad }, (_, indice) => (
        <div
          key={indice}
          className="flex flex-col items-center gap-1 rounded-lg border border-border p-2"
        >
          <Skeleton className="size-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}

/** Aviso centrado (vacío o error) dentro de un tab. */
function AvisoTab({ icono, mensaje }: { icono: ReactNode; mensaje: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icono}
      </span>
      <p className="max-w-64 text-sm text-muted-foreground">{mensaje}</p>
    </div>
  )
}

/* ------------------------------ Componente ------------------------------ */

export function SeleccionPictograma({
  // `abierto` ya no se lee acá: el padre monta este componente condicional
  // por apertura (ver comentario "Montaje condicional" en FormItemInline), lo
  // que reemplaza al `open` que consumía el `Dialog`. Se mantiene en la firma
  // pública sin cambios de nombre/forma (obs #85 — props frozen del container
  // swap) para que revertir esta migración, si hiciera falta, sea mecánico.
  abierto: _abierto,
  onAbiertoChange,
  pacienteId,
  valor,
  onConfirmar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  /** Necesario para la lista de pictogramas custom del paciente (tab 3). */
  pacienteId: string
  valor: SeleccionPictogramaValor
  /** Se llama SOLO al confirmar — el click en un tile solo marca pendiente. */
  onConfirmar: (pictograma: PictogramaElegido) => void
}) {
  const pictogramasQuery = usePictogramasGlobales()
  const pictogramasCustomQuery = usePictogramasCustom(pacienteId)
  const materializar = useMaterializarPictogramaGlobal()

  // Estado local: el padre monta este componente por apertura (condicional),
  // así cada vez que se abre arranca limpio — tab ARASAAC, término vacío, sin
  // selección pendiente ni materialización en curso. Sin reset por efecto.
  const [tabActivo, setTabActivo] = useState('arasaac')
  const [termino, setTermino] = useState('')
  const terminoDebounced = useDebouncedValue(termino, 250)
  const [materializandoArasaacId, setMaterializandoArasaacId] = useState<number | null>(null)
  // Selección PENDIENTE (confirm-first): el click en un tile solo la marca;
  // el panel NO se cierra hasta «Confirmar». Esc/Cancelar descartan (unmount).
  const [pendiente, setPendiente] = useState<SeleccionPendiente | null>(null)
  // Foco al abrir (obs #85, Decisión 2): montaje condicional por apertura →
  // un efecto de montaje equivale a "cada vez que se abre", sin onOpenAutoFocus.
  const inputArasaacRef = useRef<HTMLInputElement>(null)
  // Filtro local del tab «Globales guardados»: solo client-side sobre los
  // pictogramas ya materializados; no toca ARASAAC.
  const [filtroGlobales, setFiltroGlobales] = useState('')
  const filtroGlobalesDebounced = useDebouncedValue(filtroGlobales, 250)

  const idTitulo = useId()
  const idDescripcion = useId()

  const buscarArasaac = useBuscarArasaac(terminoDebounced)

  const pictogramas: Pictograma[] = pictogramasQuery.data ?? []
  const pictogramasCustom: PictogramaCustom[] = pictogramasCustomQuery.data ?? []

  // Filtro local sobre los globales guardados (client-side, sin red).
  const terminoFiltro = filtroGlobalesDebounced.trim().toLowerCase()
  const pictogramasFiltrados = pictogramas.filter((pictograma) =>
    pictograma.etiqueta.toLowerCase().includes(terminoFiltro),
  )

  // Resultados ARASAAC mapeados y filtrados (los `_id` inválidos → null).
  const resultados = (buscarArasaac.data ?? [])
    .map(mapearResultadoArasaac)
    .filter((resultado): resultado is ResultadoArasaac => resultado !== null)

  /** Marcar pendiente: SOLO setState — el panel sigue abierto hasta Confirmar. */
  const marcarPendienteGlobal = (globalId: string) =>
    setPendiente({ tipo: 'global', globalId })

  /** Marcar pendiente: SOLO setState — el panel sigue abierto hasta Confirmar. */
  const marcarPendienteCustom = (customId: string) =>
    setPendiente({ tipo: 'custom', customId })

  /** Marcar pendiente: SOLO setState; la materialización ocurre en confirmar(). */
  const marcarPendienteArasaac = (resultado: ResultadoArasaac) =>
    setPendiente({ tipo: 'arasaac', resultado })

  const materializando = materializandoArasaacId !== null

  /**
   * Confirmar: decide aplicar-vs-materializar sobre la selección pendiente.
   * - aplicar (global/custom/ARASAAC ya materializado) → onConfirmar + cerrar.
   * - materializar (ARASAAC nuevo) → POST con overlay; al éxito, onConfirmar
   *   con el UUID nuevo + cerrar; al error, toast del hook y el pendiente
   *   queda INTACTO (reintentar o cancelar).
   *
   * Este guard (`if (!pendiente || materializando) return`) es también el
   * guard de click que reemplaza a `disabled` en el botón Confirmar durante
   * el POST en vuelo (obs #85, Decisión 2, defecto nuevo #2): el botón queda
   * `aria-disabled` pero clickeable a nivel DOM, y este guard absorbe el
   * click sin efecto.
   */
  const confirmar = async () => {
    if (!pendiente || materializando) return
    const desicion = decidirConfirmacion(pendiente, pictogramas)
    if (desicion.tipo === 'aplicar') {
      onConfirmar(desicion.elegido)
      onAbiertoChange(false)
      return
    }
    setMaterializandoArasaacId(desicion.arasaacId)
    try {
      const pictograma = await materializar.mutateAsync({
        arasaacId: desicion.arasaacId,
        etiqueta: desicion.etiqueta,
      })
      onConfirmar({ globalId: pictograma.id })
      // Cierre programático post-materialización: va DIRECTO por la prop —
      // no hay guard de cierre externo que bloquear (el panel no tiene
      // overlay/X; solo Cancelar, que ya queda `disabled` durante el POST).
      onAbiertoChange(false)
    } catch {
      // El error ya se muestra como toast desde useMaterializarPictogramaGlobal;
      // el panel queda abierto y el pendiente intacto (reintentar o cancelar).
    } finally {
      setMaterializandoArasaacId(null)
    }
  }

  /**
   * Guard de teclado en la raíz del panel (obs #85, Decisión 1, defecto
   * nuevo #1): Enter sobre un `<input>` del panel NO debe enviar el `<form>`
   * del padre (el panel ahora vive dentro de ese `<form>`, defecto nuevo del
   * punto de montaje) → se bloquea con `preventDefault`. El manejo de Esc
   * (Decisión 2, tabla de foco) llega en un commit posterior de la misma PR
   * — es hardening, no parte del bundle de seguridad atómico de este commit.
   */
  const onKeyDownPanel = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault()
    }
  }

  const grillaGlobales = (
    <ScrollArea className="h-[min(60dvh,24rem)] pr-3">
      <div
        role="radiogroup"
        aria-label="Pictogramas globales"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {pictogramasFiltrados.map((pictograma) => (
          <TilePictograma
            key={pictograma.id}
            imagenUrl={pictograma.imagenUrl}
            etiqueta={pictograma.etiqueta}
            aplicado={valor.recursoGlobalId === pictograma.id}
            pendiente={pendiente?.tipo === 'global' && pendiente.globalId === pictograma.id}
            onSeleccionar={() => marcarPendienteGlobal(pictograma.id)}
          />
        ))}
      </div>
    </ScrollArea>
  )

  const grillaCustoms = (
    <ScrollArea className="h-[min(60dvh,24rem)] pr-3">
      <div
        role="radiogroup"
        aria-label="Pictogramas del paciente"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {pictogramasCustom.map((pictograma) => (
          <TilePictograma
            key={pictograma.id}
            imagenUrl={pictograma.imagenUrl}
            etiqueta={pictograma.etiqueta}
            aplicado={valor.recursoCustomId === pictograma.id}
            pendiente={pendiente?.tipo === 'custom' && pendiente.customId === pictograma.id}
            onSeleccionar={() => marcarPendienteCustom(pictograma.id)}
          />
        ))}
      </div>
    </ScrollArea>
  )

  const contenidoArasaac = (() => {
    if (terminoDebounced.trim().length < 2) {
      return (
        <AvisoTab
          icono={<Search className="size-5" aria-hidden="true" />}
          mensaje="Escribí al menos 2 caracteres para buscar en el catálogo ARASAAC."
        />
      )
    }
    if (buscarArasaac.isPending) {
      return <GrillaSkeleton />
    }
    if (buscarArasaac.isError) {
      return (
        <AvisoTab
          icono={<TriangleAlert className="size-5" aria-hidden="true" />}
          mensaje="No se pudo buscar en ARASAAC. Revisá la conexión o usá los pictogramas globales de la segunda pestaña."
        />
      )
    }
    if (resultados.length === 0) {
      return (
        <AvisoTab
          icono={<SearchX className="size-5" aria-hidden="true" />}
          mensaje={`Sin resultados para «${terminoDebounced.trim()}». Probá con otra palabra.`}
        />
      )
    }
    return (
      <ScrollArea className="h-[min(60dvh,24rem)] pr-3">
        <div
          role="radiogroup"
          aria-label="Resultados de ARASAAC"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {resultados.map((resultado) => (
            <TilePictograma
              key={resultado.arasaacId}
              imagenUrl={resultado.imagenUrl}
              etiqueta={resultado.etiqueta}
              aplicado={
                valor.recursoGlobalId !== undefined &&
                pictogramas.some(
                  (pictograma) =>
                    pictograma.arasaacId === resultado.arasaacId &&
                    pictograma.id === valor.recursoGlobalId,
                )
              }
              pendiente={
                pendiente?.tipo === 'arasaac' &&
                pendiente.resultado.arasaacId === resultado.arasaacId
              }
              deshabilitado={materializando}
              onSeleccionar={() => marcarPendienteArasaac(resultado)}
            />
          ))}
        </div>
      </ScrollArea>
    )
  })()

  return (
    <section
      role="group"
      aria-labelledby={idTitulo}
      aria-describedby={idDescripcion}
      onKeyDown={onKeyDownPanel}
      className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 shadow-sm"
    >
      <div>
        <h3 id={idTitulo} className="text-base font-semibold">
          Seleccionar pictograma
        </h3>
        <p id={idDescripcion} className="text-sm text-muted-foreground">
          Buscá en el catálogo ARASAAC, usá un global guardado o un pictograma del paciente.
          Si materializás uno de ARASAAC, queda disponible en «Globales guardados».
        </p>
      </div>

      <Tabs value={tabActivo} onValueChange={setTabActivo} className="flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="arasaac">Buscar en ARASAAC</TabsTrigger>
          <TabsTrigger value="globales">
            Globales ({pictogramas.length})
          </TabsTrigger>
          <TabsTrigger value="custom">Custom del paciente</TabsTrigger>
        </TabsList>

        <TabsContent value="globales" className="flex flex-col gap-4 pt-4">
          {pictogramasQuery.isPending ? (
            <GrillaSkeleton />
          ) : pictogramasQuery.isError ? (
            <AvisoTab
              icono={<TriangleAlert className="size-5" aria-hidden="true" />}
              mensaje="No se pudieron cargar los pictogramas globales."
            />
          ) : pictogramas.length === 0 ? (
            <AvisoTab
              icono={<SearchX className="size-5" aria-hidden="true" />}
              mensaje="No hay pictogramas globales guardados todavía."
            />
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="busqueda-globales">Buscar en guardados</FieldLabel>
                <Input
                  id="busqueda-globales"
                  value={filtroGlobales}
                  onChange={(event) => setFiltroGlobales(event.target.value)}
                  placeholder="p.ej. agua, mamá…"
                  autoComplete="off"
                />
              </Field>
              {terminoFiltro !== '' && pictogramasFiltrados.length === 0 ? (
                <AvisoTab
                  icono={<SearchX className="size-5" aria-hidden="true" />}
                  mensaje={`Sin coincidencias para «${terminoFiltro}».`}
                />
              ) : (
                grillaGlobales
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="arasaac" className="flex flex-col gap-4 pt-4">
          <Field>
            <FieldLabel htmlFor="busqueda-arasaac">Buscar en ARASAAC</FieldLabel>
            <Input
              ref={inputArasaacRef}
              id="busqueda-arasaac"
              value={termino}
              onChange={(event) => setTermino(event.target.value)}
              placeholder="p.ej. pelota, agua, mamá…"
              autoComplete="off"
            />
          </Field>
          <div className="relative">
            {contenidoArasaac}
            {materializando && (
              <div
                role="status"
                className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80"
              >
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  Guardando en globales…
                </span>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="flex flex-col gap-4 pt-4">
          {pictogramasCustomQuery.isPending ? (
            <GrillaSkeleton />
          ) : pictogramasCustomQuery.isError ? (
            <AvisoTab
              icono={<TriangleAlert className="size-5" aria-hidden="true" />}
              mensaje="No se pudieron cargar los pictogramas del paciente."
            />
          ) : pictogramasCustom.length === 0 ? (
            <AvisoTab
              icono={<SearchX className="size-5" aria-hidden="true" />}
              mensaje="Este paciente no tiene pictogramas custom."
            />
          ) : (
            grillaCustoms
          )}
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={materializando}
          onClick={() => onAbiertoChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={pendiente === null}
          aria-disabled={materializando || undefined}
          aria-busy={materializando || undefined}
          onClick={() => void confirmar()}
        >
          Confirmar
        </Button>
      </div>
    </section>
  )
}
