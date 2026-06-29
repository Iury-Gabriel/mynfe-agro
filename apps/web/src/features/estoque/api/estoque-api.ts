import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  ESTOQUE_QUERY_KEY,
  MOVIMENTOS_QUERY_KEY,
} from '@/features/estoque/api/colheitas-api'
import { api } from '@/lib/api-client'

export interface EstoqueSaldo {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  loteId: string | null
  quantidadeDisponivel: number
  quantidadeReservada: number
  createdAt: string
  updatedAt: string
}

export interface EstoqueMovimento {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  loteId: string | null
  tipo: string
  origem: string
  referenciaId: string | null
  quantidade: number
  data: string
  usuarioId: string | null
  motivo: string | null
  createdAt: string
  updatedAt: string
}

export interface PosicaoEstoqueResponse {
  saldos: EstoqueSaldo[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface MovimentacoesResponse {
  movimentos: EstoqueMovimento[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface MovimentacoesFiltros {
  produtoId?: string
  loteId?: string
  tipo?: string
  origem?: string
}

export interface AjustarEstoqueInput {
  empresaId: string
  produtoId: string
  delta: number
  motivo: string
  data: string
  loteId?: string | null
}

export function usePosicaoEstoque({
  empresaId,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...ESTOQUE_QUERY_KEY, { empresaId, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<PosicaoEstoqueResponse>('/api/estoque/posicao', {
        params: { empresaId, page, perPage },
      })
      return data
    },
  })
}

export function useMovimentacoes({
  empresaId,
  filtros,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  filtros?: MovimentacoesFiltros
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...MOVIMENTOS_QUERY_KEY, { empresaId, filtros, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<MovimentacoesResponse>('/api/estoque/movimentos', {
        params: { empresaId, page, perPage, ...filtros },
      })
      return data
    },
  })
}

export function useAjustarEstoque() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: AjustarEstoqueInput) => {
      const { data } = await api.post<{ movimento: EstoqueMovimento; saldo: EstoqueSaldo }>(
        '/api/estoque/ajustes',
        body,
      )
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}
