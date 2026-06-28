import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const FILA_FATURAMENTO_QUERY_KEY = ['fiscal', 'fila-faturamento'] as const

export type FilaPedidoTipo = 'avulso' | 'consolidado'

export interface FilaPedido {
  id: string
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  numero: string
  tipo: FilaPedidoTipo
  status: string
  valorTotal: number
  data: string
}

export interface ListFilaResponse {
  pedidos: FilaPedido[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export function useFilaFaturamento({
  empresaId,
  clienteId,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  clienteId?: string
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...FILA_FATURAMENTO_QUERY_KEY, { empresaId, clienteId, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const params: Record<string, string | number> = { empresaId: empresaId ?? '', page, perPage }
      if (clienteId) params.clienteId = clienteId
      const { data } = await api.get<ListFilaResponse>('/api/fila-faturamento', { params })
      return data
    },
  })
}
