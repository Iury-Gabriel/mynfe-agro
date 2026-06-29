import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateFazenda,
  useDeleteFazenda,
  useFazendas,
  useUpdateFazenda,
} from './fazendas-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  fazendas: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('fazendas-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useFazendas busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useFazendas(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/fazendas', { params: { page: 1, perPage: 20 } })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useFazendas respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useFazendas({ page: 2, perPage: 40 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/fazendas', { params: { page: 2, perPage: 40 } })
  })

  it('useFazendas expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useFazendas(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateFazenda faz POST e retorna a fazenda criada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { fazenda: { id: 'f1' } } })

    const { result } = renderHook(() => useCreateFazenda(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ empresaId: 'e1', nome: 'Fazenda Boa Vista' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/fazendas',
      expect.objectContaining({ nome: 'Fazenda Boa Vista' }),
    )
    expect(result.current.data).toEqual({ id: 'f1' })
  })

  it('useUpdateFazenda faz PATCH no id com o restante do body', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { fazenda: { id: 'f1' } } })

    const { result } = renderHook(() => useUpdateFazenda(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'f1', nome: 'Novo Nome' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/fazendas/f1', { nome: 'Novo Nome' })
  })

  it('useDeleteFazenda faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { fazenda: { id: 'f1' } } })

    const { result } = renderHook(() => useDeleteFazenda(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('f1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/fazendas/f1')
    expect(result.current.data).toEqual({ id: 'f1' })
  })
})
