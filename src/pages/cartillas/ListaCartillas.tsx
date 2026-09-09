import { LayoutGrid, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CardVacio, ErrorCarga } from '../../components/estados'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Skeleton } from '../../components/ui/skeleton'
import { useCartillas, useCrearCartilla, useEliminarCartilla } from '../../hooks/cartillas'
import { useAuth } from '../../hooks/useAuth'
import { usePaciente } from '../../hooks/pacientes'
import { formatearFechaISO, nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import type { Cartilla } from '../../types'
import { DialogoNuevaCartilla } from './dialogos'
import { toCartillaInput, type CartillaValues } from './schemas'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'

/**
 * Lista de cartillas del paciente (/pacientes/:pacienteId/cartillas, T8).
 * - Carga con skeleton; error con reintento; vacío con CTA.
 * - «Nueva cartilla» abre un Dialog de 2 campos (regla AGENTS.md) y al crear
 *   navega al editor de la cartilla nueva para cargarle categorías.
 * - El menú Editar/Eliminar de cada card está gateado por creadorId: un
 *   FAMILIAR (o un terapeuta ajeno) solo puede ver y abrir la cartilla.
 */

function ListadoSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, indice) => (
          <Card key={indice} className="shadow-sm">
            <CardContent className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/** Card de la grilla: clickeable a la vista de revisión + menú para el creador. */
function CardCartilla({
  cartilla,
  esCreador,
  onEliminar,
}: {
  cartilla: Cartilla
  esCreador: boolean
  onEliminar: (cartilla: Cartilla) => void
}) {
  const navigate = useNavigate()

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-3">
        <Link
          to={`/pacientes/${cartilla.pacienteId}/cartillas/${cartilla.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700">
            <LayoutGrid className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">
              {cartilla.nombre}
            </span>
            <span className="flex items-center gap-2">
              {cartilla.esPrincipal && (
                <Badge variant="outline" className="shrink-0">
                  Principal
                </Badge>
              )}
              <span className="block text-xs text-muted-foreground">
                Creada {formatearFechaISO(cartilla.creadoEn)}
              </span>
            </span>
          </span>
        </Link>

        {esCreador && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Acciones de ${cartilla.nombre}`}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() =>
                  navigate(`/pacientes/${cartilla.pacienteId}/cartillas/${cartilla.id}/editar`)
                }
              >
                <Pencil aria-hidden="true" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onEliminar(cartilla)}>
                <Trash2 aria-hidden="true" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  )
}

/** Lista de cartillas de un paciente (zona «Cartillas» del dashboard). */
export function ListaCartillas() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  const cartillasQuery = useCartillas(idValido ? id : undefined)
  const crear = useCrearCartilla()
  const eliminar = useEliminarCartilla()
  const [dialogoNueva, setDialogoNueva] = useState(false)
  const [aEliminar, setAEliminar] = useState<Cartilla | null>(null)

  if (!idValido) {
    return <ErrorCarga mensaje="Identificador de paciente inválido." volverA="/pacientes" />
  }

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    try {
      await eliminar.mutateAsync({ pacienteId: id, cartillaId: aEliminar.id })
      setAEliminar(null)
    } catch {
      // El error ya se muestra como toast desde useEliminarCartilla.
    }
  }

  const crearCartilla = async (values: CartillaValues) => {
    try {
      const cartilla = await crear.mutateAsync({ pacienteId: id, input: toCartillaInput(values) })
      navigate(`/pacientes/${id}/cartillas/${cartilla.id}/editar`)
    } catch {
      // El error ya se muestra como toast desde useCrearCartilla.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <LabelPacienteContexto
              cargando={pacienteQuery.isPending}
              nombre={pacienteQuery.data ? nombreCompleto(pacienteQuery.data) : undefined}
            />
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Cartillas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cartillas de comunicación del paciente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            {usuario?.rol === 'FAMILIAR' ? (
              <Link to="/familiar">Volver a mi familia</Link>
            ) : (
              <Link to="/pacientes">Volver a pacientes</Link>
            )}
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setDialogoNueva(true)}
          >
            <Plus aria-hidden="true" />
            Nueva cartilla
          </Button>
        </div>
      </div>

      {cartillasQuery.isPending && <ListadoSkeleton />}

      {cartillasQuery.isError && (
        <ErrorCarga
          mensaje={formatError(cartillasQuery.error)}
          onReintentar={() => void cartillasQuery.refetch()}
        />
      )}

      {cartillasQuery.isSuccess && cartillasQuery.data.length === 0 && (
        <CardVacio
          icono={<LayoutGrid className="size-5" aria-hidden="true" />}
          titulo="Sin cartillas"
          descripcion="Creá la primera cartilla de comunicación para este paciente."
        >
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setDialogoNueva(true)}
          >
            <Plus aria-hidden="true" />
            Nueva cartilla
          </Button>
        </CardVacio>
      )}

      {cartillasQuery.isSuccess && cartillasQuery.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cartillasQuery.data.map((cartilla) => (
            <CardCartilla
              key={cartilla.id}
              cartilla={cartilla}
              esCreador={usuario?.id === cartilla.creadorId}
              onEliminar={setAEliminar}
            />
          ))}
        </div>
      )}

      <DialogoNuevaCartilla
        abierto={dialogoNueva}
        onOpenChange={setDialogoNueva}
        submitting={crear.isPending}
        onSubmit={crearCartilla}
      />

      <AlertDialog
        open={aEliminar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setAEliminar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cartilla?</AlertDialogTitle>
            <AlertDialogDescription>
              {aEliminar
                ? `Se eliminará «${aEliminar.nombre}» y todas sus categorías e items. Esta acción no se puede deshacer.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={eliminar.isPending}
              onClick={(event) => {
                event.preventDefault()
                void confirmarEliminar()
              }}
            >
              {eliminar.isPending ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}