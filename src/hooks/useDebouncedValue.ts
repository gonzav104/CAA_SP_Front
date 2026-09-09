import { useEffect, useState } from 'react'

/**
 * Debounce genérico: devuelve `value` recién cuando pasó `delayMs` sin cambios.
 * Sin dependencias externas (setTimeout/clearTimeout directos).
 * Uso: debounce 250ms de la búsqueda ARASAAC para no pegarle a la API por keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}