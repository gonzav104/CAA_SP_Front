import type { ReactNode } from 'react'

interface EncabezadoSeccionProps {
  /** Omitido === el `<h1>` del shell ya nombra esta ruta; no se renderiza un encabezado de página. */
  titulo?: { texto: string; nivel: 2 | 3 }
  descripcion?: string
  /** Slot alineado a la derecha (CTAs). */
  acciones?: ReactNode
  /** Contenido adicional bajo el título (por ejemplo, la fila de badges de CartillaView). */
  children?: ReactNode
}

/**
 * Encabezado compartido para las rutas del cluster de cartillas/pictogramas
 * (design Decision 4, obs #85). Exactamente un condicional (`titulo` presente
 * o ausente); todo lo demás es un slot de `ReactNode`. El layout raíz es el
 * wrapper ya presente en los cuatro sitios de uso.
 */
export function EncabezadoSeccion({ titulo, descripcion, acciones, children }: EncabezadoSeccionProps) {
  const TituloTag = titulo?.nivel === 3 ? 'h3' : 'h2'

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {titulo && <TituloTag className="text-2xl font-semibold tracking-tight">{titulo.texto}</TituloTag>}
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
        {children}
      </div>
      {acciones}
    </div>
  )
}
