import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmpresaSwitcher } from './empresa-switcher'

import type { Empresa } from '@/features/admin/api/empresas-api'

import { ACTIVE_EMPRESA_STORAGE_KEY } from '@/lib/active-empresa'
import { api } from '@/lib/api-client'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'
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
  api: { get: vi.fn(), post: vi.fn() },
}))

function makeEmpresa(id: string, nome: string, fantasia: string | null = null): Empresa {
  return {
    id,
    tenantId: 't1',
    tipoPessoa: 'PJ',
    razaoSocial: nome,
    nomeFantasia: fantasia,
    cnpjCpf: '12345678000190',
    cnpjCpfFormatado: '12.345.678/0001-90',
    inscricaoEstadual: null,
    ieProdutorRural: null,
    regimeTributario: 'Simples',
    crt: '1',
    ambienteFiscal: 'homologacao',
    serieNfe: null,
    status: 'ativo',
    endereco: {
      logradouro: null,
      numero: null,
      complemento: null,
      bairro: null,
      municipio: null,
      uf: null,
      cep: null,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function mockList(empresas: Empresa[]) {
  vi.mocked(api.get).mockResolvedValue({
    data: { empresas, total: empresas.length, page: 1, perPage: 100, totalPages: 1 },
  })
}

describe('EmpresaSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    useActiveEmpresaStore.setState({ activeEmpresaId: null })
  })

  it('não renderiza quando não há empresas', async () => {
    mockList([])
    const { container } = renderWithProviders(<EmpresaSwitcher />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(container.querySelector('[aria-label="Empresa ativa"]')).toBeNull()
  })

  it('seleciona a primeira empresa automaticamente quando não há ativa', async () => {
    mockList([makeEmpresa('e1', 'Alpha'), makeEmpresa('e2', 'Beta')])
    renderWithProviders(<EmpresaSwitcher />)

    await waitFor(() => {
      expect(useActiveEmpresaStore.getState().activeEmpresaId).toBe('e1')
    })
    expect(window.localStorage.getItem(ACTIVE_EMPRESA_STORAGE_KEY)).toBe('e1')
  })

  it('reseta para a primeira quando a empresa ativa não existe mais', async () => {
    useActiveEmpresaStore.setState({ activeEmpresaId: 'desaparecida' })
    mockList([makeEmpresa('e1', 'Alpha')])
    renderWithProviders(<EmpresaSwitcher />)

    await waitFor(() => {
      expect(useActiveEmpresaStore.getState().activeEmpresaId).toBe('e1')
    })
  })

  it('mantém a empresa ativa quando ela ainda existe', async () => {
    useActiveEmpresaStore.setState({ activeEmpresaId: 'e2' })
    mockList([makeEmpresa('e1', 'Alpha'), makeEmpresa('e2', 'Beta')])
    renderWithProviders(<EmpresaSwitcher />)

    await waitFor(() => expect(screen.getByLabelText('Empresa ativa')).toBeInTheDocument())
    expect(useActiveEmpresaStore.getState().activeEmpresaId).toBe('e2')
  })

  it('troca a empresa ativa via API e atualiza o estado', async () => {
    mockList([makeEmpresa('e1', 'Alpha'), makeEmpresa('e2', 'Beta', 'Beta Fantasia')])
    vi.mocked(api.post).mockResolvedValue({ data: { empresa: makeEmpresa('e2', 'Beta') } })
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<EmpresaSwitcher />)

    await waitFor(() => {
      expect(useActiveEmpresaStore.getState().activeEmpresaId).toBe('e1')
    })

    await user.click(screen.getByLabelText('Empresa ativa'))
    await user.click(await screen.findByRole('option', { name: 'Beta Fantasia' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/empresas/active', { empresaId: 'e2' })
    })
    await waitFor(() => {
      expect(useActiveEmpresaStore.getState().activeEmpresaId).toBe('e2')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Empresa ativa atualizada.')
  })

  it('exibe toast de erro quando a troca falha', async () => {
    mockList([makeEmpresa('e1', 'Alpha'), makeEmpresa('e2', 'Beta')])
    vi.mocked(api.post).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })

    renderWithProviders(<EmpresaSwitcher />)
    await waitFor(() => expect(screen.getByLabelText('Empresa ativa')).toBeInTheDocument())

    await user.click(screen.getByLabelText('Empresa ativa'))
    await user.click(await screen.findByRole('option', { name: 'Beta' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível trocar a empresa ativa.')
    })
  })
})
