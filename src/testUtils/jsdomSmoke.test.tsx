// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * Infra-proof test (design Decision 6, obs #85): confirms the jsdom
 * environment + React Testing Library are wired correctly, opted in
 * per-file via the docblock above (global `environment` in
 * vite.config.ts stays 'node'). This is not a behavior RED/GREEN pair
 * for production code — it proves the harness itself works before any
 * component test is written against it.
 */
describe('entorno de componentes (jsdom)', () => {
  it('renderiza un elemento DOM real y permite consultarlo por testid', () => {
    render(<div data-testid="smoke">ok</div>)

    const elemento = screen.getByTestId('smoke')

    expect(elemento.textContent).toBe('ok')
  })
})
