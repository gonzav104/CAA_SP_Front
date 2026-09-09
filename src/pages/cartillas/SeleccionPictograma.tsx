import { Loader2, Search, SearchX, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ThumbPictograma } from '../../components/ThumbPictograma'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
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
import { cn } from '../../lib/utils'
import type { Pictograma, PictogramaCustom } from '../../types'

/**
 * SeleccionPictograma (AD-2/AD-4): Dialog + Tabs para elegir el pictograma de
 * un item del editor. Es la selección de UN campo → permitido por AGENTS.md
 * (los forms multi-campo del editor son inline, no modal).
 *
 * Tabs:
 *  1. Globales guardados: grilla radiogroup (a11y role=radio + aria-checked,
 *     mismo patrón que DialogoFormItem). Elegir un global limpia el custom.
 *  2. Buscar en ARASAAC: Input + useDebouncedValue 250ms + useBuscarArasaac
 *     (API pública, cliente SIN cookie). Click en un resultado:
 *       - si su arasaacId YA está en "Globales guardados" → selección directa,
 *         sin mutation (instante, mismo UUID);
 *       - si no → useMaterializarPictogramaGlobal (POST al backend, idempotente
 *         por arasaac_id unique) → selección con el UUID nuevo + invalidate.
 *  3. Custom del paciente: grilla radiogroup; elegir un custom limpia el global.
 *
 * Selección mutuamente excluyente global/custom (RI-18, ya en schemas.ts); el
 * padre (FormItemInline) aplica la elección con form.setValue.
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

/** Tile de la grilla radiogroup: imagen + etiqueta, seleccionable. */
function TilePictograma({
  imagenUrl,
  etiqueta,
  seleccionado,
  deshabilitado,
  onSeleccionar,
}: {
  imagenUrl: string
  etiqueta: string
  seleccionado: boolean
  deshabilitado?: boolean
  onSeleccionar: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionado}
      title={etiqueta}
      disabled={deshabilitado}
      onClick={onSeleccionar}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
        seleccionado
          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
          : 'border-border hover:border-muted-foreground/40',
      )}
    >
      <ThumbPictograma src={imagenUrl} alt={etiqueta} className="size-16" />
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
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: cantidad }, (_, indice) => (
        <div
          key={indice}
          className="flex flex-col items-center gap-1 rounded-lg border border-border p-2"
        >
          <Skeleton className="size-16" />
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
  abierto,
  onAbiertoChange,
  pacienteId,
  valor,
  onSeleccionar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  /** Necesario para la lista de pictogramas custom del paciente (tab 3). */
  pacienteId: string
  valor: SeleccionPictogramaValor
  onSeleccionar: (pictograma: PictogramaElegido) => void
}) {
  const pictogramasQuery = usePictogramasGlobales()
  const pictogramasCustomQuery = usePictogramasCustom(pacienteId)
  const materializar = useMaterializarPictogramaGlobal()

  // Estado local de la búsqueda: el padre monta este componente por apertura
  // (condicional), así cada vez que se abre arranca limpio — tab Globales,
  // término vacío, sin materialización en curso. Sin reset por efecto.
  const [tabActivo, setTabActivo] = useState('globales')
  const [termino, setTermino] = useState('')
  const terminoDebounced = useDebouncedValue(termino, 250)
  const [materializandoArasaacId, setMaterializandoArasaacId] = useState<number | null>(null)
  // Filtro local del tab «Globales guardados»: solo client-side sobre los
  // pictogramas ya materializados; no toca ARASAAC.
  const [filtroGlobales, setFiltroGlobales] = useState('')
  const filtroGlobalesDebounced = useDebouncedValue(filtroGlobales, 250)

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

  /** Elegir un global: limpia el custom (exclusión mutua RI-18). */
  const seleccionarGlobal = (globalId: string) => {
    onSeleccionar({ globalId })
    onAbiertoChange(false)
  }

  /** Elegir un custom: limpia el global (exclusión mutua RI-18). */
  const seleccionarCustom = (customId: string) => {
    onSeleccionar({ customId })
    onAbiertoChange(false)
  }

  /**
   * Click en un resultado ARASAAC: si ya está materializado entre los globales
   * guardados → selección directa (sin red); si no → materializa (idempotente)
   * y selecciona el UUID resultante.
   */
  const seleccionarResultadoArasaac = async (resultado: ResultadoArasaac) => {
    const existente = pictogramas.find(
      (pictograma) => pictograma.arasaacId === resultado.arasaacId,
    )
    if (existente) {
      seleccionarGlobal(existente.id)
      return
    }

    setMaterializandoArasaacId(resultado.arasaacId)
    try {
      const pictograma = await materializar.mutateAsync({
        arasaacId: resultado.arasaacId,
        etiqueta: resultado.etiqueta,
      })
      seleccionarGlobal(pictograma.id)
    } catch {
      // El error ya se muestra como toast desde useMaterializarPictogramaGlobal;
      // no se selecciona nada y el resto del editor sigue funcionando.
    } finally {
      setMaterializandoArasaacId(null)
    }
  }

  const grillaGlobales = (
    <ScrollArea className="h-72 pr-3">
      <div
        role="radiogroup"
        aria-label="Pictogramas globales"
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {pictogramasFiltrados.map((pictograma) => (
          <TilePictograma
            key={pictograma.id}
            imagenUrl={pictograma.imagenUrl}
            etiqueta={pictograma.etiqueta}
            seleccionado={valor.recursoGlobalId === pictograma.id}
            onSeleccionar={() => seleccionarGlobal(pictograma.id)}
          />
        ))}
      </div>
    </ScrollArea>
  )

  const grillaCustoms = (
    <ScrollArea className="h-72 pr-3">
      <div
        role="radiogroup"
        aria-label="Pictogramas del paciente"
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {pictogramasCustom.map((pictograma) => (
          <TilePictograma
            key={pictograma.id}
            imagenUrl={pictograma.imagenUrl}
            etiqueta={pictograma.etiqueta}
            seleccionado={valor.recursoCustomId === pictograma.id}
            onSeleccionar={() => seleccionarCustom(pictograma.id)}
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
          mensaje="No se pudo buscar en ARASAAC. Revisá la conexión o usá los pictogramas globales de la primera pestaña."
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
      <ScrollArea className="h-72 pr-3">
        <div
          role="radiogroup"
          aria-label="Resultados de ARASAAC"
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          {resultados.map((resultado) => (
            <TilePictograma
              key={resultado.arasaacId}
              imagenUrl={resultado.imagenUrl}
              etiqueta={resultado.etiqueta}
              seleccionado={
                valor.recursoGlobalId !== undefined &&
                pictogramas.some(
                  (pictograma) =>
                    pictograma.arasaacId === resultado.arasaacId &&
                    pictograma.id === valor.recursoGlobalId,
                )
              }
              deshabilitado={materializandoArasaacId !== null}
              onSeleccionar={() => void seleccionarResultadoArasaac(resultado)}
            />
          ))}
        </div>
      </ScrollArea>
    )
  })()

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Seleccionar pictograma</DialogTitle>
          <DialogDescription>
            Global guardado, búsqueda en el catálogo ARASAAC o pictograma del paciente.
            Si materializás uno de ARASAAC, queda disponible en «Globales guardados».
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tabActivo} onValueChange={setTabActivo}>
          <TabsList className="w-full">
            <TabsTrigger value="globales">
              Globales ({pictogramas.length})
            </TabsTrigger>
            <TabsTrigger value="arasaac">Buscar en ARASAAC</TabsTrigger>
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
                id="busqueda-arasaac"
                value={termino}
                onChange={(event) => setTermino(event.target.value)}
                placeholder="p.ej. pelota, agua, mamá…"
                autoComplete="off"
              />
            </Field>
            {materializandoArasaacId !== null && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Guardando pictograma en globales…
              </p>
            )}
            {contenidoArasaac}
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
      </DialogContent>
    </Dialog>
  )
}