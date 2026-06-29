import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CustoProducaoFormDialog } from './custo-producao-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

const useSafrasMock = vi.fn()
const useAreasMock = vi.fn()

vi.mock('@/features/admin/api/safras-api', () => ({
  useSafras: () => useSafrasMock(),
}))

vi.mock('@/features/admin/api/areas-api', () => ({
  useAreas: () => useAreasMock(),
}))

function safrasResponse() {
  return {
    data: {
      safras: [
        { id: 's1', cultura: 'Soja' },
        { id: 's2', cultura: 'Milho' },
      ],
      total: 2,
      page: 1,
      perPage: 100,
      totalPages: 1,
    },
  }
}

function areasResponse() {
  return {
    data: {
      areas: [
        { id: 'a1', identificacao: 'Talhão 1' },
        { id: 'a2', identificacao: 'Gleba B' },
      ],
      total: 2,
      page: 1,
      perPage: 100,
      totalPages: 1,
    },
  }
}

function selectByName(name: string, value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!, {
    target: { value },
  })
}

describe('CustoProducaoFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSafrasMock.mockReturnValue(safrasResponse())
    useAreasMock.mockReturnValue(areasResponse())
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <CustoProducaoFormDialog open={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renderiza safras e áreas como opções, com "Nenhuma" disponível', () => {
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />,
    )

    const safraSelect = document.querySelector<HTMLSelectElement>('select[name="safraId"]')!
    expect(Array.from(safraSelect.options).map((o) => o.value)).toEqual(
      expect.arrayContaining(['__none', 's1', 's2']),
    )
    const areaSelect = document.querySelector<HTMLSelectElement>('select[name="areaId"]')!
    expect(Array.from(areaSelect.options).map((o) => o.value)).toEqual(
      expect.arrayContaining(['__none', 'a1', 'a2']),
    )
  })

  it('lida com listas indefinidas exibindo apenas "Nenhuma"', () => {
    useSafrasMock.mockReturnValue({ data: undefined })
    useAreasMock.mockReturnValue({ data: undefined })
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />,
    )

    const safraSelect = document.querySelector<HTMLSelectElement>('select[name="safraId"]')!
    expect(Array.from(safraSelect.options).map((o) => o.value)).toEqual(['__none'])
    const areaSelect = document.querySelector<HTMLSelectElement>('select[name="areaId"]')!
    expect(Array.from(areaSelect.options).map((o) => o.value)).toEqual(['__none'])
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

  it('chama onSubmit com safra e área selecionadas', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Descrição'), 'Adubo')
    await user.type(screen.getByLabelText('Valor'), '200')
    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    selectByName('safraId', 's1')
    selectByName('areaId', 'a1')
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

  it('normaliza "Nenhuma" (safra/área) para null no payload', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CustoProducaoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    selectByName('safraId', 's2')
    selectByName('safraId', '__none')
    selectByName('areaId', 'a2')
    selectByName('areaId', '__none')
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
