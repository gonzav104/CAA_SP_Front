import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  /** Texto opcional bajo el spinner. Por defecto «Cargando…». */
  label?: string
}

/**
 * Pantalla de carga full-page, centrada y sobria (Zona A).
 * Reutilizable: la usa ProtectedRoute (T4) y el ModoUso (T9).
 */
export function LoadingScreen({ label = 'Cargando…' }: LoadingScreenProps) {
  return (
    <div
      role="status"
      className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-background"
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  )
}