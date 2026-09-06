import type { ReactNode } from 'react'
import { Card, CardContent } from '../../components/ui/card'

interface AuthLayoutProps {
  titulo: string
  subtitulo: string
  children: ReactNode
}

/**
 * Layout compartido de las páginas de autenticación (Zona A, estilo Linear):
 * card centrada en pantalla completa sobre fondo neutro, título arriba.
 * Los botones de acción dentro del formulario usan blue-600 (convención del dashboard).
 */
export function AuthLayout({ titulo, subtitulo, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{subtitulo}</p>
        </div>
        <Card className="shadow-sm">
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}