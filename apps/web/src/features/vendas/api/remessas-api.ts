import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ESTOQUE_QUERY_KEY, MOVIMENTOS_QUERY_KEY } from '@/features/estoque/api/colheitas-api'
import { PEDIDOS_QUERY_KEY } from '@/features/vendas/api/pedidos-api'
import { api } from '@/lib/api-client'

export const REMESSAS_QUERY_KEY = ['vendas', 'remessas'] as const

export type RemessaStatus = 'aberta' | 'entregue' | 'consolidada' | 'cancelada'

export interface RemessaItem {
  id: string
  produtoId: string
  loteId: string | null
  quantidade: number
  precoUnitario: number
  valorTotal: number
}

export interface RemessaLote {
  id: string
  produtoId: string
  codigoLote: string
  quantidadeAtual: number
}

export interface Remessa {
  id: string
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  numero: string
  status: RemessaStatus
  pedidoConsolidadoId: string | null
  valorEstimado: number
  data: string
  observacoes: string | null
  itens: RemessaItem[]
  lotes: RemessaLote[]
  createdAt: string
  updatedAt: string
}

export interface ListRemessasResponse {
  remessas: Remessa[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface RemessasFiltros {
  status?: RemessaStatus
  clienteId?: string
  periodoInicio?: string
  periodoFim?: string
}

export interface CriarRemessaItemInput {
  produtoId: string
  loteId?: string | null
  quantidade: number
  precoUnitario?: number | null
}

export interface CriarRemessaInput {
  empresaId: string
  clienteId: string
  data: string
  observacoes?: string | null
  itens: CriarRemessaItemInput[]
}

function cleanFiltros(filtros?: RemessasFiltros): Record<string, string> {
  const params: Record<string, string> = {}
  if (!filtros) return params
  if (filtros.status) params.status = filtros.status
  if (filtros.clienteId) params.clienteId = filtros.clienteId
  if (filtros.periodoInicio) params.periodoInicio = filtros.periodoInicio
  if (filtros.periodoFim) params.periodoFim = filtros.periodoFim
  return params
}

export function useRemessas({
  empresaId,
  filtros,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  filtros?: RemessasFiltros
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...REMESSAS_QUERY_KEY, { empresaId, filtros, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<ListRemessasResponse>('/api/remessas', {
        params: { empresaId, page, perPage, ...cleanFiltros(filtros) },
      })
      return data
    },
  })
}

export function useRemessa({
  empresaId,
  remessaId,
}: {
  empresaId: string | null
  remessaId: string | null
}) {
  return useQuery({
    queryKey: [...REMESSAS_QUERY_KEY, 'detail', { empresaId, remessaId }],
    enabled: !!empresaId && !!remessaId,
    queryFn: async () => {
      const { data } = await api.get<{ remessa: Remessa }>(`/api/remessas/${remessaId}`, {
        params: { empresaId },
      })
      return data.remessa
    },
  })
}

export function useCriarRemessa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CriarRemessaInput) => {
      const { data } = await api.post<{ remessa: Remessa }>('/api/remessas', body)
      return data.remessa
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: REMESSAS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}

export function useMarcarRemessaEntregue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ remessaId, empresaId }: { remessaId: string; empresaId: string }) => {
      const { data } = await api.post<{ remessa: Remessa }>(`/api/remessas/${remessaId}/entregue`, {
        empresaId,
      })
      return data.remessa
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: REMESSAS_QUERY_KEY })
    },
  })
}

export function useCancelarRemessa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ remessaId, empresaId }: { remessaId: string; empresaId: string }) => {
      const { data } = await api.post<{ remessa: Remessa }>(`/api/remessas/${remessaId}/cancelar`, {
        empresaId,
      })
      return data.remessa
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: REMESSAS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}
