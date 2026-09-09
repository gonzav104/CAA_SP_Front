import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingScreen } from '../../components/LoadingScreen'
import { Button } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../hooks/useAuth'
import { formatError } from '../../lib/utils'
import { olvidePassword } from '../../services/auth'
import { AuthLayout } from './AuthLayout'
import { olvidePasswordSchema, type OlvidePasswordValues } from './schemas'

const MENSAJE_EXITO =
  'Si el email está registrado, te enviamos un link para restablecer tu contraseña'

/**
 * Solicitud de recupero de contraseña: POST /auth/olvide-password.
 * El backend responde SIEMPRE 200 (no revela si el email existe) y el front
 * tampoco: se muestra el mismo mensaje de éxito pase lo que pase con la
 * solicitud. Solo un 429 (rate limit) o un error de red muestran algo distinto,
 * vía formatError (que prioriza el mensaje real del backend).
 */
export function OlvidePassword() {
  const { usuario, isInitializing } = useAuth()
  const form = useForm<OlvidePasswordValues>({
    resolver: zodResolver(olvidePasswordSchema),
    defaultValues: { email: '' },
  })

  if (isInitializing) {
    return <LoadingScreen label="Cargando…" />
  }

  // Logueado en /olvide-password → no tiene sentido pedir recupero.
  if (usuario) {
    return <Navigate to="/" replace />
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await olvidePassword(values.email)
      toast.success(MENSAJE_EXITO)
    } catch (error) {
      // formatError prioriza ApiError.message: un 429 de rate limit muestra el
      // mensaje real del backend ("Demasiados intentos, esperá unos minutos");
      // un error de red, el mensaje genérico. Nunca un "ese email no existe".
      toast.error(formatError(error))
    }
  })

  const enviando = form.formState.isSubmitting

  return (
    <AuthLayout titulo="Restablecé tu contraseña" subtitulo="Te enviamos un link por email">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={enviando}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {enviando && <Loader2 className="animate-spin" aria-hidden="true" />}
          Enviar link
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}