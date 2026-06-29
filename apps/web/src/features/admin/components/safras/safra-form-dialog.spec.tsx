import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SafraFormDialog } from './safra-form-dialog'

import type { Area } from '@/features/admin/api/areas-api'
import type { Safra } from '@/features/admin/api/safras-api'

import { renderWithProviders } from '@/test/render-with-providers'

const useAreasMock = vi.fn()

vi.mock('@/features/admin/api/areas-api', () => ({
  useAreas: () => useAreasMock(),
}))

function makeArea(overrides: Partial<Area> = {}): Area {
  return {
    id: 'a1',
    tenantId: 't1',
    fazendaId: 'f1',
    identificacao: 'Talhão 1',
    tamanho: null,
    unidadeTamanho: null,
    rotulo: null,
    geometria: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function areasResponse() {
  return {
    data: {
      areas: [makeArea(), makeArea({ id: 'a2', identificacao: 'Gleba B' })],
      total: 2,
      page: 1,
      perPage: 100,
      totalPages: 1,
    },
  }
}

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

function selectArea(value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="areaId"]')!, {
    target: { value },
  })
}

describe('SafraFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAreasMock.mockReturnValue(areasResponse())
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <SafraFormDialog open={false} onOpenChange={vi.fn()} safra={null} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renderiza as áreas como opções do select', () => {
    renderWithProviders(
      <SafraFormDialog open onOpenChange={vi.fn()} safra={null} onSubmit={vi.fn()} isPending={false} />,
    )

    const select = document.querySelector<HTMLSelectElement>('select[name="areaId"]')!
    expect(Array.from(select.options).map((o) => o.value)).toEqual(
      expect.arrayContaining(['a1', 'a2']),
    )
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <SafraFormDialog open onOpenChange={vi.fn()} safra={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar safra' }))

    expect(await screen.findByText('Área obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Cultura obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com a área selecionada e payload normalizado', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <SafraFormDialog open onOpenChange={vi.fn()} safra={null} onSubmit={onSubmit} isPending={false} />,
    )

    selectArea('a2')
    await user.type(screen.getByLabelText('Cultura'), 'Soja')
    await user.type(screen.getByLabelText('Variedade'), 'TMG')
    await user.type(screen.getByLabelText('Estimativa de produção'), '3000')
    await user.click(screen.getByRole('button', { name: 'Criar safra' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        areaId: 'a2',
        cultura: 'Soja',
        variedade: 'TMG',
        dataPlantio: null,
        dataColheitaPrevista: null,
        estimativaProducao: 3000,
        status: 'planejado',
      })
    })
  })

  it('mostra estado vazio quando não há áreas', () => {
    useAreasMock.mockReturnValue({ data: undefined })
    renderWithProviders(
      <SafraFormDialog open onOpenChange={vi.fn()} safra={null} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByText('Nenhuma área cadastrada')).toBeInTheDocument()
  })

  it('preenche os campos a partir da safra em edição e desabilita a área', () => {
    renderWithProviders(
      <SafraFormDialog open onOpenChange={vi.fn()} safra={makeSafra()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByRole('heading', { name: 'Editar safra' })).toBeInTheDocument()
    const select = document.querySelector<HTMLSelectElement>('select[name="areaId"]')!
    expect(select.value).toBe('a1')
    expect(select).toBeDisabled()
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
      <SafraFormDialog open onOpenChange={onOpenChange} safra={null} onSubmit={vi.fn()} isPending={false} />,
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
