import type { IndicadorIe, TipoPessoaCliente } from '@/domain/enterprise/entities/cliente'
import type { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Cliente } from '@/domain/enterprise/entities/cliente'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

export interface MakeClienteOverrides {
  id?: string
  tenantId?: string
  tipoPessoa?: TipoPessoaCliente
  razaoSocialNome?: string
  cnpjCpf?: string
  inscricaoEstadual?: string | null
  indicadorIe?: IndicadorIe
  contribuinteIcms?: boolean
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  codMunicipioIbge?: string | null
  uf?: string | null
  email?: string | null
  telefone?: string | null
  vendedorUsuarioId?: string | null
  enderecosEntrega?: ClienteEnderecoEntrega[]
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

function makeCnpjCpf(raw: string): CnpjCpf {
  const result = CnpjCpf.create(raw)
  if (result.isLeft()) throw new Error(`makeCliente: CNPJ/CPF inválido na factory: ${raw}`)
  return result.value
}

export function makeCliente(overrides: MakeClienteOverrides = {}): Cliente {
  return Cliente.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      tipoPessoa: overrides.tipoPessoa ?? 'PJ',
      razaoSocialNome: overrides.razaoSocialNome ?? 'Cliente Agro LTDA',
      cnpjCpf: makeCnpjCpf(overrides.cnpjCpf ?? '11222333000181'),
      inscricaoEstadual: overrides.inscricaoEstadual ?? null,
      indicadorIe: overrides.indicadorIe ?? '1',
      contribuinteIcms: overrides.contribuinteIcms ?? true,
      enderecoLogradouro: overrides.enderecoLogradouro ?? null,
      enderecoNumero: overrides.enderecoNumero ?? null,
      enderecoBairro: overrides.enderecoBairro ?? null,
      enderecoCep: overrides.enderecoCep ?? null,
      municipio: overrides.municipio ?? null,
      codMunicipioIbge: overrides.codMunicipioIbge ?? null,
      uf: overrides.uf ?? null,
      email: overrides.email ?? null,
      telefone: overrides.telefone ?? null,
      vendedorUsuarioId: overrides.vendedorUsuarioId ?? null,
      enderecosEntrega: overrides.enderecosEntrega ?? [],
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'cliente-1'),
  )
}
