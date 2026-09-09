import { MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Skeleton } from '../../components/ui/skeleton'
import { useEliminarPaciente, usePacientes } from '../../hooks/pacientes'
import { useAuth } from '../../hooks/useAuth'
import {
  calcularEdad,
  formatearFechaISO,
  iniciales,
  nombreCompleto,
} from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import type { Paciente } from '../../types'
import { CardVacio, ErrorCarga } from '../../components/estados'

/** Encabezado de la lista con el CTA «Nuevo paciente» (página propia /pacientes/nuevo). */
function ListaHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pacientes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrá pacientes, cartillas, sesiones y colaboradores.
        </p>
      </div>
      <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
        <Link to="/pacientes/nuevo">
          <Plus aria-hidden="true" />
          Nuevo paciente
        </Link>
      </Button>
    </div>
  )
}

/** Skeleton de la grilla mientras carga GET /api/pacientes. */
function ListaSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }, (_, indice) => (
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
    </div>
  )
}

/** Card de la grilla: clickeable al detalle + menú de acciones (Editar/Eliminar). */
function CardPaciente({
  paciente,
  onEliminar,
}: {
  paciente: Paciente
  onEliminar: (paciente: Paciente) => void
}) {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esTerapeuta = usuario?.rol === 'TERAPEUTA'
  const nombre = nombreCompleto(paciente)
  const edad = calcularEdad(paciente.fechaNacimiento)
  // Gestión de pacientes: SOLO terapeutas (un FAMILIAR jamás edita/elimina,
  // aunque tenga miPermiso de edición — RI-2).
  const puedeEditar = esTerapeuta && paciente.miPermiso === 'EDICION_LIMITADA'

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-3">
        <Link
          to={`/pacientes/${paciente.id}/cartillas`}
          aria-label={`Ver cartillas de ${nombre}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-sm font-semibold text-blue-700">
            {iniciales(nombre)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">{nombre}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {edad !== null && `Edad: ${edad} ${edad === 1 ? 'año' : 'años'} · `}
              Nacimiento: {formatearFechaISO(paciente.fechaNacimiento)}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="block truncate text-xs text-muted-foreground">
                Paciente desde {formatearFechaISO(paciente.creadoEn)}
              </span>
            </span>
          </span>
        </Link>

        {/* Sin permiso de edición → sin acciones de gestión (RI-5). */}
        {puedeEditar && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${nombre}`}>
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => navigate(`/pacientes/${paciente.id}/editar`)}>
                <Pencil aria-hidden="true" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onEliminar(paciente)}>
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

/**
 * Lista de pacientes (PM-1): estados de carga (skeleton), error (con reintento)
 * y vacío (con CTA). La eliminación se confirma con AlertDialog.
 */
export function ListaPacientes() {
  const pacientes = usePacientes()
  const eliminar = useEliminarPaciente()
  const [aEliminar, setAEliminar] = useState<Paciente | null>(null)

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    try {
      await eliminar.mutateAsync(aEliminar.id)
      setAEliminar(null)
    } catch {
      // El error ya se muestra como toast desde useEliminarPaciente.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ListaHeader />

      {pacientes.isPending && <ListaSkeleton />}

      {pacientes.isError && (
        <ErrorCarga
          mensaje={formatError(pacientes.error)}
          onReintentar={() => void pacientes.refetch()}
        />
      )}

      {pacientes.isSuccess && pacientes.data.length === 0 && (
        <CardVacio
          icono={<Users className="size-5" aria-hidden="true" />}
          titulo="Todavía no hay pacientes"
          descripcion="Creá el primer paciente para empezar a armar cartillas y sesiones."
        >
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/pacientes/nuevo">
              <Plus aria-hidden="true" />
              Nuevo paciente
            </Link>
          </Button>
        </CardVacio>
      )}

      {pacientes.isSuccess && pacientes.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pacientes.data.map((paciente) => (
            <CardPaciente key={paciente.id} paciente={paciente} onEliminar={setAEliminar} />
          ))}
        </div>
      )}

      <AlertDialog
        open={aEliminar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setAEliminar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              {aEliminar
                ? `Se eliminará «${nombreCompleto(aEliminar)}» y todos sus datos. Esta acción no se puede deshacer.`
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