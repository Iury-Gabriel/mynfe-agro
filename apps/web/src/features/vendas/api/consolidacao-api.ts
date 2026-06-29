import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ESTOQUE_QUERY_KEY, MOVIMENTOS_QUERY_KEY } from '@/features/estoque/api/colheitas-api'
import { PEDIDOS_QUERY_KEY, type Pedido } from '@/features/vendas/api/pedidos-api'
import { REMESSAS_QUERY_KEY, type Remessa } from '@/features/vendas/api/remessas-api'
import { api } from '@/lib/api-client'

export const CONSOLIDACAO_QUERY_KEY = ['vendas', 'consolidacao'] as const

export interface ConsolidacaoItem {
  produtoId: string
  precoUnitario: number
  quantidade: number
  valorTotal: number
}

export interface ConsolidacaoPreviewResponse {
  remessas: Remessa[]
  itens: ConsolidacaoItem[]
  valorTotal: number
}

export interface ConsolidacaoPreviewInput {
  empresaId: string | null
  clienteId: string | null
  periodoInicio: string | null
  periodoFim: string | null
  enabled?: boolean
}

export interface ConsolidarInput {
  empresaId: string
  clienteId: string
  periodoInicio: string
  periodoFim: string
  observacoes?: string | null
}

export interface ConsolidarResponse {
  pedido: Pedido
  remessas: Remessa[]
}

export function useConsolidacaoPreview({
  empresaId,
  clienteId,
  periodoInicio,
  periodoFim,
  enabled = false,
}: ConsolidacaoPreviewInput) {
  return useQuery({
    queryKey: [
      ...CONSOLIDACAO_QUERY_KEY,
      'preview',
      { empresaId, clienteId, periodoInicio, periodoFim },
    ],
    enabled: enabled && !!empresaId && !!clienteId && !!periodoInicio && !!periodoFim,
    queryFn: async () => {
      const { data } = await api.get<ConsolidacaoPreviewResponse>('/api/consolidacao/preview', {
        params: { empresaId, clienteId, periodoInicio, periodoFim },
      })
      return data
    },
  })
}

export function useConsolidar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: ConsolidarInput) => {
      const { data } = await api.post<ConsolidarResponse>('/api/consolidacao', body)
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: REMESSAS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: CONSOLIDACAO_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}
