import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { FILA_FATURAMENTO_QUERY_KEY } from '@/features/fiscal/api/fila-faturamento-api'
import { api } from '@/lib/api-client'

export const NOTAS_FISCAIS_QUERY_KEY = ['fiscal', 'notas-fiscais'] as const

export const NOTA_FISCAL_STATUSES = [
  'pendente',
  'emitindo',
  'autorizada',
  'rejeitada',
  'cancelada',
] as const

export type NotaFiscalStatus = (typeof NOTA_FISCAL_STATUSES)[number]

export interface NotaFiscalItem {
  id: string
  produtoId: string
  descricao: string
  ncm: string | null
  cfop: string | null
  cstCsosn: string | null
  quantidade: number
  valorUnitario: number
  valorTotal: number
  impostos: Record<string, unknown>
}

export interface NotaFiscalEvento {
  id: string
  tipo: string
  payload: Record<string, unknown>
  data: string
}

export interface NotaFiscal {
  id: string
  tenantId: string
  empresaEmitenteId: string
  pedidoId: string
  clienteId: string
  numero: string | null
  serie: string | null
  modelo: string
  naturezaOperacao: string | null
  status: NotaFiscalStatus
  chaveAcesso: string | null
  protocolo: string | null
  valorTotal: number
  ambiente: string
  xmlUrl: string | null
  danfeUrl: string | null
  mensagemRetorno: string | null
  dataEmissao: string | null
  itens: NotaFiscalItem[]
  eventos: NotaFiscalEvento[]
  createdAt: string
  updatedAt: string
}

export interface ListNotasResponse {
  notas: NotaFiscal[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface NotasFiltros {
  status?: NotaFiscalStatus
  clienteId?: string
  pedidoId?: string
}

export interface EmitirNotaInput {
  empresaId: string
  pedidoId: string
  naturezaOperacao?: string | null
}

export interface CancelarNotaInput {
  notaId: string
  empresaId: string
  motivo?: string | null
}

function cleanFiltros(filtros?: NotasFiltros): Record<string, string> {
  const params: Record<string, string> = {}
  if (!filtros) return params
  if (filtros.status) params.status = filtros.status
  if (filtros.clienteId) params.clienteId = filtros.clienteId
  if (filtros.pedidoId) params.pedidoId = filtros.pedidoId
  return params
}

export function useNotasFiscais({
  empresaId,
  filtros,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  filtros?: NotasFiltros
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...NOTAS_FISCAIS_QUERY_KEY, { empresaId, filtros, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<ListNotasResponse>('/api/notas-fiscais', {
        params: { empresaId, page, perPage, ...cleanFiltros(filtros) },
      })
      return data
    },
  })
}

export function useNotaFiscal({
  empresaId,
  notaId,
}: {
  empresaId: string | null
  notaId: string | null
}) {
  return useQuery({
    queryKey: [...NOTAS_FISCAIS_QUERY_KEY, 'detail', { empresaId, notaId }],
    enabled: !!empresaId && !!notaId,
    queryFn: async () => {
      const { data } = await api.get<{ nota: NotaFiscal }>(`/api/notas-fiscais/${notaId}`, {
        params: { empresaId },
      })
      return data.nota
    },
  })
}

export function useEmitirNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: EmitirNotaInput) => {
      const { data } = await api.post<{ nota: NotaFiscal }>('/api/notas-fiscais/emitir', body)
      return data.nota
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTAS_FISCAIS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: FILA_FATURAMENTO_QUERY_KEY })
    },
  })
}

export function useCancelarNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ notaId, empresaId, motivo }: CancelarNotaInput) => {
      const { data } = await api.post<{ nota: NotaFiscal }>(
        `/api/notas-fiscais/${notaId}/cancelar`,
        { empresaId, motivo },
      )
      return data.nota
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTAS_FISCAIS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: FILA_FATURAMENTO_QUERY_KEY })
    },
  })
}
