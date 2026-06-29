import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAtividadesCampo,
  useCreateAtividadeCampo,
  useDeleteAtividadeCampo,
} from './atividades-campo-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  atividades: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('atividades-campo-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useAtividadesCampo busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useAtividadesCampo(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/atividades-campo', {
      params: { page: 1, perPage: 20 },
    })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useAtividadesCampo respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useAtividadesCampo({ page: 2, perPage: 40 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/atividades-campo', {
      params: { page: 2, perPage: 40 },
    })
  })

  it('useAtividadesCampo expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useAtividadesCampo(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateAtividadeCampo faz POST e retorna a atividade criada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { atividade: { id: 'at1' } } })

    const { result } = renderHook(() => useCreateAtividadeCampo(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ tipo: 'plantio', data: '2026-01-01' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/atividades-campo',
      expect.objectContaining({ tipo: 'plantio' }),
    )
    expect(result.current.data).toEqual({ id: 'at1' })
  })

  it('useDeleteAtividadeCampo faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { atividade: { id: 'at1' } } })

    const { result } = renderHook(() => useDeleteAtividadeCampo(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('at1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/atividades-campo/at1')
    expect(result.current.data).toEqual({ id: 'at1' })
  })
})
