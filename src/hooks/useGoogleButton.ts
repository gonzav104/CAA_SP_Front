import { useEffect, useRef, useState } from 'react'
import { montarBotonGoogle } from '../lib/google'
import { formatError } from '../lib/utils'

/**
 * Hook que monta el botón dedicado "Sign in with Google" (renderButton de GIS)
 * en un elemento contenedor. Encapsula el ciclo de vida completo: carga del
 * script, inicialización del cliente, render del botón y limpieza al desmontar.
 *
 * A diferencia del enfoque anterior (`prompt()` One Tap), el botón dedicado
 * muestra la UI de consentimiento de forma determinista — es el patrón oficial
 * y robusto para "Continuar con Google" en una SPA con cookie httpOnly.
 *
 * @param clientId      Client ID de Google (VITE_GOOGLE_CLIENT_ID).
 * @param onIdToken     Se invoca con el idToken cuando el usuario completa el sign-in.
 * @param activo        Cuando es false no se monta (útil: no montar si falta config).
 * @param opciones      Estilo del botón (passthrough a renderButton).
 */
export function useGoogleButton(
  clientId: string | undefined,
  onIdToken: (idToken: string) => void,
  activo = true,
  opciones?: {
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'large' | 'medium' | 'small'
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    width?: number
  },
) {
  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // Guardamos onIdToken en una ref para no re-montar el botón si el callback
  // cambia (el context value de useAuth se memoiza, pero nos protegemos igual).
  const onIdTokenRef = useRef(onIdToken)
  useEffect(() => {
    onIdTokenRef.current = onIdToken
  }, [onIdToken])

  // Las opciones del botón llegan como objeto inline (nueva identidad por
  // render); al compararlas por valor evitamos re-montar el botón GIS en cada
  // render del formulario (tipear en el email NO debe recrear el iframe).
  const claveOpciones = JSON.stringify(opciones ?? null)

  useEffect(() => {
    if (!activo || !clientId || !contenedorRef.current) return

    const opcionesParseadas = claveOpciones === 'null' ? undefined : (JSON.parse(claveOpciones) as NonNullable<typeof opciones>)

    let destroy: (() => void) | undefined
    let cancelado = false
    setCargando(true)
    setError(null)

    montarBotonGoogle(contenedorRef.current, {
      clientId,
      onIdToken: (token) => onIdTokenRef.current(token),
      ...opcionesParseadas,
    })
      .then((destructor) => {
        if (cancelado) {
          destructor()
          return
        }
        destroy = destructor
      })
      .catch((errorDesconocido) => {
        if (!cancelado) setError(formatError(errorDesconocido))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
      destroy?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, clientId, claveOpciones])

  return { contenedorRef, error, cargando }
}
