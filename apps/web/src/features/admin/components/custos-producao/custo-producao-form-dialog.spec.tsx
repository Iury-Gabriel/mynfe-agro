import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CustoProducaoFormDialog } from './custo-producao-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('CustoProducaoFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <CustoProducaoFormDialog
        open={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar custo' }))

    expect(await screen.findByText('Descrição obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Valor obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Data obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com o payload normalizado', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Descrição'), 'Adubo')
    await user.type(screen.getByLabelText('Valor'), '200')
    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.type(screen.getByLabelText('Safra (opcional)'), 's1')
    await user.type(screen.getByLabelText('Área (opcional)'), 'a1')
    await user.click(screen.getByRole('button', { name: 'Criar custo' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        safraId: 's1',
        areaId: 'a1',
        tipo: 'insumo',
        descricao: 'Adubo',
        valor: 200,
        data: '2026-02-01',
      })
    })
  })

  it('normaliza safra e área vazias para null', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Descrição'), 'Adubo')
    await user.type(screen.getByLabelText('Valor'), '200')
    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.click(screen.getByRole('button', { name: 'Criar custo' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ safraId: null, areaId: null }),
      )
    })
  })

  it('fecha ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={onOpenChange} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('desabilita os botões e mostra "Salvando..." quando isPending', () => {
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
