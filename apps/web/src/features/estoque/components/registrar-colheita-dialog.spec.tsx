import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RegistrarColheitaDialog } from './registrar-colheita-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('RegistrarColheitaDialog', () => {
  it('renderiza os campos quando aberto', () => {
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Registrar colheita' })).toBeInTheDocument()
    expect(screen.getByLabelText('Produto')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument()
  })

  it('não renderiza conteúdo quando fechado', () => {
    renderWithProviders(
      <RegistrarColheitaDialog
        open={false}
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Registrar colheita' })).not.toBeInTheDocument()
  })

  it('exibe mensagens de validação ao submeter vazio', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.clear(screen.getByLabelText('Data'))
    await user.click(screen.getByRole('button', { name: 'Registrar colheita' }))

    expect(await screen.findByText('Produto obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Quantidade obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Data obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submete com campos opcionais preenchidos', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Produto'), '  p1  ')
    await user.type(screen.getByLabelText('Quantidade'), '10')
    await user.type(screen.getByLabelText('Safra'), 'S1')
    await user.type(screen.getByLabelText('Área'), 'A1')
    await user.type(screen.getByLabelText('Código do lote'), 'LT-1')
    await user.type(screen.getByLabelText('Validade'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: 'Registrar colheita' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'e1',
          produtoId: 'p1',
          quantidade: 10,
          safraId: 'S1',
          areaId: 'A1',
          codigoLote: 'LT-1',
        }),
      )
    })
    const payload = onSubmit.mock.calls[0]![0] as { validade: string | null }
    expect(payload.validade).not.toBeNull()
  })

  it('submete com campos opcionais vazios convertidos para null', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Produto'), 'p2')
    await user.type(screen.getByLabelText('Quantidade'), '5')
    await user.click(screen.getByRole('button', { name: 'Registrar colheita' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          safraId: null,
          areaId: null,
          codigoLote: null,
          validade: null,
        }),
      )
    })
  })

  it('desabilita os botões enquanto está pendente', () => {
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })

  it('fecha ao clicar em cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={onOpenChange}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
