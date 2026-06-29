import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const DASHBOARD_QUERY_KEY = ['dashboard', 'resumo'] as const

export interface DashboardResumo {
  vendasNoPeriodo: number
  totalPedidos: number
  totalRemessas: number
  notasEmitidas: number
  notasPendentes: number
  posicaoEstoque: {
    totalLotes: number
    lotesVencendo: number
  }
  safrasEmAndamento: number
}

export interface DashboardResumoResponse {
  resumo: DashboardResumo
}

export function useDashboardResumo({
  empresaId,
  periodoInicio,
  periodoFim,
}: {
  empresaId: string | null
  periodoInicio: string
  periodoFim: string
}) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, { empresaId, periodoInicio, periodoFim }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<DashboardResumoResponse>('/api/dashboard/resumo', {
        params: { empresaId, periodoInicio, periodoFim },
      })
      return data.resumo
    },
  })
}
