import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CancelarNotaDialog } from './cancelar-nota-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('CancelarNotaDialog', () => {
  it('renderiza título, número e campo de motivo quando aberto', () => {
    renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={vi.fn()}
        numero="1042"
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Cancelar nota fiscal' })).toBeInTheDocument()
    expect(screen.getByText(/NF-e 1042/)).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument()
  })
})
