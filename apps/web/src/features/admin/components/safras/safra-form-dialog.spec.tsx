import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SafraFormDialog } from './safra-form-dialog'

import type { Safra } from '@/features/admin/api/safras-api'

import { renderWithProviders } from '@/test/render-with-providers'

function makeSafra(overrides: Partial<Safra> = {}): Safra {
  return {
    id: 's1',
    tenantId: 't1',
    areaId: 'a1',
    cultura: 'Soja',
    variedade: 'TMG',
    dataPlantio: '2026-01-10T00:00:00.000Z',
    dataColheitaPrevista: null,
    dataColheitaRealizada: null,
    estimativaProducao: 3000,
    status: 'em_andamento',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('SafraFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <SafraFormDialog
        open={false}
        onOpenChange={vi.fn()}
        safra={null}
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
      <SafraFormDialog
        open
        onOpenChange={vi.fn()}
        safra={null}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar safra' }))

    expect(await screen.findByText('Área obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Cultura obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com o payload normalizado ao criar', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <SafraFormDialog
        open
        onOpenChange={vi.fn()}
        safra={null}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Área'), 'a1')
    await user.type(screen.getByLabelText('Cultura'), 'Soja')
    await user.type(screen.getByLabelText('Variedade'), 'TMG')
    await user.type(screen.getByLabelText('Estimativa de produção'), '3000')
    await user.click(screen.getByRole('button', { name: 'Criar safra' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        areaId: 'a1',
        cultura: 'Soja',
        variedade: 'TMG',
        dataPlantio: null,
        dataColheitaPrevista: null,
        estimativaProducao: 3000,
        status: 'planejado',
      })
    })
  })

  it('preenche os campos a partir da safra em edição e desabilita a área', () => {
    renderWithProviders(
      <SafraFormDialog
        open
        onOpenChange={vi.fn()}
        safra={makeSafra()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Editar safra' })).toBeInTheDocument()
    expect(screen.getByLabelText('Área')).toBeDisabled()
    expect(screen.getByLabelText('Cultura')).toHaveValue('Soja')
  })

  it('lida com variedade e estimativa nulas em edição', () => {
    renderWithProviders(
      <SafraFormDialog
        open
        onOpenChange={vi.fn()}
        safra={makeSafra({ variedade: null, estimativaProducao: null, dataPlantio: null })}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByLabelText('Variedade')).toHaveValue('')
    expect(screen.getByLabelText('Estimativa de produção')).toHaveValue('')
  })

  it('fecha ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <SafraFormDialog
        open
        onOpenChange={onOpenChange}
        safra={null}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('desabilita os botões e mostra "Salvando..." quando isPending', () => {
    renderWithProviders(
      <SafraFormDialog open onOpenChange={vi.fn()} safra={null} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
