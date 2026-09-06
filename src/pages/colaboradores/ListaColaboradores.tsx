import { Plus, Trash2, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
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
import { CardVacio, ErrorCarga, FilasSkeleton } from '../../components/estados'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'
import { useColaboradores, useEliminarColaborador } from '../../hooks/colaboradores'
import { usePaciente } from '../../hooks/pacientes'
import { useAuth } from '../../hooks/useAuth'
import { iniciales, nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import type { Colaborador } from '../../types'

/**
 * Lista de colaboradores de un paciente (/pacientes/:pacienteId/colaboradores, RI-9).
 * Header con nombre del paciente, botón «Agregar colaborador», cards con
 * avatar + nombre + email + badge permiso + vinculadoEn. Eliminar con
 * confirmación (RI-11). SOLO TERAPEUTA.
 */
export function ListaColaboradores() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const { usuario } = useAuth()
  const esTerapeuta = usuario?.rol === 'TERAPEUTA'
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  const colaboradoresQuery = useColaboradores(idValido ? id : undefined, esTerapeuta)
  const eliminar = useEliminarColaborador()
  const [aEliminar, setAEliminar] = useState<Colaborador | null>(null)

  // Guard de rol a nivel de página: un FAMILIAR jamás ve la gestión de
  // colaboradores (RI-9) — se lo redirige a su dashboard (/familiar).
  if (!esTerapeuta) {
    return <Navigate to="/familiar" replace />
  }

  const confirmarEliminar = async () => {
    if (!aEliminar || !idValido) return
    try {
      await eliminar.mutateAsync({ pacienteId: id, usuarioId: aEliminar.usuarioId })
      setAEliminar(null)
    } catch {
      // El error ya se muestra como toast desde useEliminarColaborador.
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
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Colaboradores</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Personas que colaboran en el cuidado y la comunicación de este paciente.
          </p>
        </div>
        {idValido && (
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link to={`/pacientes/${id}/colaboradores/agregar`}>
              <Plus aria-hidden="true" />
              Agregar colaborador
            </Link>
          </Button>
        )}
      </div>

      {colaboradoresQuery.isPending && <FilasSkeleton />}

      {colaboradoresQuery.isError && (
        <ErrorCarga
          mensaje={formatError(colaboradoresQuery.error)}
          onReintentar={() => void colaboradoresQuery.refetch()}
        />
      )}

      {colaboradoresQuery.isSuccess && colaboradoresQuery.data.length === 0 && (
        <CardVacio
          icono={<UsersRound className="size-5" aria-hidden="true" />}
          titulo="Sin colaboradores"
          descripcion="Todavía no se agregaron colaboradores para este paciente."
        >
          {idValido && (
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
              <Link to={`/pacientes/${id}/colaboradores/agregar`}>
                <Plus aria-hidden="true" />
                Agregar colaborador
              </Link>
            </Button>
          )}
        </CardVacio>
      )}

      {colaboradoresQuery.isSuccess && colaboradoresQuery.data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {colaboradoresQuery.data.map((colaborador) => (
            <Card key={colaborador.usuarioId} className="shadow-sm">
              <CardContent className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-sm font-semibold text-blue-700">
                  {iniciales(colaborador.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {colaborador.nombre}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{colaborador.email}</p>
                  <Badge variant="secondary" className="mt-1.5">
                    {colaborador.permiso === 'EDICION_LIMITADA' ? 'Edición limitada' : 'Solo lectura'}
                  </Badge>
                </div>
                <AlertDialog
                  open={aEliminar?.usuarioId === colaborador.usuarioId}
                  onOpenChange={(abierto) => {
                    if (!abierto) setAEliminar(null)
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Eliminar a ${colaborador.nombre}`}
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setAEliminar(colaborador)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se quitará a «{colaborador.nombre}» del acceso a este paciente. Esta acción
                        no se puede deshacer.
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
