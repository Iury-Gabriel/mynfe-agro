import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RegistrarColheitaDialog } from './registrar-colheita-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

const produtosData = vi.fn<() => { data?: { produtos: { id: string; descricao: string }[] } }>()
const safrasData = vi.fn<() => { data?: { safras: { id: string; cultura: string }[] } }>()
const areasData = vi.fn<() => { data?: { areas: { id: string; identificacao: string }[] } }>()

vi.mock('@/features/admin/api/produtos-api', () => ({
  useProdutos: () => produtosData(),
}))
vi.mock('@/features/admin/api/safras-api', () => ({
  useSafras: () => safrasData(),
}))
vi.mock('@/features/admin/api/areas-api', () => ({
  useAreas: () => areasData(),
}))

function setLists(): void {
  produtosData.mockReturnValue({
    data: { produtos: [{ id: 'p1', descricao: 'Alface' }] },
  })
  safrasData.mockReturnValue({ data: { safras: [{ id: 's1', cultura: 'Verão' }] } })
  areasData.mockReturnValue({ data: { areas: [{ id: 'a1', identificacao: 'Talhão 1' }] } })
}

function selectByName(name: string, value: string): void {
  fireEvent.change(document.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!, {
    target: { value },
  })
}

describe('RegistrarColheitaDialog', () => {
  it('renderiza os campos quando aberto', () => {
    setLists()
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
    setLists()
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

  it('mostra opção desabilitada quando não há produtos', () => {
    produtosData.mockReturnValue({})
    safrasData.mockReturnValue({})
    areasData.mockReturnValue({})
    renderWithProviders(
      <RegistrarColheitaDialog
        open
        onOpenChange={vi.fn()}
        empresaId="e1"
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument()
  })

  it('exibe mensagens de validação ao submeter vazio', async () => {
    setLists()
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
    setLists()
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

    selectByName('produtoId', 'p1')
    selectByName('safraId', 's1')
    selectByName('areaId', 'a1')
    await user.type(screen.getByLabelText('Quantidade'), '10')
    await user.type(screen.getByLabelText('Código do lote'), 'LT-1')
    await user.type(screen.getByLabelText('Validade'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: 'Registrar colheita' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'e1',
          produtoId: 'p1',
          quantidade: 10,
          safraId: 's1',
          areaId: 'a1',
          codigoLote: 'LT-1',
        }),
      )
    })
    const payload = onSubmit.mock.calls[0]![0] as { validade: string | null }
    expect(payload.validade).not.toBeNull()
  })

  it('submete com campos opcionais vazios convertidos para null', async () => {
    setLists()
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

    selectByName('produtoId', 'p1')
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

  it('volta safra e área para "Nenhuma" zerando os campos', async () => {
    setLists()
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

    selectByName('produtoId', 'p1')
    selectByName('safraId', 's1')
    selectByName('safraId', '__none__')
    selectByName('areaId', 'a1')
    selectByName('areaId', '__none__')
    await user.type(screen.getByLabelText('Quantidade'), '7')
    await user.click(screen.getByRole('button', { name: 'Registrar colheita' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ safraId: null, areaId: null }),
      )
    })
  })

  it('desabilita os botões enquanto está pendente', () => {
    setLists()
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
    setLists()
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
