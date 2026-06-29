import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateTabelaPreco, useDeleteTabelaPreco, useTabelaPrecos } from './tabela-precos-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  tabelaPrecos: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('tabela-precos-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useTabelaPrecos busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useTabelaPrecos(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/tabela-precos', { params: { page: 1, perPage: 20 } })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useTabelaPrecos respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 3 } })

    const { result } = renderHook(() => useTabelaPrecos({ page: 3, perPage: 10 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/tabela-precos', { params: { page: 3, perPage: 10 } })
  })

  it('useTabelaPrecos expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useTabelaPrecos(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateTabelaPreco faz POST e retorna o preço criado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { tabelaPreco: { id: 'tp1' } } })

    const { result } = renderHook(() => useCreateTabelaPreco(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ clienteId: 'c1', produtoId: 'p1', preco: 10 })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/tabela-precos',
      expect.objectContaining({ clienteId: 'c1', produtoId: 'p1', preco: 10 }),
    )
    expect(result.current.data).toEqual({ id: 'tp1' })
  })

  it('useDeleteTabelaPreco faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { success: true } })

    const { result } = renderHook(() => useDeleteTabelaPreco(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('tp1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/tabela-precos/tp1')
    expect(result.current.data).toEqual({ success: true })
  })
})
