import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLoteRastreabilidade, useLotes } from './lotes-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

const listResponse = {
  lotes: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('lotes-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useLotes busca com empresaId e paginação default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useLotes({ empresaId: 'e1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/lotes', {
      params: { empresaId: 'e1', page: 1, perPage: 20 },
    })
  })

  it('useLotes não dispara quando empresaId é null', () => {
    renderHook(() => useLotes({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useLoteRastreabilidade busca a cadeia do lote', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { lote: { id: 'l1' }, montante: {}, jusante: { pedidoItens: [], remessaItens: [] } },
    })

    const { result } = renderHook(() => useLoteRastreabilidade('l1'), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/lotes/l1/rastreabilidade')
  })

  it('useLoteRastreabilidade não dispara quando loteId é null', () => {
    renderHook(() => useLoteRastreabilidade(null), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })
})
