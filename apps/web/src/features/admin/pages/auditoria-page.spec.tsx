import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuditoriaPage } from './auditoria-page'

import type { AuditoriaLog } from '@/features/admin/api/auditoria-api'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

function makeLog(overrides: Partial<AuditoriaLog> = {}): AuditoriaLog {
  return {
    id: 'l1',
    tenantId: 't1',
    usuarioId: 'user-1',
    entidade: 'tenant',
    entidadeId: 'tenant-1',
    acao: 'editar',
    dadosAntes: null,
    dadosDepois: null,
    data: '2026-01-10T12:00:00.000Z',
    ...overrides,
  }
}

function mockList(logs: AuditoriaLog[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { logs, total: logs.length, page: 1, perPage: 20, totalPages: 1, ...extra },
  })
}

describe('AuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<AuditoriaPage />)
    expect(screen.getByText('Carregando registros…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AuditoriaPage />)

    expect(await screen.findByText('Erro ao carregar a auditoria.')).toBeInTheDocument()

    mockList([makeLog()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('tenant')).toBeInTheDocument()
  })

  it('lista logs com usuário, ação, entidade e registro', async () => {
    mockList([makeLog()])
    renderWithProviders(<AuditoriaPage />)

    expect(await screen.findByText('tenant')).toBeInTheDocument()
    expect(screen.getByText('user-1')).toBeInTheDocument()
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('tenant-1')).toBeInTheDocument()
  })

  it('exibe traço quando o usuário é nulo', async () => {
    mockList([makeLog({ usuarioId: null, acao: 'criar' })])
    renderWithProviders(<AuditoriaPage />)

    await screen.findByText('tenant')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Criar')).toBeInTheDocument()
  })

  it('filtra por entidade', async () => {
    mockList([makeLog()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AuditoriaPage />)

    await screen.findByText('tenant')
    await user.type(screen.getByLabelText('Filtrar por entidade'), 'produto')

    await waitFor(() => {
      const calls = vi.mocked(api.get).mock.calls
      const lastConfig = calls[calls.length - 1]![1] as { params?: { entidade?: string } }
      expect(lastConfig.params?.entidade).toBe('produto')
    })
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const logs =
          page === 1
            ? [makeLog({ id: 'l1', entidade: 'primeira' })]
            : [makeLog({ id: 'l2', entidade: 'segunda' })]
        return Promise.resolve({ data: { logs, total: 2, page, perPage: 20, totalPages: 2 } })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AuditoriaPage />)

    await screen.findByText('primeira')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('segunda')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('primeira')).toBeInTheDocument()
  })

  it('filtra por ação e envia o parâmetro acao', async () => {
    mockList([makeLog()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<AuditoriaPage />)

    await screen.findByText('tenant')
    await user.click(screen.getByRole('combobox', { name: 'Filtrar por ação' }))
    await user.click(await screen.findByRole('option', { name: 'Excluir' }))

    await waitFor(() => {
      const calls = vi.mocked(api.get).mock.calls
      const lastConfig = calls[calls.length - 1]![1] as { params?: { acao?: string } }
      expect(lastConfig.params?.acao).toBe('excluir')
    })
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { logs: [makeLog()] } })
    renderWithProviders(<AuditoriaPage />)

    await screen.findByText('tenant')
    expect(screen.getByText(/Página 1 de 1 · 0 registros/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })
})
