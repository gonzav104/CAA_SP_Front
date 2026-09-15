import { Button } from '../ui/button'
import { ThumbPictograma } from '../ThumbPictograma'
import { cn } from '../../lib/utils'

/**
 * PictogramaTile — primitiva compartida de tile de pictograma (design-foundation
 * PR2): compone `ThumbPictograma` + etiqueta + chrome del tile, reemplazando el
 * markup duplicado de `CartillaView` (preview, Zona A) y `ModoUso` (uso, Zona B).
 *
 * - `variante` controla SOLO presentación/escala (preview vs. uso), nunca si
 *   el tile es interactivo.
 * - La interactividad se deriva de la presencia de `onSeleccionar`, no de
 *   `variante`: con handler renderiza un `Button` de shadcn (preserva foco,
 *   feedback de presión y `disabled`); sin handler renderiza un `<div>`
 *   estático, no focosable.
 * - Unión discriminada: un tile interactivo exige `ariaLabel` a nivel de
 *   tipos — es imposible construir uno sin ese aria-label (garantía de
 *   compilación, no un chequeo en runtime).
 * - Fuera de esta primitiva: grid/layout, selección, theming de categoría,
 *   TTS y routing siguen siendo responsabilidad del consumidor (ver design).
 */

type Base = {
  /** URL ya resuelta de la imagen; se reenvía tal cual a `ThumbPictograma`. */
  src?: string
  /** Etiqueta visible Y `alt` de la imagen. */
  etiqueta: string
  /** Controla solo presentación/escala. Default: `'preview'`. */
  variante?: 'preview' | 'uso'
  className?: string
}

type Estatico = Base & {
  onSeleccionar?: never
  ariaLabel?: never
  disabled?: never
}

type Interactivo = Base & {
  onSeleccionar: () => void
  ariaLabel: string
  disabled?: boolean
}

export type PictogramaTileProps = Estatico | Interactivo

/**
 * Clases del root copiadas BYTE-FOR-BYTE de los call sites actuales (ver
 * design, Focus Point 2 — "class strings son copiadas byte-for-byte"):
 * - `preview`: `CartillaView.tsx:127` (chrome del `<li>` original) + `h-full
 *   w-full` para el nuevo layout de grid-cell bare.
 * - `uso`: `ModoUso.tsx:249`, sin cambios.
 */
const CLASE_RAIZ_PREVIEW =
  'flex h-full w-full flex-col items-center gap-2 rounded-lg border border-border px-3 py-3 text-center'
const CLASE_RAIZ_USO =
  'flex min-h-[120px] min-w-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/70 bg-white p-2 text-slate-800 shadow-sm transition-transform hover:bg-white hover:shadow-md active:scale-95'

/** Clases de la imagen, copiadas de `CartillaView.tsx:132` / `ModoUso.tsx:254`. */
const CLASE_IMAGEN_PREVIEW = 'h-20 w-20'
const CLASE_IMAGEN_USO = 'h-14 w-14 shrink-0 sm:h-16 sm:w-16'

/** Clases de la etiqueta, copiadas de `CartillaView.tsx:134` / `ModoUso.tsx:256`. */
const CLASE_ETIQUETA_PREVIEW = 'text-xs font-medium text-foreground'
const CLASE_ETIQUETA_USO =
  'line-clamp-3 min-w-0 break-words text-center text-lg font-bold leading-tight sm:text-xl'

export function PictogramaTile(props: PictogramaTileProps) {
  const { src, etiqueta, variante = 'preview', className } = props
  const esInteractivo = 'onSeleccionar' in props

  const claseRaiz = variante === 'uso' ? CLASE_RAIZ_USO : CLASE_RAIZ_PREVIEW
  const claseImagen = variante === 'uso' ? CLASE_IMAGEN_USO : CLASE_IMAGEN_PREVIEW
  const claseEtiqueta = variante === 'uso' ? CLASE_ETIQUETA_USO : CLASE_ETIQUETA_PREVIEW

  if (esInteractivo) {
    const { onSeleccionar, ariaLabel, disabled } = props as Interactivo
    return (
      <Button
        type="button"
        variant="default"
        onClick={onSeleccionar}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(claseRaiz, className)}
      >
        <ThumbPictograma src={src} alt={etiqueta} className={claseImagen} />
        <span className={claseEtiqueta}>{etiqueta}</span>
      </Button>
    )
  }

  return (
    <div className={cn(claseRaiz, className)}>
      <ThumbPictograma src={src} alt={etiqueta} className={claseImagen} />
      <span className={claseEtiqueta}>{etiqueta}</span>
    </div>
  )
}
