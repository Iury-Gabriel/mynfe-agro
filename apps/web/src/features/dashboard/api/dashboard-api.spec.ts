import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDashboardResumo } from './dashboard-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

const resumo = {
  vendasNoPeriodo: 1000,
  totalPedidos: 3,
  totalRemessas: 1,
  notasEmitidas: 2,
  notasPendentes: 1,
  posicaoEstoque: { totalLotes: 5, lotesVencendo: 1 },
  safrasEmAndamento: 2,
}

describe('dashboard-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useDashboardResumo busca com empresaId e período', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { resumo } })

    const { result } = renderHook(
      () =>
        useDashboardResumo({
          empresaId: 'e1',
          periodoInicio: '2024-10-01',
          periodoFim: '2024-10-31',
        }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/dashboard/resumo', {
      params: { empresaId: 'e1', periodoInicio: '2024-10-01', periodoFim: '2024-10-31' },
    })
    expect(result.current.data).toEqual(resumo)
  })

  it('não dispara quando empresaId é null', () => {
    renderHook(
      () =>
        useDashboardResumo({
          empresaId: null,
          periodoInicio: '2024-10-01',
          periodoFim: '2024-10-31',
        }),
      { wrapper: createWrapper('/') },
    )
    expect(api.get).not.toHaveBeenCalled()
  })
})
