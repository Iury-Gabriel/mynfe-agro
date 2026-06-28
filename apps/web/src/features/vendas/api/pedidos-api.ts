import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ESTOQUE_QUERY_KEY, MOVIMENTOS_QUERY_KEY } from '@/features/estoque/api/colheitas-api'
import { api } from '@/lib/api-client'

export const PEDIDOS_QUERY_KEY = ['vendas', 'pedidos'] as const

export type PedidoTipo = 'avulso' | 'consolidado'
export type PedidoStatus = 'rascunho' | 'confirmado' | 'faturado' | 'cancelado'

export interface PedidoItem {
  id: string
  produtoId: string
  loteId: string | null
  quantidade: number
  precoUnitario: number
  valorTotal: number
}

export interface PedidoRemessaVinculo {
  id: string
  numero: string
  status: string
  valorEstimado: number
}

export interface Pedido {
  id: string
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  numero: string
  tipo: PedidoTipo
  status: PedidoStatus
  valorTotal: number
  periodoConsolidacao: string | null
  data: string
  observacoes: string | null
  itens: PedidoItem[]
  remessas: PedidoRemessaVinculo[]
  createdAt: string
  updatedAt: string
}

export interface ListPedidosResponse {
  pedidos: Pedido[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PedidosFiltros {
  status?: PedidoStatus
  clienteId?: string
  periodoInicio?: string
  periodoFim?: string
}

export interface CriarPedidoItemInput {
  produtoId: string
  loteId?: string | null
  quantidade: number
  precoUnitario?: number | null
}

export interface CriarPedidoInput {
  empresaId: string
  clienteId: string
  data: string
  confirmar?: boolean
  observacoes?: string | null
  itens: CriarPedidoItemInput[]
}

function cleanFiltros(filtros?: PedidosFiltros): Record<string, string> {
  const params: Record<string, string> = {}
  if (!filtros) return params
  if (filtros.status) params.status = filtros.status
  if (filtros.clienteId) params.clienteId = filtros.clienteId
  if (filtros.periodoInicio) params.periodoInicio = filtros.periodoInicio
  if (filtros.periodoFim) params.periodoFim = filtros.periodoFim
  return params
}

export function usePedidos({
  empresaId,
  filtros,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  filtros?: PedidosFiltros
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...PEDIDOS_QUERY_KEY, { empresaId, filtros, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<ListPedidosResponse>('/api/pedidos', {
        params: { empresaId, page, perPage, ...cleanFiltros(filtros) },
      })
      return data
    },
  })
}

export function usePedido({
  empresaId,
  pedidoId,
}: {
  empresaId: string | null
  pedidoId: string | null
}) {
  return useQuery({
    queryKey: [...PEDIDOS_QUERY_KEY, 'detail', { empresaId, pedidoId }],
    enabled: !!empresaId && !!pedidoId,
    queryFn: async () => {
      const { data } = await api.get<{ pedido: Pedido }>(`/api/pedidos/${pedidoId}`, {
        params: { empresaId },
      })
      return data.pedido
    },
  })
}

export function useCriarPedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CriarPedidoInput) => {
      const { data } = await api.post<{ pedido: Pedido }>('/api/pedidos', body)
      return data.pedido
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}

export function useConfirmarPedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pedidoId, empresaId }: { pedidoId: string; empresaId: string }) => {
      const { data } = await api.post<{ pedido: Pedido }>(`/api/pedidos/${pedidoId}/confirmar`, {
        empresaId,
      })
      return data.pedido
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}

export function useCancelarPedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pedidoId, empresaId }: { pedidoId: string; empresaId: string }) => {
      const { data } = await api.post<{ pedido: Pedido }>(`/api/pedidos/${pedidoId}/cancelar`, {
        empresaId,
      })
      return data.pedido
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}
