import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingScreen } from '../../components/LoadingScreen'
import { PasswordCheckItem, PasswordChecklist } from '../../components/PasswordChecklist'
import { Button } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../hooks/useAuth'
import { formatError } from '../../lib/utils'
import { ApiError } from '../../services/api'
import { restablecerPassword } from '../../services/auth'
import { AuthLayout } from './AuthLayout'
import { restablecerPasswordSchema, type RestablecerPasswordValues } from './schemas'

/** Enlace malo/vencido o sin token en la URL: fuera del form, con salida a pedir otro. */
function EnlaceInvalido() {
  return (
    <AuthLayout titulo="Enlace inválido" subtitulo="No pudimos restablecer tu contraseña">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">El enlace no es válido o ha expirado.</p>
        <Link
          to="/olvide-password"
          className="text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Pedir otro enlace
        </Link>
      </div>
    </AuthLayout>
  )
}

/**
 * Restablecimiento de contraseña: POST /auth/restablecer-password.
 * El token llega por query string (?token=...) desde el email de recupero:
 * sin token se muestra "enlace inválido" sin formulario. Si el submit falla
 * con 400 (token malo/vencido) se muestra el mensaje real del backend y el
 * mismo bloque de salida a /olvide-password.
 */
export function RestablecerPassword() {
  const { usuario, isInitializing } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [enlaceInvalido, setEnlaceInvalido] = useState(false)
  const form = useForm<RestablecerPasswordValues>({
    resolver: zodResolver(restablecerPasswordSchema),
    defaultValues: { password: '', confirmarPassword: '' },
  })

  if (isInitializing) {
    return <LoadingScreen label="Cargando…" />
  }

  // Logueado en /restablecer-password → no tiene sentido cambiar la contraseña.
  if (usuario) {
    return <Navigate to="/" replace />
  }

  // Sin token en la URL, o el token resultó inválido al intentar el submit.
  if (!token || enlaceInvalido) {
    return <EnlaceInvalido />
  }

  // Feedback en vivo mientras se escribe (el schema Zod sigue siendo la única
  // validación del submit; esto es puramente visual).
  const password = form.watch('password')
  const confirmarPassword = form.watch('confirmarPassword')

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await restablecerPassword(token, values.password)
      toast.success('Contraseña actualizada')
      navigate('/login', { replace: true })
    } catch (error) {
      // El backend devuelve 400 "El enlace no es válido o ha expirado" si el
      // token es malo/vencido: se muestra el mensaje tal cual y se reemplaza
      // el form por el bloque con salida a pedir otro enlace.
      if (error instanceof ApiError && error.status === 400) {
        setEnlaceInvalido(true)
      }
      toast.error(formatError(error))
    }
  })

  return (
    <AuthLayout titulo="Creá una contraseña nueva" subtitulo="Elegí la contraseña para tu cuenta">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Contraseña nueva</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                aria-invalid={fieldState.invalid}
              />
              <PasswordChecklist password={password} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmarPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirmá la contraseña</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                placeholder="Repetí la contraseña"
                aria-invalid={fieldState.invalid}
              />
              <ul className="flex flex-col gap-1.5">
                <PasswordCheckItem
                  cumple={confirmarPassword !== '' && confirmarPassword === password}
                  etiqueta="Las contraseñas coinciden"
                />
              </ul>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  )
}