import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSyncExternalStore } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConsolidacaoPage } from './consolidacao-page'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => {
      toastSuccess(m)
    },
    error: (m: string) => {
      toastError(m)
    },
  },
}))

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

const useAuthMock = vi.fn<() => { user: { permissions: string[] } }>()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

let activeEmpresaId: string | null = 'e1'
const empresaListeners = new Set<() => void>()
function setActiveEmpresaId(id: string | null): void {
  activeEmpresaId = id
  empresaListeners.forEach((l) => {
    l()
  })
}
vi.mock('@/stores/active-empresa-store', () => ({
  useActiveEmpresaStore: (selector: (s: { activeEmpresaId: string | null }) => unknown) => {
    const subscribe = (l: () => void): (() => void) => {
      empresaListeners.add(l)
      return () => empresaListeners.delete(l)
    }
    const getSnapshot = (): unknown => selector({ activeEmpresaId })
    return useSyncExternalStore(subscribe, getSnapshot)
  },
}))

const previewData = {
  remessas: [{ id: 'r1', numero: 'REM-0118' }],
  itens: [{ produtoId: 'Alface', precoUnitario: 5, quantidade: 100, valorTotal: 500 }],
  valorTotal: 500,
}

async function gerarPrevia(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('Cliente'), 'c1')
  await user.type(screen.getByLabelText('Início'), '2026-06-01')
  await user.type(screen.getByLabelText('Fim'), '2026-06-30')
  await user.click(screen.getByRole('button', { name: /Gerar prévia/ }))
}

describe('ConsolidacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    empresaListeners.clear()
    activeEmpresaId = 'e1'
    useAuthMock.mockReturnValue({ user: { permissions: ['consolidacao:create'] } })
  })

  it('exibe gate quando não há empresa ativa', () => {
    activeEmpresaId = null
    renderWithProviders(<ConsolidacaoPage />)
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
  })

  it('bloqueia quem não tem permissão', () => {
    useAuthMock.mockReturnValue({ user: { permissions: [] } })
    renderWithProviders(<ConsolidacaoPage />)
    expect(
      screen.getByText('Você não tem permissão para consolidar remessas.'),
    ).toBeInTheDocument()
  })

  it('gera prévia e mostra os itens agrupados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: previewData })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConsolidacaoPage />)

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Início'), '2026-06-01')
    await user.type(screen.getByLabelText('Fim'), '2026-06-30')
    await user.click(screen.getByRole('button', { name: /Gerar prévia/ }))

    expect(await screen.findByText('Alface')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Consolidar e gerar pedido/ })).toBeInTheDocument()
  })

  it('consolida e gera pedido', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: previewData })
    vi.mocked(api.post).mockResolvedValue({
      data: { pedido: { numero: 'PED-0050' }, remessas: [] },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConsolidacaoPage />)

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Início'), '2026-06-01')
    await user.type(screen.getByLabelText('Fim'), '2026-06-30')
    await user.click(screen.getByRole('button', { name: /Gerar prévia/ }))

    await user.click(await screen.findByRole('button', { name: /Consolidar e gerar pedido/ }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/consolidacao',
        expect.objectContaining({ empresaId: 'e1', clienteId: 'c1' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Pedido PED-0050 gerado a partir da consolidação.')
  })

  it('mostra erro na prévia e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(api.get).mockResolvedValue({ data: previewData })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConsolidacaoPage />)

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Início'), '2026-06-01')
    await user.type(screen.getByLabelText('Fim'), '2026-06-30')
    await user.click(screen.getByRole('button', { name: /Gerar prévia/ }))

    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Alface')).toBeInTheDocument()
  })

  it('exibe toast de erro quando a consolidação falha', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: previewData })
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConsolidacaoPage />)

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Início'), '2026-06-01')
    await user.type(screen.getByLabelText('Fim'), '2026-06-30')
    await user.click(screen.getByRole('button', { name: /Gerar prévia/ }))

    await user.click(await screen.findByRole('button', { name: /Consolidar e gerar pedido/ }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Não foi possível consolidar as remessas.'),
    )
  })

  it('mostra estado vazio quando não há remessas a consolidar', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { remessas: [], itens: [], valorTotal: 0 },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConsolidacaoPage />)

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Início'), '2026-06-01')
    await user.type(screen.getByLabelText('Fim'), '2026-06-30')
    await user.click(screen.getByRole('button', { name: /Gerar prévia/ }))

    expect(
      await screen.findByText(
        'Nenhuma remessa em aberto para o cliente e período selecionados.',
      ),
    ).toBeInTheDocument()
  })

  it('usa o plural quando há mais de uma remessa', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        remessas: [
          { id: 'r1', numero: 'REM-1' },
          { id: 'r2', numero: 'REM-2' },
        ],
        itens: previewData.itens,
        valorTotal: 1000,
      },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConsolidacaoPage />)

    await gerarPrevia(user)

    expect(await screen.findByText(/2 remessas · total agrupado/)).toBeInTheDocument()
    expect(screen.getByText('2 remessas → 1 pedido consolidado')).toBeInTheDocument()
  })

  it('mostra o rótulo de carregamento ao consolidar', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: previewData })
    let resolvePost!: (value: { data: { pedido: { numero: string }; remessas: [] } }) => void
    vi.mocked(api.post).mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve
      }),
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConsolidacaoPage />)

    await gerarPrevia(user)
    await user.click(await screen.findByRole('button', { name: /Consolidar e gerar pedido/ }))

    expect(await screen.findByRole('button', { name: 'Consolidando…' })).toBeDisabled()

    act(() => {
      resolvePost({ data: { pedido: { numero: 'PED-0070' }, remessas: [] } })
    })
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        'Pedido PED-0070 gerado a partir da consolidação.',
      ),
    )
  })

})
