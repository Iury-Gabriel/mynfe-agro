import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const AUDITORIA_ACOES = ['criar', 'editar', 'excluir', 'emitir', 'ajustar'] as const
export type AuditoriaAcao = (typeof AUDITORIA_ACOES)[number]

export interface AuditoriaLog {
  id: string
  tenantId: string
  usuarioId: string | null
  entidade: string
  entidadeId: string
  acao: AuditoriaAcao
  dadosAntes: Record<string, unknown> | null
  dadosDepois: Record<string, unknown> | null
  data: string
}

export interface ListAuditoriaResponse {
  logs: AuditoriaLog[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface AuditoriaFilters {
  page?: number
  perPage?: number
  entidade?: string
  acao?: AuditoriaAcao
  usuarioId?: string
}

export const AUDITORIA_QUERY_KEY = ['admin', 'auditoria'] as const

export function useAuditoriaLogs({
  page = 1,
  perPage = 20,
  entidade,
  acao,
  usuarioId,
}: AuditoriaFilters = {}) {
  return useQuery({
    queryKey: [...AUDITORIA_QUERY_KEY, { page, perPage, entidade, acao, usuarioId }],
    queryFn: async () => {
      const { data } = await api.get<ListAuditoriaResponse>('/api/auditoria', {
        params: { page, perPage, entidade, acao, usuarioId },
      })
      return data
    },
  })
}
