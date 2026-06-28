import type {
  AmbienteFiscal,
  EmpresaEndereco,
  EmpresaStatus,
  TipoPessoa,
} from '@/domain/enterprise/entities/empresa'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Empresa } from '@/domain/enterprise/entities/empresa'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

export interface MakeEmpresaOverrides {
  id?: string
  tenantId?: string
  tipoPessoa?: TipoPessoa
  razaoSocial?: string
  nomeFantasia?: string | null
  cnpjCpf?: string
  inscricaoEstadual?: string | null
  ieProdutorRural?: string | null
  regimeTributario?: string
  crt?: string
  ambienteFiscal?: AmbienteFiscal
  serieNfe?: number | null
  proximaNumeracaoNfe?: number
  status?: EmpresaStatus
  endereco?: Partial<EmpresaEndereco>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

function makeCnpjCpf(raw: string): CnpjCpf {
  const result = CnpjCpf.create(raw)
  if (result.isLeft()) throw new Error(`makeEmpresa: CNPJ/CPF inválido na factory: ${raw}`)
  return result.value
}

export function makeEmpresa(overrides: MakeEmpresaOverrides = {}): Empresa {
  return Empresa.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      tipoPessoa: overrides.tipoPessoa ?? 'PJ',
      razaoSocial: overrides.razaoSocial ?? 'Agro Empresa LTDA',
      nomeFantasia: overrides.nomeFantasia ?? null,
      cnpjCpf: makeCnpjCpf(overrides.cnpjCpf ?? '11222333000181'),
      inscricaoEstadual: overrides.inscricaoEstadual ?? null,
      ieProdutorRural: overrides.ieProdutorRural ?? null,
      regimeTributario: overrides.regimeTributario ?? 'simples_nacional',
      crt: overrides.crt ?? '1',
      ambienteFiscal: overrides.ambienteFiscal ?? 'homologacao',
      serieNfe: overrides.serieNfe ?? null,
      proximaNumeracaoNfe: overrides.proximaNumeracaoNfe ?? 1,
      status: overrides.status ?? 'ativo',
      endereco: overrides.endereco,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'empresa-1'),
  )
}
