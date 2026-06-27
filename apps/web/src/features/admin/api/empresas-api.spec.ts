import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateEmpresa,
  useEmpresas,
  useSetActiveEmpresa,
  useSetEmpresaStatus,
  useUpdateEmpresa,
} from './empresas-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const listResponse = {
  empresas: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('empresas-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useEmpresas busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useEmpresas(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/empresas', { params: { page: 1, perPage: 20 } })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useEmpresas respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 3 } })

    const { result } = renderHook(() => useEmpresas({ page: 3, perPage: 50 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/empresas', { params: { page: 3, perPage: 50 } })
  })

  it('useEmpresas expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useEmpresas(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateEmpresa faz POST e retorna a empresa criada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { empresa: { id: 'e1' } } })

    const { result } = renderHook(() => useCreateEmpresa(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({
        tipoPessoa: 'PJ',
        razaoSocial: 'Verde Folha',
        cnpjCpf: '12345678000190',
        regimeTributario: 'Simples',
        crt: '1',
        ambienteFiscal: 'homologacao',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/empresas',
      expect.objectContaining({ razaoSocial: 'Verde Folha' }),
    )
    expect(result.current.data).toEqual({ id: 'e1' })
  })

  it('useUpdateEmpresa faz PATCH no id com o restante do body', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: { id: 'e1' } } })

    const { result } = renderHook(() => useUpdateEmpresa(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'e1', razaoSocial: 'Nova Razão' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/empresas/e1', { razaoSocial: 'Nova Razão' })
  })

  it('useSetEmpresaStatus chama activate quando status é ativo', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: { id: 'e1' } } })

    const { result } = renderHook(() => useSetEmpresaStatus(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'e1', status: 'ativo' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/empresas/e1/activate')
  })

  it('useSetEmpresaStatus chama deactivate quando status é inativo', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { empresa: { id: 'e1' } } })

    const { result } = renderHook(() => useSetEmpresaStatus(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'e1', status: 'inativo' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/empresas/e1/deactivate')
  })

  it('useSetActiveEmpresa faz POST em /api/empresas/active', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { empresa: { id: 'e2' } } })

    const { result } = renderHook(() => useSetActiveEmpresa(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('e2')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/empresas/active', { empresaId: 'e2' })
    expect(result.current.data).toEqual({ id: 'e2' })
  })
})
