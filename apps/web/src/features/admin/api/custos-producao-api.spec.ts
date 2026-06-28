import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateCustoProducao,
  useCustosProducao,
  useDeleteCustoProducao,
} from './custos-producao-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  custos: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('custos-producao-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useCustosProducao busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useCustosProducao(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/custos-producao', {
      params: { page: 1, perPage: 20 },
    })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useCustosProducao respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useCustosProducao({ page: 2, perPage: 40 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/custos-producao', {
      params: { page: 2, perPage: 40 },
    })
  })

  it('useCustosProducao expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useCustosProducao(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateCustoProducao faz POST e retorna o custo criado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { custo: { id: 'cu1' } } })

    const { result } = renderHook(() => useCreateCustoProducao(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ tipo: 'insumo', descricao: 'Sementes', valor: 100, data: '2026-01-01' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/custos-producao',
      expect.objectContaining({ descricao: 'Sementes' }),
    )
    expect(result.current.data).toEqual({ id: 'cu1' })
  })

  it('useDeleteCustoProducao faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { custo: { id: 'cu1' } } })

    const { result } = renderHook(() => useDeleteCustoProducao(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('cu1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/custos-producao/cu1')
    expect(result.current.data).toEqual({ id: 'cu1' })
  })
})
