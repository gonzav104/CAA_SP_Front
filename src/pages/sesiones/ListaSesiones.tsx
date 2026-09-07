import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
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
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { CardVacio, ErrorCarga, FilasSkeleton } from '../../components/estados'
import { useEliminarSesion, useSesiones } from '../../hooks/sesiones'
import { usePaciente } from '../../hooks/pacientes'
import { useAuth } from '../../hooks/useAuth'
import { formatearFechaISO, nombreCompleto } from '../../lib/paciente'
import { cn, formatError } from '../../lib/utils'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'
import type { Sesion } from '../../types'

/**
 * Lista de sesiones de un paciente en su propia página (/pacientes/:pacienteId/sesiones,
 * RI-6). Header con nombre del paciente, botón «Nueva sesión», cards con
 * fechaHora + disposicion + objetivos. Acciones Editar (link a /editar) y
 * Eliminar con confirmación (RI-8) — PUT/DELETE contra /sesiones/{id}.
 *
 * SOLO TERAPEUTA (las rutas de sesiones son inaccesibles para FAMILIAR).
 */
export function ListaSesiones() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const { usuario } = useAuth()
  const esTerapeuta = usuario?.rol === 'TERAPEUTA'
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  const sesionesQuery = useSesiones(idValido ? id : undefined, esTerapeuta)
  const eliminar = useEliminarSesion()
  // Por sesión: si el detalle está expandido (ver texto completo).
  const [expandidas, setExpandidas] = useState<Record<string, boolean>>({})
  const [aEliminar, setAEliminar] = useState<Sesion | null>(null)

  const toggleExpandida = (sesionId: string) =>
    setExpandidas((prev) => ({ ...prev, [sesionId]: !prev[sesionId] }))

  const confirmarEliminar = async () => {
    if (!aEliminar || !idValido) return
    try {
      await eliminar.mutateAsync({ pacienteId: id, sesionId: aEliminar.id })
      setAEliminar(null)
    } catch {
      // El error ya se muestra como toast desde useEliminarSesion.
    }
  }

  // Guard de rol a nivel de página: un FAMILIAR jamás ve la gestión de
  // sesiones (RI-6) — se lo redirige a su dashboard (/familiar).
  if (!esTerapeuta) {
    return <Navigate to="/familiar" replace />
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
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Sesiones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registros de sesiones de trabajo con el paciente.
          </p>
        </div>
        {idValido && (
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link to={`/pacientes/${id}/sesiones/nuevo`}>
              <Plus aria-hidden="true" />
              Nueva sesión
            </Link>
          </Button>
        )}
      </div>

      {sesionesQuery.isPending && <FilasSkeleton />}

      {sesionesQuery.isError && (
        <ErrorCarga
          mensaje={formatError(sesionesQuery.error)}
          onReintentar={() => void sesionesQuery.refetch()}
        />
      )}

      {sesionesQuery.isSuccess && sesionesQuery.data.length === 0 && (
        <CardVacio
          icono={<CalendarDays className="size-5" aria-hidden="true" />}
          titulo="Sin sesiones"
          descripcion="Todavía no se registraron sesiones para este paciente."
        >
          {idValido && (
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
              <Link to={`/pacientes/${id}/sesiones/nuevo`}>
                <Plus aria-hidden="true" />
                Nueva sesión
              </Link>
            </Button>
          )}
        </CardVacio>
      )}

      {sesionesQuery.isSuccess && sesionesQuery.data.length > 0 && (
        <div className="flex flex-col gap-3">
          {sesionesQuery.data.map((sesion) => (
            <Card key={sesion.id} className="shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatearFechaISO(sesion.fechaHora)}
                  </p>
                  {sesion.objetivosTrabajados && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {sesion.objetivosTrabajados}
                    </p>
                  )}
                  {(sesion.observaciones || sesion.estrategiasYProximosPasos) && (
                    <div className="mt-1">
                      <p
                        className={cn(
                          'text-xs text-muted-foreground',
                          !expandidas[sesion.id] && 'line-clamp-2',
                        )}
                      >
                        {[sesion.observaciones, sesion.estrategiasYProximosPasos]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleExpandida(sesion.id)}
                        className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {expandidas[sesion.id] ? 'Ver menos' : 'Ver más'}
                      </button>
                    </div>
                  )}
                </div>
                {sesion.disposicion && (
                  <Badge variant="secondary" className="shrink-0">
                    {sesion.disposicion}
                  </Badge>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar sesión del ${formatearFechaISO(sesion.fechaHora)}`}
                  >
                    <Link to={`/pacientes/${id}/sesiones/${sesion.id}/editar`}>
                      <Pencil aria-hidden="true" />
                    </Link>
                  </Button>
                  <AlertDialog
                    open={aEliminar?.id === sesion.id}
                    onOpenChange={(abierto) => {
                      if (!abierto) setAEliminar(null)
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Eliminar sesión del ${formatearFechaISO(sesion.fechaHora)}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setAEliminar(sesion)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará la sesión del {formatearFechaISO(sesion.fechaHora)}. Esta
                          acción no se puede deshacer.
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
