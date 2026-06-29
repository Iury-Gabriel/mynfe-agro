import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateProduto,
  useProdutos,
  useSetProdutoStatus,
  useUpdateProduto,
} from './produtos-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const listResponse = {
  produtos: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('produtos-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useProdutos busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useProdutos(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/produtos', { params: { page: 1, perPage: 20 } })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useProdutos respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useProdutos({ page: 2, perPage: 50 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/produtos', { params: { page: 2, perPage: 50 } })
  })

  it('useProdutos expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useProdutos(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateProduto faz POST e retorna o produto criado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { produto: { id: 'p1' } } })

    const { result } = renderHook(() => useCreateProduto(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({
        empresaId: 'e1',
        descricao: 'Soja',
        tipo: 'bruto',
        unidadeMedida: 'kg',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/produtos',
      expect.objectContaining({ descricao: 'Soja' }),
    )
    expect(result.current.data).toEqual({ id: 'p1' })
  })

  it('useUpdateProduto faz PATCH no id com o restante do body', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { produto: { id: 'p1' } } })

    const { result } = renderHook(() => useUpdateProduto(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'p1', descricao: 'Milho' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/produtos/p1', { descricao: 'Milho' })
  })

  it('useSetProdutoStatus chama activate quando status é ativo', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { produto: { id: 'p1' } } })

    const { result } = renderHook(() => useSetProdutoStatus(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'p1', status: 'ativo' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/produtos/p1/activate')
  })

  it('useSetProdutoStatus chama deactivate quando status é inativo', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { produto: { id: 'p1' } } })

    const { result } = renderHook(() => useSetProdutoStatus(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'p1', status: 'inativo' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/produtos/p1/deactivate')
  })
})
