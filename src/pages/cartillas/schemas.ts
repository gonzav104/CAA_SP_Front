import { z } from 'zod'
import { normalizeColorHex } from '../../lib/color'
import type {
  Cartilla,
  CartillaDetalle,
  CartillaInput,
  Categoria,
  CategoriaDetalle,
  CategoriaInput,
  ItemCartillaInput,
  ItemDetalle,
} from '../../types'

/**
 * Schemas de los formularios de cartillas (D5): RHF + zodResolver, un schema
 * por formulario. Contra el Swagger real: la cartilla NO tiene descripcion
 * (tiene esPrincipal); el item usa textoHablado + recursoGlobalId/recursoCustomId.
 */

/* ---------------------------------- Cartilla ---------------------------------- */

export const cartillaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  /** La cartilla principal es la que abre por defecto el modo de uso. */
  esPrincipal: z.boolean().optional(),
})

export type CartillaValues = z.infer<typeof cartillaSchema>

/** Valores del form → DTO del backend (POST/PUT .../cartillas). */
export function toCartillaInput(values: CartillaValues): CartillaInput {
  return {
    nombre: values.nombre.trim(),
    ...(values.esPrincipal !== undefined ? { esPrincipal: values.esPrincipal } : {}),
  }
}

/** Cartilla persistida → valores del form (para la cabecera del editor). */
export function toCartillaValues(cartilla: Cartilla | CartillaDetalle): CartillaValues {
  return {
    nombre: cartilla.nombre,
    esPrincipal: cartilla.esPrincipal,
  }
}

/* ---------------------------------- Categoría ---------------------------------- */

export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Elegí un color de la paleta'),
})

export type CategoriaValues = z.infer<typeof categoriaSchema>

/** Valores del form → DTO del backend (POST/PUT .../categorias). */
export function toCategoriaInput(values: CategoriaValues): CategoriaInput {
  return {
    nombre: values.nombre.trim(),
    colorHex: values.colorHex,
  }
}

/** Categoría persistida → valores del form (normaliza colores raros del backend). */
export function toCategoriaValues(categoria: Categoria | CategoriaDetalle): CategoriaValues {
  return {
    nombre: categoria.nombre,
    colorHex: normalizeColorHex(categoria.colorHex),
  }
}

/* ------------------------------------ Item ------------------------------------ */

export const itemSchema = z
  .object({
    /** Texto que habla el TTS al tocar el pictograma. */
    textoHablado: z.string().min(1, 'El texto es obligatorio'),
    /** Pictograma global elegido (UUID). El editor ofrece globales y customs. */
    recursoGlobalId: z.uuid('Seleccioná un pictograma').optional(),
    /** Pictograma custom del paciente elegido (UUID). */
    recursoCustomId: z.uuid().optional(),
  })
  // Selector dual mutuamente excluyente (RI-18): a lo sumo UNO de los dos puede
  // estar seteado. El backend rechaza un item con ambos recursos a la vez.
  .refine((data) => !(data.recursoGlobalId && data.recursoCustomId), {
    message: 'Elegí un solo pictograma (global o custom)',
    path: ['recursoGlobalId'],
  })

export type ItemValues = z.infer<typeof itemSchema>

/** Valores del form → DTO del backend (POST/PUT .../items). */
export function toItemInput(values: ItemValues): ItemCartillaInput {
  return {
    textoHablado: values.textoHablado.trim(),
    ...(values.recursoGlobalId ? { recursoGlobalId: values.recursoGlobalId } : {}),
    ...(values.recursoCustomId ? { recursoCustomId: values.recursoCustomId } : {}),
  }
}

/**
 * Item del detalle → valores del form. El pictograma resuelto trae su `tipo`;
 * si es un custom, se setea recursoCustomId (y se limpia el global).
 */
export function toItemValues(item: ItemDetalle): ItemValues {
  const esCustom = item.pictograma.tipo?.toLowerCase().includes('custom')
  return {
    textoHablado: item.textoHablado,
    ...(esCustom
      ? { recursoCustomId: item.pictograma.id }
      : { recursoGlobalId: item.pictograma.id }),
  }
}