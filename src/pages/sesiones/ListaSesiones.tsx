import { CalendarDays, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { CardVacio, ErrorCarga, FilasSkeleton } from '../../components/estados'
import { useSesiones } from '../../hooks/sesiones'
import { usePaciente } from '../../hooks/pacientes'
import { useAuth } from '../../hooks/useAuth'
import { formatearFechaISO, nombreCompleto } from '../../lib/paciente'
import { cn, formatError } from '../../lib/utils'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'

/**
 * Lista de sesiones de un paciente en su propia página (/pacientes/:pacienteId/sesiones,
 * RI-6). Header con nombre del paciente, botón «Nueva sesión», cards con
 * fechaHora + disposicion + objetivos.
 *
 * NOTA: el backend (Swagger :8080) solo expone GET/POST en /sesiones — NO hay
 * PUT/DELETE por sesión. Por eso esta pantalla es de listado + alta, sin
 * acciones Editar/Eliminar (no hay endpoint que las sirva). Si el backend
 * agrega PUT/DELETE, se habilitan acá (los servicios/hooks ya existen).
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
  // Por sesión: si el detalle está expandido (ver texto completo).
  const [expandidas, setExpandidas] = useState<Record<string, boolean>>({})

  const toggleExpandida = (sesionId: string) =>
    setExpandidas((prev) => ({ ...prev, [sesionId]: !prev[sesionId] }))

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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
