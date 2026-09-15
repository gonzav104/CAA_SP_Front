import { MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useEliminarPaciente, usePacientes } from '../../hooks/pacientes'
import { useAuth } from '../../hooks/useAuth'
import { calcularEdad, formatearFechaISO, nombreCompleto } from '../../lib/paciente'
import type { Paciente } from '../../types'
import { PacienteAvatar } from '../../components/pacientes/PacienteAvatar'
import { PacientesGrid } from '../../components/pacientes/PacientesGrid'
import { EliminarPacienteDialog } from '../../components/pacientes/EliminarPacienteDialog'

/** Encabezado de la lista con el CTA «Nuevo paciente» (página propia /pacientes/nuevo). */
function ListaHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Administrá pacientes, cartillas, sesiones y colaboradores.
      </p>
      <Button
        asChild
        className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
      >
        <Link to="/pacientes/nuevo">
          <Plus aria-hidden="true" />
          Nuevo paciente
        </Link>
      </Button>
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
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <PacienteAvatar nombre={nombre} tamanio="sm" />
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
 * y vacío (con CTA), resueltos por `PacientesGrid`. La eliminación se confirma
 * con `EliminarPacienteDialog`.
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

      <PacientesGrid
        resultado={pacientes}
        renderItem={(paciente) => (
          <CardPaciente key={paciente.id} paciente={paciente} onEliminar={setAEliminar} />
        )}
        vacio={{
          icono: <Users className="size-5" aria-hidden="true" />,
          titulo: 'Todavía no hay pacientes',
          descripcion: 'Creá el primer paciente para empezar a armar cartillas y sesiones.',
          accion: (
            <Button
              asChild
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
              <Link to="/pacientes/nuevo">
                <Plus aria-hidden="true" />
                Nuevo paciente
              </Link>
            </Button>
          ),
        }}
      />

      <EliminarPacienteDialog
        paciente={aEliminar}
        onOpenChange={(abierto) => {
          if (!abierto) setAEliminar(null)
        }}
        onConfirmar={confirmarEliminar}
        pendiente={eliminar.isPending}
      />
    </div>
  )
}