/**
 * Helpers de Google Identity Services (GIS) — Sign In with Google.
 *
 * Contrato de la integración (confirmado contra la doc oficial GIS y el
 * Swagger del backend):
 *
 * - El backend espera `{ idToken }` en POST /auth/google y la cookie httpOnly
 *   la setea él solo (AuthResponseDTO { token, tipo } es informativo).
 * - El frontend usa el botón dedicado **Sign In with Google** (renderButton),
 *   NO el One Tap (prompt()). El botón dedicado muestra la UI de consentimiento
 *   de forma determinista; One Tap es frágil (políticas de cuándo aparece,
 *   popup blocking, consumo único) y "falla en silencio".
 * - Con `ux_mode: 'popup'` (default) el `credential` (idToken) llega al callback
 *   JS y se manda al backend con Axios (withCredentials) desde tu origin.
 *
 * Este módulo **no conoce React**: expone funciones puras para cargar el script
 * y montar el botón. La cámara actúa como única responsable del ciclo de vida
 * del botón GIS (conveniencia de querer la UI controlada por React).
 *
 * El tipo global de `Window.google` está declarado UNA sola vez en
 * src/vite-env.d.ts — no lo repitas acá (chocaría con TS2717).
 */

/**
 * Carga el script de GIS una sola vez. Preserva la promesa del primer caller
 * para que múltiples consumidores no lo inyecten repetido.
 */
export function cargarScriptGoogle(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true

    // Tanto si ya existe un script del mismo src en el DOM como si carga bien,
    // resolvemos. Solo fallamos cuando el script no puede cargarse.
    const yaExiste = Array.from(document.querySelectorAll('script')).some(
      (el) => el.src === 'https://accounts.google.com/gsi/client',
    )

    if (yaExiste) {
      // Esperamos a que el API esté disponible (puede estar cargando aún).
      const esperar = () =>
        window.google?.accounts?.id ? resolve() : setTimeout(esperar, 50)
      esperar()
      return
    }

    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('No se pudo cargar Google Identity Services'))
    document.head.appendChild(script)
  })
}

export interface MontarBotonOpciones {
  clientId: string
  /** Se llama con el idToken cuando el usuario completa el sign-in. */
  onIdToken: (idToken: string) => void
  /** Estilo del botón. Defaults sobrios para el layout de auth. */
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  width?: number
  /** Conocido: se dispara al hacer click en el botón (útil para UX loading). */
  onClick?: () => void
}

/**
 * Inicializa el cliente GIS y monta el botón Sign In with Google en `contenedor`.
 * Devuelve un `destroy` para desmontarlo limpiamente (evita leaks al unmount).
 *
 * El callback de GIS es asíncrono respecto del ciclo de vida de React; por eso
 * acá NO se le pasa un estado de React directamente, sino un `onIdToken` que el
 * caller (hook/componente) conecta a su lógica.
 */
export async function montarBotonGoogle(
  contenedor: HTMLElement,
  opciones: MontarBotonOpciones,
): Promise<() => void> {
  await cargarScriptGoogle()

  const gis = window.google?.accounts?.id
  if (!gis) {
    throw new Error('Google Identity Services no está disponible')
  }

  gis.initialize({
    client_id: opciones.clientId,
    auto_select: false, // el botón dedicado NUNCA auto-muestra One Tap.
    cancel_on_tap_outside: false,
    callback: (respuesta) => {
      if (respuesta.credential) {
        opciones.onIdToken(respuesta.credential)
      }
    },
  })

  gis.renderButton(contenedor, {
    theme: opciones.theme ?? 'outline',
    size: opciones.size ?? 'large',
    text: opciones.text ?? 'continue_with',
    shape: opciones.shape ?? 'rectangular',
    ...(opciones.width ? { width: opciones.width } : {}),
    ...(opciones.onClick ? { click_listener: opciones.onClick } : {}),
  })

  // GIS no provee un "destroy" oficial; limpiar el nodo y la inicialización es
  // suficiente y determinista dentro del ciclo de vida de React.
  return () => {
    contenedor.replaceChildren()
  }
}

/**
 * Lee un `idToken` (credential) de la URL si el flujo de GIS vino en modo
 * redirect. Hoy el Login/Registro usan popup, pero dejamos esto parseable para
 * que, si algún día se cambia a `ux_mode: 'redirect'` o el proveedor envía el
 * token por query string, el frontend lo consumo sin romper nada. Es MUCHO
 * más barato tenerlo que diagnosticar el fallo a ciegas.
 */
export function obtenerIdTokenDeCallback(search: string): string | null {
  const params = new URLSearchParams(search)
  return params.get('credential')
}

/**
 * Limpia el `credential`/`error` de la barra de direcciones tras consumirlo,
 * para que un refresh (F5) no reintente el login con un token viejo.
 */
export function limpiarCallbackGoogle(windowHistory: History): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('credential')
  url.searchParams.delete('error')
  windowHistory.replaceState({}, '', url)
}
