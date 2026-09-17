// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { EncabezadoSeccion } from './EncabezadoSeccion'

/**
 * Design Decision 4 (obs #85): one conditional (`titulo` present/absent),
 * everything else a ReactNode slot. Spec "Non-redundant heading per route"
 * (obs #84): a route either owns a subordinate heading or relies entirely
 * on the shell's own <h1>, never both.
 *
 * No global `setupFiles` exists in vite.config.ts (out of scope for this
 * slice), so RTL's DOM is cleaned up explicitly per file rather than via
 * an auto-cleanup hook.
 */
afterEach(() => {
  cleanup()
})

describe('EncabezadoSeccion', () => {
  it('renderiza el título en el nivel de encabezado solicitado (nivel 2)', () => {
    render(<EncabezadoSeccion titulo={{ texto: 'Cartilla de Juan', nivel: 2 }} />)

    const encabezado = screen.getByRole('heading', { level: 2, name: 'Cartilla de Juan' })

    expect(encabezado.textContent).toBe('Cartilla de Juan')
  })

  it('renderiza el título en el nivel de encabezado solicitado (nivel 3)', () => {
    render(<EncabezadoSeccion titulo={{ texto: 'Editor de cartilla', nivel: 3 }} />)

    const encabezado = screen.getByRole('heading', { level: 3, name: 'Editor de cartilla' })

    expect(encabezado.textContent).toBe('Editor de cartilla')
  })

  it('no renderiza ningún encabezado cuando se omite `titulo`', () => {
    render(<EncabezadoSeccion descripcion="Cartillas de comunicación del paciente." />)

    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('igual renderiza `descripcion` cuando se omite `titulo` (no es un echo, es copy real)', () => {
    render(<EncabezadoSeccion descripcion="Cartillas de comunicación del paciente." />)

    const descripcion = screen.getByText('Cartillas de comunicación del paciente.')

    expect(descripcion.textContent).toBe('Cartillas de comunicación del paciente.')
  })

  it('renderiza el slot `acciones` en su lugar', () => {
    render(
      <EncabezadoSeccion
        titulo={{ texto: 'Cartillas', nivel: 2 }}
        acciones={<button type="button">Nueva cartilla</button>}
      />,
    )

    const boton = screen.getByRole('button', { name: 'Nueva cartilla' })

    expect(boton.textContent).toBe('Nueva cartilla')
  })

  it('renderiza `children` en su lugar (por ejemplo, la fila de badges de CartillaView)', () => {
    render(
      <EncabezadoSeccion titulo={{ texto: 'Cartilla de Juan', nivel: 2 }}>
        <span>Principal</span>
      </EncabezadoSeccion>,
    )

    const badge = screen.getByText('Principal')

    expect(badge.textContent).toBe('Principal')
  })
})
