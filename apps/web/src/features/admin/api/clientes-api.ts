import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const TIPOS_PESSOA_CLIENTE = ['PJ', 'PF'] as const
export type TipoPessoaCliente = (typeof TIPOS_PESSOA_CLIENTE)[number]

export const INDICADORES_IE = ['1', '2', '9'] as const
export type IndicadorIe = (typeof INDICADORES_IE)[number]

export interface Cliente {
  id: string
  tenantId: string
  tipoPessoa: TipoPessoaCliente
  razaoSocialNome: string
  cnpjCpf: string
  cnpjCpfFormatado: string
  inscricaoEstadual: string | null
  indicadorIe: IndicadorIe
  contribuinteIcms: boolean
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  codMunicipioIbge: string | null
  uf: string | null
  email: string | null
  telefone: string | null
  vendedorUsuarioId: string | null
  createdAt: string
  updatedAt: string
}

export interface ListClientesResponse {
  clientes: Cliente[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateClienteInput {
  tipoPessoa: TipoPessoaCliente
  razaoSocialNome: string
  cnpjCpf: string
  inscricaoEstadual?: string | null
  indicadorIe: IndicadorIe
  contribuinteIcms: boolean
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  uf?: string | null
  email?: string | null
  telefone?: string | null
}

export interface UpdateClienteInput extends Partial<CreateClienteInput> {
  id: string
}

export const CLIENTES_QUERY_KEY = ['admin', 'clientes'] as const

export function useClientes({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...CLIENTES_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListClientesResponse>('/api/clientes', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateClienteInput) => {
      const { data } = await api.post<{ cliente: Cliente }>('/api/clientes', body)
      return data.cliente
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY }),
  })
}

export function useUpdateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateClienteInput) => {
      const { data } = await api.patch<{ cliente: Cliente }>(`/api/clientes/${id}`, body)
      return data.cliente
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY }),
  })
}

export function useDeleteCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ cliente: Cliente }>(`/api/clientes/${id}`)
      return data.cliente
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY }),
  })
}
