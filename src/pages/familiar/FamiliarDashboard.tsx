import { Heart, LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { CardVacio, ErrorCarga, FilasSkeleton } from '../../components/estados'
import { usePacientes } from '../../hooks/pacientes'
import { formatearFechaISO, iniciales, nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import type { Paciente } from '../../types'

/**
 * Dashboard del FAMILIAR (/familiar, RI-3). Muestra los pacientes vinculados
 * como tarjetas con acceso SOLO a cartillas. Sin gestión de pacientes, sin
 * sesiones, sin colaboradores. El rol FAMILIAR es redirigido acá desde el index
 * y desde /pacientes (RI-1).
 */
export function FamiliarDashboard() {
  const pacientes = usePacientes()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Mi familia</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Las personas con las que colaborás en su comunicación.
        </p>
      </div>

      {pacientes.isPending && <FilasSkeleton cantidad={3} />}

      {pacientes.isError && (
        <ErrorCarga
          mensaje={formatError(pacientes.error)}
          onReintentar={() => void pacientes.refetch()}
        />
      )}

      {pacientes.isSuccess && pacientes.data.length === 0 && (
        <CardVacio
          icono={<Heart className="size-5" aria-hidden="true" />}
          titulo="Todavía no estás vinculado a ningún paciente"
          descripcion="Cuando un terapeuta te agregue como colaborador, vas a verlo acá."
        />
      )}

      {pacientes.isSuccess && pacientes.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pacientes.data.map((paciente) => (
            <TarjetaFamiliar key={paciente.id} paciente={paciente} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Tarjeta de un paciente visto desde el rol FAMILIAR (solo acceso a cartillas). */
function TarjetaFamiliar({ paciente }: { paciente: Paciente }) {
  const nombre = nombreCompleto(paciente)

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-sm font-semibold text-blue-700">
            {iniciales(nombre)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Familiar de {nombre}</p>
            {paciente.fechaNacimiento && (
              <p className="truncate text-xs text-muted-foreground">
                Nacimiento: {formatearFechaISO(paciente.fechaNacimiento)}
              </p>
            )}
          </div>
        </div>
        <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700">
          <Link to={`/pacientes/${paciente.id}/cartillas`}>
            <LayoutGrid aria-hidden="true" />
            Ver cartillas
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
