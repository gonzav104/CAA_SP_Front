import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
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
import { CardVacio, ErrorCarga, FilasSkeleton } from '../../components/estados'
import { useEliminarSesion, useSesiones } from '../../hooks/sesiones'
import { usePaciente } from '../../hooks/pacientes'
import { useAuth } from '../../hooks/useAuth'
import { formatearFechaISO, nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'
import type { Sesion } from '../../types'

/**
 * Lista de sesiones de un paciente en su propia página (/pacientes/:pacienteId/sesiones,
 * RI-6). Header con nombre del paciente, botón «Nueva sesión».
 *
 * Cada sesión se presenta como un Accordion (shadcn/ui):
 * - Colapsado: fecha/hora + resumen corto de objetivos (line-clamp-1).
 * - Expandido: disposición, objetivos completos, observaciones, estrategias y
 *   próximos pasos, más las acciones Editar (link a /editar) y Eliminar con
 *   confirmación (RI-8) — PUT/DELETE contra /sesiones/{id}.
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
  const [aEliminar, setAEliminar] = useState<Sesion | null>(null)

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
        <Accordion
          type="single"
          collapsible
          className="w-full overflow-hidden rounded-lg border bg-card shadow-sm"
        >
          {sesionesQuery.data.map((sesion) => (
            <AccordionItem key={sesion.id} value={sesion.id}>
              <AccordionTrigger className="gap-3 px-4 py-3 hover:bg-muted/50 hover:no-underline data-[state=open]:bg-muted/50">
                <span className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="text-sm font-semibold text-foreground">
                    {formatearFechaISO(sesion.fechaHora)}
                  </span>
                  {sesion.objetivosTrabajados && (
                    <span className="mt-0.5 line-clamp-1 break-words text-sm text-muted-foreground">
                      {sesion.objetivosTrabajados}
                    </span>
                  )}
                  {!sesion.objetivosTrabajados && (
                    <span className="mt-0.5 text-sm text-muted-foreground">Sin objetivos registrados</span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-0">
                <div className="flex flex-col gap-3 border-t pb-4 pt-4">
                  {sesion.disposicion && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Disposición
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {sesion.disposicion}
                      </Badge>
                    </div>
                  )}

                  {sesion.objetivosTrabajados && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Objetivos trabajados
                      </p>
                      <p className="mt-1 text-sm text-foreground">{sesion.objetivosTrabajados}</p>
                    </div>
                  )}

                  {sesion.observaciones && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Observaciones
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{sesion.observaciones}</p>
                    </div>
                  )}

                  {sesion.estrategiasYProximosPasos && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Estrategias y próximos pasos
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sesion.estrategiasYProximosPasos}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 border-t pt-3">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Link to={`/pacientes/${id}/sesiones/${sesion.id}/editar`}>
                        <Pencil aria-hidden="true" />
                        Editar
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
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setAEliminar(sesion)}
                        >
                          <Trash2 aria-hidden="true" />
                          Eliminar
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
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}