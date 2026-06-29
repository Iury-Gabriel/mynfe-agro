import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateFichaTecnica,
  useDeleteFichaTecnica,
  useFichasTecnicas,
  useUpdateFichaTecnica,
} from './fichas-tecnicas-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  fichasTecnicas: [],
  total: 0,
  page: 1,
  perPage: 50,
  totalPages: 1,
}

describe('fichas-tecnicas-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useFichasTecnicas busca por produtoId com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useFichasTecnicas({ produtoId: 'p1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/fichas-tecnicas', {
      params: { produtoId: 'p1', page: 1, perPage: 50 },
    })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useFichasTecnicas não dispara a request quando produtoId é null', async () => {
    renderHook(() => useFichasTecnicas({ produtoId: null }), { wrapper: createWrapper('/') })

    await waitFor(() => expect(api.get).not.toHaveBeenCalled())
  })

  it('useFichasTecnicas expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useFichasTecnicas({ produtoId: 'p1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateFichaTecnica faz POST e retorna a ficha criada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { fichaTecnica: { id: 'f1' } } })

    const { result } = renderHook(() => useCreateFichaTecnica(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ produtoId: 'p1', descricaoComponente: 'Milho' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/fichas-tecnicas',
      expect.objectContaining({ produtoId: 'p1', descricaoComponente: 'Milho' }),
    )
    expect(result.current.data).toEqual({ id: 'f1' })
  })

  it('useUpdateFichaTecnica faz PATCH no id com o restante do body', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { fichaTecnica: { id: 'f1' } } })

    const { result } = renderHook(() => useUpdateFichaTecnica(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'f1', descricaoComponente: 'Soja' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/fichas-tecnicas/f1', { descricaoComponente: 'Soja' })
  })

  it('useDeleteFichaTecnica faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { success: true } })

    const { result } = renderHook(() => useDeleteFichaTecnica(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('f1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/fichas-tecnicas/f1')
    expect(result.current.data).toEqual({ success: true })
  })
})
