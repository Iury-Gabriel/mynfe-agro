import { Prisma, type Empresa as PrismaEmpresa } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Empresa,
  type AmbienteFiscal,
  type EmpresaStatus,
  type TipoPessoa,
} from '@/domain/enterprise/entities/empresa'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

function parseSerieNfe(raw: string | null): number | null {
  if (raw === null) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function parsePlugnotasConfig(raw: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw
}

function toPrismaJson(
  value: Record<string, unknown> | null,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue)
}

export class PrismaEmpresaMapper {
  static toDomain(raw: PrismaEmpresa): Empresa {
    const cnpjCpfResult = CnpjCpf.create(raw.cnpjCpf)
    if (cnpjCpfResult.isLeft()) {
      throw new Error(`PrismaEmpresaMapper: CNPJ/CPF persistido inválido para empresa ${raw.id}`)
    }

    return Empresa.create(
      {
        tenantId: raw.tenantId,
        tipoPessoa: raw.tipoPessoa as TipoPessoa,
        razaoSocial: raw.razaoSocial,
        nomeFantasia: raw.nomeFantasia,
        cnpjCpf: cnpjCpfResult.value,
        inscricaoEstadual: raw.inscricaoEstadual,
        ieProdutorRural: raw.ieProdutorRural,
        regimeTributario: raw.regimeTributario,
        crt: raw.crt,
        ambienteFiscal: raw.ambienteFiscal as AmbienteFiscal,
        serieNfe: parseSerieNfe(raw.serieNfe),
        proximaNumeracaoNfe: Number(raw.proximaNumeracaoNfe),
        plugnotasConfig: parsePlugnotasConfig(raw.plugnotasConfig),
        status: raw.status as EmpresaStatus,
        endereco: {
          logradouro: raw.enderecoLogradouro,
          numero: raw.enderecoNumero,
          complemento: raw.enderecoComplemento,
          bairro: raw.enderecoBairro,
          municipio: raw.enderecoMunicipio,
          uf: raw.uf,
          cep: raw.enderecoCep,
        },
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(empresa: Empresa): Prisma.EmpresaUncheckedCreateInput {
    return {
      id: empresa.id.toString(),
      tenantId: empresa.tenantId,
      tipoPessoa: empresa.tipoPessoa,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpjCpf: empresa.cnpjCpf.value,
      inscricaoEstadual: empresa.inscricaoEstadual,
      ieProdutorRural: empresa.ieProdutorRural,
      regimeTributario: empresa.regimeTributario,
      crt: empresa.crt,
      ambienteFiscal: empresa.ambienteFiscal,
      serieNfe: empresa.serieNfe === null ? null : String(empresa.serieNfe),
      proximaNumeracaoNfe: BigInt(empresa.proximaNumeracaoNfe),
      plugnotasConfig: toPrismaJson(empresa.plugnotasConfig),
      status: empresa.status,
      enderecoLogradouro: empresa.endereco.logradouro,
      enderecoNumero: empresa.endereco.numero,
      enderecoComplemento: empresa.endereco.complemento,
      enderecoBairro: empresa.endereco.bairro,
      enderecoMunicipio: empresa.endereco.municipio,
      uf: empresa.endereco.uf,
      enderecoCep: empresa.endereco.cep,
      createdAt: empresa.createdAt,
      updatedAt: empresa.updatedAt,
      deletedAt: empresa.deletedAt,
    }
  }

  static toPrismaUpdate(empresa: Empresa): Prisma.EmpresaUncheckedUpdateInput {
    return {
      tipoPessoa: empresa.tipoPessoa,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpjCpf: empresa.cnpjCpf.value,
      inscricaoEstadual: empresa.inscricaoEstadual,
      ieProdutorRural: empresa.ieProdutorRural,
      regimeTributario: empresa.regimeTributario,
      crt: empresa.crt,
      ambienteFiscal: empresa.ambienteFiscal,
      serieNfe: empresa.serieNfe === null ? null : String(empresa.serieNfe),
      proximaNumeracaoNfe: BigInt(empresa.proximaNumeracaoNfe),
      plugnotasConfig: toPrismaJson(empresa.plugnotasConfig),
      status: empresa.status,
      enderecoLogradouro: empresa.endereco.logradouro,
      enderecoNumero: empresa.endereco.numero,
      enderecoComplemento: empresa.endereco.complemento,
      enderecoBairro: empresa.endereco.bairro,
      enderecoMunicipio: empresa.endereco.municipio,
      uf: empresa.endereco.uf,
      enderecoCep: empresa.endereco.cep,
      updatedAt: empresa.updatedAt,
      deletedAt: empresa.deletedAt,
    }
  }
}
