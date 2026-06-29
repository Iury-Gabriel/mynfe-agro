import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCancelarPedido,
  useConfirmarPedido,
  useCriarPedido,
  usePedido,
  usePedidos,
} from './pedidos-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

describe('pedidos-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('usePedidos busca com empresaId, paginação default e filtros limpos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { pedidos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(
      () => usePedidos({ empresaId: 'e1', filtros: { status: 'confirmado', clienteId: '' } }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/pedidos', {
      params: { empresaId: 'e1', page: 1, perPage: 20, status: 'confirmado' },
    })
  })

  it('usePedidos sem filtros e com todos os filtros preenchidos monta os params', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { pedidos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(
      () =>
        usePedidos({
          empresaId: 'e1',
          filtros: {
            clienteId: 'cli-1',
            periodoInicio: '2026-06-01',
            periodoFim: '2026-06-30',
          },
        }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/pedidos', {
      params: {
        empresaId: 'e1',
        page: 1,
        perPage: 20,
        clienteId: 'cli-1',
        periodoInicio: '2026-06-01',
        periodoFim: '2026-06-30',
      },
    })
  })

  it('usePedidos sem filtros não adiciona params extras', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { pedidos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(() => usePedidos({ empresaId: 'e1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/pedidos', {
      params: { empresaId: 'e1', page: 1, perPage: 20 },
    })
  })

  it('usePedidos não dispara quando empresaId é null', () => {
    renderHook(() => usePedidos({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('usePedido busca o detalhe quando há empresaId e pedidoId', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { pedido: { id: 'pd1' } } })

    const { result } = renderHook(() => usePedido({ empresaId: 'e1', pedidoId: 'pd1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/pedidos/pd1', { params: { empresaId: 'e1' } })
    expect(result.current.data).toEqual({ id: 'pd1' })
  })

  it('usePedido não dispara sem pedidoId', () => {
    renderHook(() => usePedido({ empresaId: 'e1', pedidoId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useCriarPedido faz POST em /api/pedidos', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { pedido: { id: 'pd1' } } })

    const { result } = renderHook(() => useCriarPedido(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({
        empresaId: 'e1',
        clienteId: 'c1',
        data: '2026-06-27T00:00:00.000Z',
        itens: [{ produtoId: 'p1', quantidade: 10 }],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/pedidos',
      expect.objectContaining({ empresaId: 'e1', clienteId: 'c1' }),
    )
    expect(result.current.data).toEqual({ id: 'pd1' })
  })

  it('useConfirmarPedido faz POST em /confirmar com empresaId', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { pedido: { id: 'pd1' } } })

    const { result } = renderHook(() => useConfirmarPedido(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ pedidoId: 'pd1', empresaId: 'e1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/pedidos/pd1/confirmar', { empresaId: 'e1' })
  })

  it('useCancelarPedido faz POST em /cancelar com empresaId', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { pedido: { id: 'pd1' } } })

    const { result } = renderHook(() => useCancelarPedido(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ pedidoId: 'pd1', empresaId: 'e1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/pedidos/pd1/cancelar', { empresaId: 'e1' })
  })
})
