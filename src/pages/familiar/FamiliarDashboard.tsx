import { Heart, LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { usePacientes } from '../../hooks/pacientes'
import { formatearFechaISO, nombreCompleto } from '../../lib/paciente'
import type { Paciente } from '../../types'
import { PacienteAvatar } from '../../components/pacientes/PacienteAvatar'
import { PacientesGrid } from '../../components/pacientes/PacientesGrid'

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
      <p className="text-sm text-muted-foreground">
        Las personas con las que colaborás en su comunicación.
      </p>

      <PacientesGrid
        resultado={pacientes}
        renderItem={(paciente) => <TarjetaFamiliar key={paciente.id} paciente={paciente} />}
        vacio={{
          icono: <Heart className="size-5" aria-hidden="true" />,
          titulo: 'Todavía no estás vinculado a ningún paciente',
          descripcion: 'Cuando un terapeuta te agregue como colaborador, vas a verlo acá.',
        }}
      />
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
          <PacienteAvatar nombre={nombre} tamanio="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Familiar de {nombre}</p>
            {paciente.fechaNacimiento && (
              <p className="truncate text-xs text-muted-foreground">
                Nacimiento: {formatearFechaISO(paciente.fechaNacimiento)}
              </p>
            )}
          </div>
        </div>
        <Button
          asChild
          className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
        >
          <Link to={`/pacientes/${paciente.id}/cartillas`}>
            <LayoutGrid aria-hidden="true" />
            Ver cartillas
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
