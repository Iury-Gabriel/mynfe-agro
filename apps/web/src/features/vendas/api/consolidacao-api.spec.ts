import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useConsolidacaoPreview, useConsolidar } from './consolidacao-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

describe('consolidacao-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useConsolidacaoPreview não dispara quando enabled é false', () => {
    renderHook(
      () =>
        useConsolidacaoPreview({
          empresaId: 'e1',
          clienteId: 'c1',
          periodoInicio: '2026-06-01',
          periodoFim: '2026-06-30',
          enabled: false,
        }),
      { wrapper: createWrapper('/') },
    )
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useConsolidacaoPreview busca quando habilitado e completo', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { remessas: [], itens: [], valorTotal: 0 } })

    const { result } = renderHook(
      () =>
        useConsolidacaoPreview({
          empresaId: 'e1',
          clienteId: 'c1',
          periodoInicio: '2026-06-01',
          periodoFim: '2026-06-30',
          enabled: true,
        }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/consolidacao/preview', {
      params: {
        empresaId: 'e1',
        clienteId: 'c1',
        periodoInicio: '2026-06-01',
        periodoFim: '2026-06-30',
      },
    })
  })

  it('useConsolidar faz POST em /api/consolidacao', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { pedido: { id: 'pd1' }, remessas: [] } })

    const { result } = renderHook(() => useConsolidar(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({
        empresaId: 'e1',
        clienteId: 'c1',
        periodoInicio: '2026-06-01',
        periodoFim: '2026-06-30',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/consolidacao',
      expect.objectContaining({ empresaId: 'e1', clienteId: 'c1' }),
    )
    expect(result.current.data).toEqual({ pedido: { id: 'pd1' }, remessas: [] })
  })
})
