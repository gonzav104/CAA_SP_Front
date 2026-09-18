import { Eraser, RotateCcw, Undo2, Volume2, X } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

/**
 * Barra del constructor de oraciones (RI-13/RI-14, Zona B).
 * - Chips con la frase acumulada (X individual por chip).
 * - Acciones: «Borrar último», «Limpiar» y «Decir» (accent grande, llama TTS).
 * - «Deshacer» (sdd/modo-uso-zona-b, D4): «Limpiar» es reversible, no
 *   destructivo con confirmación — un modal que el chico deba cerrar
 *   interrumpe el habla y agrega una barrera cognitiva a su propia
 *   comunicación. Solo visible mientras haya algo para restaurar.
 * Diseño cálido y colorido, coherente con ModoUso (no con el dashboard).
 */
export function BarraFrase({
  frase,
  puedeDeshacer,
  onDecir,
  onBorrarUltima,
  onLimpiar,
  onRemoverIndice,
  onDeshacer,
}: {
  frase: string[]
  puedeDeshacer: boolean
  onDecir: () => void
  onBorrarUltima: () => void
  onLimpiar: () => void
  onRemoverIndice: (indice: number) => void
  onDeshacer: () => void
}) {
  const fraseTexto = frase.join(' ')
  const vacia = frase.length === 0

  return (
    <div className="safe-area-b flex shrink-0 flex-col gap-2 border-b-2 border-zona-b-border bg-zona-b-surface-raised px-3 py-2 sm:px-5">
      <div className="flex items-center gap-2">
        {/* Zona de chips / frase */}
        <div className="flex min-h-12 flex-1 flex-wrap items-center gap-1.5 overflow-y-auto rounded-xl border-2 border-zona-b-border bg-zona-b-surface px-2 py-1.5">
          {vacia ? (
            <span className="px-2 text-base font-medium text-zona-b-foreground-subtle">
              Tocá los pictogramas para armar una frase
            </span>
          ) : (
            frase.map((palabra, indice) => (
              <span
                key={`${indice}-${palabra}`}
                className="inline-flex items-center gap-1 rounded-full bg-zona-b-accent py-1 pl-3 pr-1 text-base font-bold text-zona-b-accent-foreground shadow-sm"
              >
                {palabra}
                <button
                  type="button"
                  aria-label={`Quitar «${palabra}»`}
                  onClick={() => onRemoverIndice(indice)}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-zona-b-accent-foreground transition-colors hover:bg-zona-b-border-soft"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Botón Decir grande */}
        <Button
          type="button"
          onClick={onDecir}
          disabled={vacia}
          className="h-12 shrink-0 rounded-full px-5 text-lg font-bold shadow-md"
        >
          <Volume2 className="size-6" aria-hidden="true" />
          Decir
        </Button>
      </div>

      {/* Controles inferiores */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="dense"
          disabled={vacia}
          onClick={onBorrarUltima}
          className="rounded-full border-2 border-zona-b-border-soft bg-zona-b-surface-raised text-zona-b-foreground-muted shadow-sm"
        >
          <Undo2 className="size-4" aria-hidden="true" />
          Borrar último
        </Button>
        <Button
          type="button"
          variant="outline"
          size="dense"
          disabled={vacia}
          onClick={onLimpiar}
          className="rounded-full border-2 border-zona-b-border-soft bg-zona-b-surface-raised text-zona-b-foreground-muted shadow-sm"
        >
          <Eraser className="size-4" aria-hidden="true" />
          Limpiar
        </Button>
        {puedeDeshacer && (
          <Button
            type="button"
            variant="outline"
            onClick={onDeshacer}
            className="rounded-full border-2 border-zona-b-border-soft bg-zona-b-surface-raised text-zona-b-foreground-muted shadow-sm"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Deshacer
          </Button>
        )}
        <span
          className={cn(
            'ml-auto text-sm font-semibold text-zona-b-foreground-muted',
            vacia && 'text-zona-b-foreground-subtle',
          )}
          aria-live="polite"
        >
          {vacia ? 'Frase vacía' : fraseTexto}
        </span>
      </div>
    </div>
  )
}
