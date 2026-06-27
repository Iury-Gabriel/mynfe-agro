import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const TIPOS_PESSOA = ['PJ', 'PF'] as const
export type TipoPessoa = (typeof TIPOS_PESSOA)[number]

export const AMBIENTES_FISCAIS = ['homologacao', 'producao'] as const
export type AmbienteFiscal = (typeof AMBIENTES_FISCAIS)[number]

export const EMPRESA_STATUSES = ['ativo', 'inativo'] as const
export type EmpresaStatus = (typeof EMPRESA_STATUSES)[number]

export interface EmpresaEndereco {
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  municipio: string | null
  uf: string | null
  cep: string | null
}

export interface Empresa {
  id: string
  tenantId: string
  tipoPessoa: TipoPessoa
  razaoSocial: string
  nomeFantasia: string | null
  cnpjCpf: string
  cnpjCpfFormatado: string
  inscricaoEstadual: string | null
  ieProdutorRural: string | null
  regimeTributario: string
  crt: string
  ambienteFiscal: AmbienteFiscal
  serieNfe: number | null
  status: EmpresaStatus
  endereco: EmpresaEndereco
  createdAt: string
  updatedAt: string
}

export interface ListEmpresasResponse {
  empresas: Empresa[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateEmpresaInput {
  tipoPessoa: TipoPessoa
  razaoSocial: string
  nomeFantasia?: string | null
  cnpjCpf: string
  inscricaoEstadual?: string | null
  ieProdutorRural?: string | null
  regimeTributario: string
  crt: string
  ambienteFiscal: AmbienteFiscal
  serieNfe?: number | null
  endereco?: Partial<EmpresaEndereco>
}

export interface UpdateEmpresaInput extends Partial<CreateEmpresaInput> {
  id: string
}

export const EMPRESAS_QUERY_KEY = ['admin', 'empresas'] as const

export function useEmpresas({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...EMPRESAS_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListEmpresasResponse>('/api/empresas', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateEmpresaInput) => {
      const { data } = await api.post<{ empresa: Empresa }>('/api/empresas', body)
      return data.empresa
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPRESAS_QUERY_KEY }),
  })
}

export function useUpdateEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateEmpresaInput) => {
      const { data } = await api.patch<{ empresa: Empresa }>(`/api/empresas/${id}`, body)
      return data.empresa
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPRESAS_QUERY_KEY }),
  })
}

export function useSetEmpresaStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EmpresaStatus }) => {
      const action = status === 'ativo' ? 'activate' : 'deactivate'
      const { data } = await api.patch<{ empresa: Empresa }>(`/api/empresas/${id}/${action}`)
      return data.empresa
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPRESAS_QUERY_KEY }),
  })
}

export function useSetActiveEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (empresaId: string) => {
      const { data } = await api.post<{ empresa: Empresa }>('/api/empresas/active', { empresaId })
      return data.empresa
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPRESAS_QUERY_KEY }),
  })
}
