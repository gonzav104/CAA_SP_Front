import { ArrowRight, CalendarDays, Image, LayoutGrid, UsersRound, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorCarga } from '../../components/estados'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { useCartillas } from '../../hooks/cartillas'
import { useColaboradores } from '../../hooks/colaboradores'
import { useAuth } from '../../hooks/useAuth'
import { usePaciente } from '../../hooks/pacientes'
import { usePictogramasCustom } from '../../hooks/pictogramas-custom'
import { useSesiones } from '../../hooks/sesiones'
import { calcularEdad, formatearFechaISO } from '../../lib/paciente'
import { calcularRecencia, encontrarCartillaPrincipal, sesionMasReciente } from '../../lib/resumenPaciente'

/**
 * Landing del paciente para TERAPEUTA (`pacientes/:pacienteId`, design/spec
 * `sdd/paciente-overview`, obs #65/#64). PR3a (Fase 3, obs #66): tira de
 * identidad + hero de entrada directa a la cartilla principal. PR3b
 * (Fase 4): resumen cruzado (Sesiones/Colaboradores/Pictogramas) bajo el
 * hero, cada uno con estados independientes de loading/vacío/error.
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

/**
 * Envoltorio de una tarjeta del resumen cruzado: siempre `bg-card
 * border-border` — nunca `bg-primary` (design "Secondary summary row"):
 * las 3 tarjetas son pares entre sí, subordinadas al hero. Full-card
 * `<Link>` hacia su propia sección.
 */
function TarjetaResumenLink({
  href,
  icon: Icon,
  titulo,
  children,
}: {
  href: string
  icon: LucideIcon
  titulo: string
  children: ReactNode
}) {
  return (
    <Link
      to={href}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {titulo}
      </span>
      {children}
    </Link>
  )
}

/**
 * Tarjeta Sesiones: sesión más reciente + chip de recencia (nunca solo
 * color, `calcularRecencia`) o estado vacío/error independiente.
 */
function TarjetaSesiones({ pacienteId }: { pacienteId: string }) {
  const { usuario } = useAuth()
  const esTerapeuta = usuario?.rol === 'TERAPEUTA'
  const sesionesQuery = useSesiones(pacienteId, esTerapeuta)

  if (sesionesQuery.isPending) {
    return <Skeleton className="h-28 rounded-xl" />
  }

  if (sesionesQuery.isError) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar las sesiones."
        onReintentar={() => void sesionesQuery.refetch()}
      />
    )
  }

  const masReciente = sesionMasReciente(sesionesQuery.data)
  const href = `/pacientes/${pacienteId}/sesiones`

  if (!masReciente) {
    return (
      <TarjetaResumenLink href={href} icon={CalendarDays} titulo="Sesiones">
        <p className="text-sm text-muted-foreground">Todavía no hay sesiones registradas.</p>
      </TarjetaResumenLink>
    )
  }

  const recencia = calcularRecencia(masReciente.fechaHora, new Date())
  return (
    <TarjetaResumenLink href={href} icon={CalendarDays} titulo="Sesiones">
      <Badge variant={recencia.variant} className="w-fit">
        {recencia.etiqueta}
      </Badge>
      <p className="text-sm text-muted-foreground">{formatearFechaISO(masReciente.fechaHora)}</p>
    </TarjetaResumenLink>
  )
}

/** Tarjeta Colaboradores: conteo, o estado vacío/error independiente. */
function TarjetaColaboradores({ pacienteId }: { pacienteId: string }) {
  const { usuario } = useAuth()
  const esTerapeuta = usuario?.rol === 'TERAPEUTA'
  const colaboradoresQuery = useColaboradores(pacienteId, esTerapeuta)
  const href = `/pacientes/${pacienteId}/colaboradores`

  if (colaboradoresQuery.isPending) {
    return <Skeleton className="h-28 rounded-xl" />
  }

  if (colaboradoresQuery.isError) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar los colaboradores."
        onReintentar={() => void colaboradoresQuery.refetch()}
      />
    )
  }

  const cantidad = colaboradoresQuery.data.length
  if (cantidad === 0) {
    return (
      <TarjetaResumenLink href={href} icon={UsersRound} titulo="Colaboradores">
        <p className="text-sm text-muted-foreground">Todavía no hay colaboradores agregados.</p>
      </TarjetaResumenLink>
    )
  }

  return (
    <TarjetaResumenLink href={href} icon={UsersRound} titulo="Colaboradores">
      <p className="text-2xl font-semibold text-foreground">
        {cantidad} {cantidad === 1 ? 'colaborador' : 'colaboradores'}
      </p>
    </TarjetaResumenLink>
  )
}

/** Tarjeta Pictogramas: conteo + ícono `Image` (Design Call #2, obs #66), o estado vacío/error independiente. */
function TarjetaPictogramas({ pacienteId }: { pacienteId: string }) {
  const pictogramasQuery = usePictogramasCustom(pacienteId)
  const href = `/pacientes/${pacienteId}/pictogramas`

  if (pictogramasQuery.isPending) {
    return <Skeleton className="h-28 rounded-xl" />
  }

  if (pictogramasQuery.isError) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar los pictogramas."
        onReintentar={() => void pictogramasQuery.refetch()}
      />
    )
  }

  const cantidad = pictogramasQuery.data.length
  if (cantidad === 0) {
    return (
      <TarjetaResumenLink href={href} icon={Image} titulo="Pictogramas">
        <p className="text-sm text-muted-foreground">Todavía no hay pictogramas personalizados.</p>
      </TarjetaResumenLink>
    )
  }

  return (
    <TarjetaResumenLink href={href} icon={Image} titulo="Pictogramas">
      <p className="text-2xl font-semibold text-foreground">
        {cantidad} {cantidad === 1 ? 'pictograma' : 'pictogramas'}
      </p>
    </TarjetaResumenLink>
  )
}

/**
 * Fila de resumen cruzado (design "Secondary summary row"): `grid
 * grid-cols-1 sm:grid-cols-3 gap-4`, 3 tarjetas pares entre sí. Cada query
 * es independiente — loading/vacío/error nunca bloquea a las otras 2.
 */
function ResumenPaciente({ pacienteId }: { pacienteId: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <TarjetaSesiones pacienteId={pacienteId} />
      <TarjetaColaboradores pacienteId={pacienteId} />
      <TarjetaPictogramas pacienteId={pacienteId} />
    </div>
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
      <ResumenPaciente pacienteId={pacienteId} />
    </div>
  )
}
