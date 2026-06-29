import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const ATIVIDADE_CAMPO_TIPOS = [
  'plantio',
  'irrigacao',
  'pulverizacao',
  'adubacao',
  'outro',
] as const
export type AtividadeCampoTipo = (typeof ATIVIDADE_CAMPO_TIPOS)[number]

export interface AtividadeCampo {
  id: string
  tenantId: string
  safraId: string | null
  areaId: string | null
  tipo: AtividadeCampoTipo
  data: string
  responsavelUsuarioId: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ListAtividadesCampoResponse {
  atividades: AtividadeCampo[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateAtividadeCampoInput {
  safraId?: string | null
  areaId?: string | null
  tipo: AtividadeCampoTipo
  data: string
  responsavelUsuarioId?: string | null
  observacoes?: string | null
}

export const ATIVIDADES_CAMPO_QUERY_KEY = ['admin', 'atividades-campo'] as const

export function useAtividadesCampo({
  page = 1,
  perPage = 20,
}: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...ATIVIDADES_CAMPO_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListAtividadesCampoResponse>('/api/atividades-campo', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateAtividadeCampo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateAtividadeCampoInput) => {
      const { data } = await api.post<{ atividade: AtividadeCampo }>('/api/atividades-campo', body)
      return data.atividade
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ATIVIDADES_CAMPO_QUERY_KEY }),
  })
}

export function useDeleteAtividadeCampo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ atividade: AtividadeCampo }>(`/api/atividades-campo/${id}`)
      return data.atividade
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ATIVIDADES_CAMPO_QUERY_KEY }),
  })
}
