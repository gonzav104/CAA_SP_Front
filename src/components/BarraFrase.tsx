import { Eraser, Undo2, Volume2, X } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

/**
 * Barra del constructor de oraciones (RI-13/RI-14, Zona B).
 * - Chips con la frase acumulada (X individual por chip).
 * - Acciones: «Borrar último», «Limpiar» y «Decir» (accent grande, llama TTS).
 * Diseño cálido y colorido, coherente con ModoUso (no con el dashboard).
 */
export function BarraFrase({
  frase,
  onDecir,
  onBorrarUltima,
  onLimpiar,
  onRemoverIndice,
}: {
  frase: string[]
  onDecir: () => void
  onBorrarUltima: () => void
  onLimpiar: () => void
  onRemoverIndice: (indice: number) => void
}) {
  const fraseTexto = frase.join(' ')
  const vacia = frase.length === 0

  return (
    <div className="safe-area-b flex shrink-0 flex-col gap-2 border-b-2 border-amber-200 bg-white/80 px-3 py-2 sm:px-5">
      <div className="flex items-center gap-2">
        {/* Zona de chips / frase */}
        <div className="flex min-h-12 flex-1 flex-wrap items-center gap-1.5 overflow-y-auto rounded-xl border-2 border-amber-200 bg-amber-50/60 px-2 py-1.5">
          {vacia ? (
            <span className="px-2 text-base font-medium text-slate-400">
              Tocá los pictogramas para armar una frase
            </span>
          ) : (
            frase.map((palabra, indice) => (
              <span
                key={`${indice}-${palabra}`}
                className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 py-1 pl-3 pr-1 text-base font-bold text-slate-900 shadow-sm"
              >
                {palabra}
                <button
                  type="button"
                  aria-label={`Quitar «${palabra}»`}
                  onClick={() => onRemoverIndice(indice)}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-slate-900/60 transition-colors hover:bg-slate-900/10 hover:text-slate-900"
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
          className="rounded-full border-2 border-amber-300 bg-white text-slate-700 shadow-sm"
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
          className="rounded-full border-2 border-amber-300 bg-white text-slate-700 shadow-sm"
        >
          <Eraser className="size-4" aria-hidden="true" />
          Limpiar
        </Button>
        <span
          className={cn(
            'ml-auto text-sm font-semibold text-slate-500',
            vacia && 'text-slate-400',
          )}
          aria-live="polite"
        >
          {vacia ? 'Frase vacía' : fraseTexto}
        </span>
      </div>
    </div>
  )
}
