import { Injectable } from '@nestjs/common'

import { PrismaTabelaPrecoClienteMapper } from '../mappers/admin/prisma-tabela-preco-cliente-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'

@Injectable()
export class PrismaTabelaPrecoClienteRepository extends TabelaPrecoClienteRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<TabelaPrecoCliente | null> {
    const raw = await this.prisma.tabelaPrecoCliente.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaTabelaPrecoClienteMapper.toDomain(raw) : null
  }

  async findManyByTenant(
    tenantId: string,
    params: PaginationParams,
  ): Promise<TabelaPrecoCliente[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.tabelaPrecoCliente.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaTabelaPrecoClienteMapper.toDomain(raw))
  }

  async findVigentesByClienteProduto(
    tenantId: string,
    clienteId: string,
    produtoId: string,
    ref: Date,
  ): Promise<TabelaPrecoCliente[]> {
    const raws = await this.prisma.tabelaPrecoCliente.findMany({
      where: {
        tenantId,
        clienteId,
        produtoId,
        deletedAt: null,
        OR: [{ vigenciaInicio: null }, { vigenciaInicio: { lte: ref } }],
        AND: [{ OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: ref } }] }],
      },
      orderBy: { vigenciaInicio: 'desc' },
    })

    return raws.map((raw) => PrismaTabelaPrecoClienteMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.tabelaPrecoCliente.count({ where: { tenantId, deletedAt: null } })
  }

  async create(tabelaPreco: TabelaPrecoCliente): Promise<void> {
    await this.prisma.tabelaPrecoCliente.create({
      data: PrismaTabelaPrecoClienteMapper.toPrismaCreate(tabelaPreco),
    })
  }

  async save(tabelaPreco: TabelaPrecoCliente): Promise<void> {
    await this.prisma.tabelaPrecoCliente.update({
      where: { id: tabelaPreco.id.toString() },
      data: PrismaTabelaPrecoClienteMapper.toPrismaUpdate(tabelaPreco),
    })
  }
}
