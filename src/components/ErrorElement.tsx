import { TriangleAlert } from 'lucide-react'
import { Link, useRouteError } from 'react-router-dom'
import { formatError } from '../lib/utils'
import { Button } from './ui/button'

/**
 * Página de error de la raíz del router (Zona A, sobria).
 * Muestra el mensaje del error (ApiError u otro) y un link para volver al inicio.
 */
export function ErrorElement() {
  const error = useRouteError()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 p-4">
      <TriangleAlert className="size-8 text-muted-foreground" aria-hidden="true" />
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">{formatError(error)}</p>
      </div>
      <Button asChild variant="outline">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}