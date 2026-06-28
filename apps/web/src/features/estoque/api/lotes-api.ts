import { useQuery } from '@tanstack/react-query'

import type { Colheita, Lote } from '@/features/estoque/api/colheitas-api'

import { LOTES_QUERY_KEY } from '@/features/estoque/api/colheitas-api'
import { api } from '@/lib/api-client'

export type { Lote } from '@/features/estoque/api/colheitas-api'

export interface ListLotesResponse {
  lotes: Lote[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PedidoItemConsumo {
  itemId: string
  pedidoId: string
  numero: string
  clienteId: string
  clienteNome: string
  quantidade: number
  data: string
  status: string
}

export interface RemessaItemConsumo {
  itemId: string
  remessaId: string
  numero: string
  clienteId: string
  clienteNome: string
  quantidade: number
  data: string
  status: string
}

export interface LoteRastreabilidade {
  lote: Lote
  montante: {
    colheita: Colheita | null
    safraId: string | null
    areaId: string | null
  }
  jusante: {
    pedidoItens: PedidoItemConsumo[]
    remessaItens: RemessaItemConsumo[]
  }
}

export function useLotes({
  empresaId,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...LOTES_QUERY_KEY, { empresaId, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<ListLotesResponse>('/api/lotes', {
        params: { empresaId, page, perPage },
      })
      return data
    },
  })
}

export function useLoteRastreabilidade(loteId: string | null) {
  return useQuery({
    queryKey: [...LOTES_QUERY_KEY, 'rastreabilidade', loteId],
    enabled: !!loteId,
    queryFn: async () => {
      const { data } = await api.get<LoteRastreabilidade>(`/api/lotes/${loteId}/rastreabilidade`)
      return data
    },
  })
}
