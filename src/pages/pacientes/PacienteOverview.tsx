import { ArrowRight, LayoutGrid } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { useCartillas } from '../../hooks/cartillas'
import { usePaciente } from '../../hooks/pacientes'
import { calcularEdad } from '../../lib/paciente'
import { encontrarCartillaPrincipal } from '../../lib/resumenPaciente'

/**
 * Landing del paciente para TERAPEUTA (`pacientes/:pacienteId`, design/spec
 * `sdd/paciente-overview`, obs #65/#64). PR3a (Fase 3, obs #66): SOLO la
 * tira de identidad + el hero de entrada directa a la cartilla principal.
 * El resumen cruzado (Sesiones/Colaboradores/Pictogramas) es PR3b — no se
 * agrega ninguna llamada a useSesiones/useColaboradores/usePictogramasCustom
 * en este archivo todavía.
 */

/** Tira de identidad (arriba de todo, mínimo peso visual): solo la edad. El
 * nombre ya vive en el header (single-display requirement, PR2). */
function TiraIdentidad({ pacienteId }: { pacienteId: string }) {
  const pacienteQuery = usePaciente(pacienteId)
  const edad = pacienteQuery.data ? calcularEdad(pacienteQuery.data.fechaNacimiento) : null

  if (pacienteQuery.isPending) {
    return <Skeleton className="h-4 w-24" />
  }
  if (edad === null) return null

  return (
    <p className="text-sm text-muted-foreground">
      {edad} {edad === 1 ? 'año' : 'años'}
    </p>
  )
}

/** Hero activo: cartilla principal existe → entrada directa (`bg-primary`, la
 * única superficie de la página con ese token, per design). */
function HeroCartillaPrincipal({
  pacienteId,
  cartillaId,
  nombreCartilla,
}: {
  pacienteId: string
  cartillaId: string
  nombreCartilla: string
}) {
  return (
    <Link
      to={`/pacientes/${pacienteId}/cartillas/${cartillaId}`}
      className="flex items-center gap-4 rounded-xl bg-primary p-6 text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
        <LayoutGrid className="size-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
          Cartilla principal
        </span>
        <span className="block truncate text-lg font-semibold">{nombreCartilla}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
        Abrir cartilla principal
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  )
}

/** Hero neutral: sin cartilla principal definida (con o sin cartillas). Nunca
 * `bg-primary` — ver design "Empty / loading / error states". */
function HeroNeutral({
  titulo,
  descripcion,
  ctaTexto,
  ctaHref,
}: {
  titulo: string
  descripcion: string
  ctaTexto: string
  ctaHref: string
}) {
  return (
    <Link
      to={ctaHref}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <LayoutGrid className="size-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{titulo}</span>
        <span className="block text-sm text-muted-foreground">{descripcion}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
        {ctaTexto}
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  )
}

/** Slot del hero: resuelve loading / sin cartillas / sin principal / principal. */
function Hero({ pacienteId }: { pacienteId: string }) {
  const cartillasQuery = useCartillas(pacienteId)

  if (cartillasQuery.isPending) {
    return <Skeleton className="h-32 rounded-xl" />
  }

  if (cartillasQuery.isError) {
    return (
      <Card className="border-destructive/30 py-6 shadow-sm">
        <CardContent className="text-sm text-muted-foreground">
          No se pudieron cargar las cartillas de este paciente.
        </CardContent>
      </Card>
    )
  }

  const cartillas = cartillasQuery.data
  const cartillaPrincipal = encontrarCartillaPrincipal(cartillas)

  if (cartillaPrincipal) {
    return (
      <HeroCartillaPrincipal
        pacienteId={pacienteId}
        cartillaId={cartillaPrincipal.id}
        nombreCartilla={cartillaPrincipal.nombre}
      />
    )
  }

  if (cartillas.length === 0) {
    return (
      <HeroNeutral
        titulo="Todavía no hay cartillas"
        descripcion="Creá la primera cartilla de comunicación para este paciente."
        ctaTexto="Crear la primera cartilla"
        ctaHref={`/pacientes/${pacienteId}/cartillas`}
      />
    )
  }

  return (
    <HeroNeutral
      titulo="Sin cartilla principal"
      descripcion="Marcá una cartilla como principal para acceder directo desde acá."
      ctaTexto="Ver cartillas"
      ctaHref={`/pacientes/${pacienteId}/cartillas`}
    />
  )
}

/** Landing del paciente (TERAPEUTA): identidad + hero de entrada directa. */
export function PacienteOverview() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const idValido = pacienteId !== undefined && pacienteId.trim() !== ''

  if (!idValido) {
    return (
      <p className="text-sm text-muted-foreground">Identificador de paciente inválido.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <TiraIdentidad pacienteId={pacienteId} />
      <Hero pacienteId={pacienteId} />
    </div>
  )
}
