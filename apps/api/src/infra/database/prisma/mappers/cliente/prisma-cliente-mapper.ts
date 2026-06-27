import type {
  Prisma,
  Cliente as PrismaCliente,
  ClienteEnderecoEntrega as PrismaClienteEnderecoEntrega,
} from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Cliente, type IndicadorIe, type TipoPessoaCliente } from '@/domain/enterprise/entities/cliente'
import { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

type PrismaClienteWithEnderecos = PrismaCliente & {
  enderecosEntrega?: PrismaClienteEnderecoEntrega[]
}

export class PrismaClienteMapper {
  static toDomain(raw: PrismaClienteWithEnderecos): Cliente {
    const cnpjCpfResult = CnpjCpf.create(raw.cnpjCpf)
    if (cnpjCpfResult.isLeft()) {
      throw new Error(`PrismaClienteMapper: CNPJ/CPF persistido inválido para cliente ${raw.id}`)
    }

    const enderecosEntrega = (raw.enderecosEntrega ?? []).map((endereco) =>
      PrismaClienteMapper.enderecoToDomain(endereco),
    )

    return Cliente.create(
      {
        tenantId: raw.tenantId,
        tipoPessoa: raw.tipoPessoa as TipoPessoaCliente,
        razaoSocialNome: raw.razaoSocialNome,
        cnpjCpf: cnpjCpfResult.value,
        inscricaoEstadual: raw.inscricaoEstadual,
        indicadorIe: raw.indicadorIe as IndicadorIe,
        contribuinteIcms: raw.contribuinteIcms,
        enderecoLogradouro: raw.enderecoLogradouro,
        enderecoNumero: raw.enderecoNumero,
        enderecoBairro: raw.enderecoBairro,
        enderecoCep: raw.enderecoCep,
        municipio: raw.municipio,
        codMunicipioIbge: raw.codMunicipioIbge,
        uf: raw.uf,
        email: raw.email,
        telefone: raw.telefone,
        vendedorUsuarioId: raw.vendedorUsuarioId,
        enderecosEntrega,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static enderecoToDomain(raw: PrismaClienteEnderecoEntrega): ClienteEnderecoEntrega {
    return ClienteEnderecoEntrega.create(
      {
        tenantId: raw.tenantId,
        clienteId: raw.clienteId,
        enderecoLogradouro: raw.enderecoLogradouro,
        enderecoNumero: raw.enderecoNumero,
        enderecoBairro: raw.enderecoBairro,
        enderecoCep: raw.enderecoCep,
        municipio: raw.municipio,
        uf: raw.uf,
        principal: raw.principal,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static enderecoToPrismaCreate(
    endereco: ClienteEnderecoEntrega,
  ): Prisma.ClienteEnderecoEntregaUncheckedCreateWithoutClienteInput {
    return {
      id: endereco.id.toString(),
      tenantId: endereco.tenantId,
      enderecoLogradouro: endereco.enderecoLogradouro,
      enderecoNumero: endereco.enderecoNumero,
      enderecoBairro: endereco.enderecoBairro,
      enderecoCep: endereco.enderecoCep,
      municipio: endereco.municipio,
      uf: endereco.uf,
      principal: endereco.principal,
      createdAt: endereco.createdAt,
      updatedAt: endereco.updatedAt,
      deletedAt: endereco.deletedAt,
    }
  }

  static toPrismaCreate(cliente: Cliente): Prisma.ClienteUncheckedCreateInput {
    return {
      id: cliente.id.toString(),
      tenantId: cliente.tenantId,
      tipoPessoa: cliente.tipoPessoa,
      razaoSocialNome: cliente.razaoSocialNome,
      cnpjCpf: cliente.cnpjCpf.value,
      inscricaoEstadual: cliente.inscricaoEstadual,
      indicadorIe: cliente.indicadorIe,
      contribuinteIcms: cliente.contribuinteIcms,
      enderecoLogradouro: cliente.enderecoLogradouro,
      enderecoNumero: cliente.enderecoNumero,
      enderecoBairro: cliente.enderecoBairro,
      enderecoCep: cliente.enderecoCep,
      municipio: cliente.municipio,
      codMunicipioIbge: cliente.codMunicipioIbge,
      uf: cliente.uf,
      email: cliente.email,
      telefone: cliente.telefone,
      vendedorUsuarioId: cliente.vendedorUsuarioId,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
      deletedAt: cliente.deletedAt,
      enderecosEntrega: {
        create: cliente.enderecosEntrega.map((endereco) =>
          PrismaClienteMapper.enderecoToPrismaCreate(endereco),
        ),
      },
    }
  }

  static toPrismaUpdate(cliente: Cliente): Prisma.ClienteUncheckedUpdateInput {
    return {
      tipoPessoa: cliente.tipoPessoa,
      razaoSocialNome: cliente.razaoSocialNome,
      cnpjCpf: cliente.cnpjCpf.value,
      inscricaoEstadual: cliente.inscricaoEstadual,
      indicadorIe: cliente.indicadorIe,
      contribuinteIcms: cliente.contribuinteIcms,
      enderecoLogradouro: cliente.enderecoLogradouro,
      enderecoNumero: cliente.enderecoNumero,
      enderecoBairro: cliente.enderecoBairro,
      enderecoCep: cliente.enderecoCep,
      municipio: cliente.municipio,
      codMunicipioIbge: cliente.codMunicipioIbge,
      uf: cliente.uf,
      email: cliente.email,
      telefone: cliente.telefone,
      vendedorUsuarioId: cliente.vendedorUsuarioId,
      updatedAt: cliente.updatedAt,
      deletedAt: cliente.deletedAt,
    }
  }
}
