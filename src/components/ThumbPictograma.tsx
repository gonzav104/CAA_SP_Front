import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

/**
 * Imagen de pictograma con placeholder: si no hay URL o la imagen falla al
 * cargar, muestra un icono muted en vez del recuadro roto. Se usa en la
 * preview (CartillaView), en el editor de cartillas y en los selectores.
 *
 * El estado de fallo se resetea durante el render cuando cambia `src` (patrón
 * oficial de React para estado derivado de props) — así, tras editar un item
 * y refetchear, la imagen nueva se reintenta sin romper el placeholder.
 */
export function ThumbPictograma({
  src,
  alt,
  className,
}: {
  src?: string
  alt: string
  className?: string
}) {
  const [fallo, setFallo] = useState(false)
  const [ultimoSrc, setUltimoSrc] = useState(src)

  if (ultimoSrc !== src) {
    setUltimoSrc(src)
    setFallo(false)
  }

  if (!src || fallo) {
    return (
      <span
        className={cn(
          'flex items-center justify-center rounded-md bg-muted text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="size-4" aria-hidden="true" />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFallo(true)}
      className={cn('rounded-md object-contain', className)}
    />
  )
}