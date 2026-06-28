import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCancelarNota,
  useEmitirNota,
  useNotaFiscal,
  useNotasFiscais,
} from './notas-fiscais-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

describe('notas-fiscais-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useNotasFiscais busca com empresaId, paginação e filtros limpos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { notas: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(
      () => useNotasFiscais({ empresaId: 'e1', filtros: { status: 'autorizada', clienteId: '' } }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/notas-fiscais', {
      params: { empresaId: 'e1', page: 1, perPage: 20, status: 'autorizada' },
    })
  })

  it('useNotasFiscais não dispara quando empresaId é null', () => {
    renderHook(() => useNotasFiscais({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useNotaFiscal busca o detalhe quando há empresaId e notaId', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { nota: { id: 'nf1' } } })

    const { result } = renderHook(() => useNotaFiscal({ empresaId: 'e1', notaId: 'nf1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/notas-fiscais/nf1', { params: { empresaId: 'e1' } })
    expect(result.current.data).toEqual({ id: 'nf1' })
  })

  it('useNotaFiscal não dispara sem notaId', () => {
    renderHook(() => useNotaFiscal({ empresaId: 'e1', notaId: null }), {
      wrapper: createWrapper('/'),
    })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useEmitirNota faz POST em /notas-fiscais/emitir', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { nota: { id: 'nf1', status: 'autorizada' } } })

    const { result } = renderHook(() => useEmitirNota(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ empresaId: 'e1', pedidoId: 'pd1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/notas-fiscais/emitir', {
      empresaId: 'e1',
      pedidoId: 'pd1',
    })
    expect(result.current.data).toEqual({ id: 'nf1', status: 'autorizada' })
  })

  it('useCancelarNota faz POST em /:id/cancelar com empresaId e motivo', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { nota: { id: 'nf1' } } })

    const { result } = renderHook(() => useCancelarNota(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ notaId: 'nf1', empresaId: 'e1', motivo: 'erro' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/notas-fiscais/nf1/cancelar', {
      empresaId: 'e1',
      motivo: 'erro',
    })
  })
})
