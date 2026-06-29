import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TabelaPrecosPage } from './tabela-precos-page'

import type { TabelaPreco } from '@/features/admin/api/tabela-precos-api'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}))

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const useAuthMock = vi.fn()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock() as unknown,
}))

const ALL_PERMS = ['preco:read', 'preco:create', 'preco:delete']

function makePreco(overrides: Partial<TabelaPreco> = {}): TabelaPreco {
  return {
    id: 'tp1',
    tenantId: 't1',
    clienteId: 'Cliente Alpha',
    produtoId: 'Soja',
    preco: 25,
    vigenciaInicio: null,
    vigenciaFim: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(precos: TabelaPreco[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      tabelaPrecos: precos,
      total: precos.length,
      page: 1,
      perPage: 20,
      totalPages: 1,
      ...extra,
    },
  })
}

describe('TabelaPrecosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<TabelaPrecosPage />)
    expect(screen.getByText('Carregando preços…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    expect(await screen.findByText('Erro ao carregar preços.')).toBeInTheDocument()

    mockList([makePreco()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Cliente Alpha')).toBeInTheDocument()
  })

  it('lista preços com vigência sem datas', async () => {
    mockList([makePreco()])
    renderWithProviders(<TabelaPrecosPage />)

    expect(await screen.findByText('Cliente Alpha')).toBeInTheDocument()
    expect(screen.getByText('Soja')).toBeInTheDocument()
    expect(screen.getByText(/25,00/)).toBeInTheDocument()
    expect(screen.getByText('Sem vigência')).toBeInTheDocument()
  })

  it('formata vigência quando há datas', async () => {
    mockList([
      makePreco({
        vigenciaInicio: '2026-03-01T00:00:00.000Z',
        vigenciaFim: '2026-06-30T00:00:00.000Z',
      }),
    ])
    renderWithProviders(<TabelaPrecosPage />)

    expect(await screen.findByText(/01\/03\/2026 → 30\/06\/2026/)).toBeInTheDocument()
  })

  it('formata vigência com apenas início informado', async () => {
    mockList([makePreco({ vigenciaInicio: '2026-03-01T00:00:00.000Z' })])
    renderWithProviders(<TabelaPrecosPage />)

    expect(await screen.findByText(/01\/03\/2026 → —/)).toBeInTheDocument()
  })

  it('oculta ações quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['preco:read'] } })
    mockList([makePreco()])
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Cliente Alpha')
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Novo preço/ })).not.toBeInTheDocument()
  })

  it('abre o dialog de criação e envia o formulário', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { tabelaPreco: makePreco() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo preço/ }))

    expect(screen.getByRole('heading', { name: 'Novo preço' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Preço'), '99')
    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/tabela-precos',
        expect.objectContaining({ clienteId: 'c1', produtoId: 'p1', preco: 99 }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Preço criado com sucesso.')
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo preço/ }))
    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Preço'), '99')
    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o preço.')
    })
  })

  it('exclui um preço pela confirmação', async () => {
    mockList([makePreco()])
    vi.mocked(api.delete).mockResolvedValue({ data: { success: true } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Cliente Alpha')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))

    expect(screen.getByRole('heading', { name: 'Excluir preço' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Excluir$/ }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/tabela-precos/tp1')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Preço excluído.')
  })

  it('exibe toast de erro quando a exclusão falha', async () => {
    mockList([makePreco()])
    vi.mocked(api.delete).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Cliente Alpha')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: /^Excluir$/ }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível excluir o preço.')
    })
  })

  it('fecha o dialog de exclusão ao cancelar limpando a seleção', async () => {
    mockList([makePreco()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Cliente Alpha')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Excluir preço' })).not.toBeInTheDocument()
    })
  })

  it('filtra preços pela busca', async () => {
    mockList([
      makePreco({ id: 'tp1', clienteId: 'Alpha', produtoId: 'Soja' }),
      makePreco({ id: 'tp2', clienteId: 'Beta', produtoId: 'Milho' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar preços'), 'milho')

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    const first = makePreco({ id: 'tp1', clienteId: 'Primeiro' })
    const second = makePreco({ id: 'tp2', clienteId: 'Segundo' })
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const tabelaPrecos = page === 1 ? [first] : [second]
        return Promise.resolve({
          data: { tabelaPrecos, total: 2, page, perPage: 20, totalPages: 2 },
        })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Primeiro')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segundo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeiro')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tabelaPrecos: [makePreco()] } })
    renderWithProviders(<TabelaPrecosPage />)

    await screen.findByText('Cliente Alpha')
    expect(screen.getByText(/Página 1 de 1 · 0 preços/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })
})
