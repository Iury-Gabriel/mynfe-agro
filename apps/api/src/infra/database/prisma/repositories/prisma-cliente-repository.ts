import { Injectable } from '@nestjs/common'

import { PrismaClienteMapper } from '../mappers/cliente/prisma-cliente-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Cliente } from '@/domain/enterprise/entities/cliente'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'

@Injectable()
export class PrismaClienteRepository extends ClienteRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Cliente | null> {
    const raw = await this.prisma.cliente.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { enderecosEntrega: { where: { deletedAt: null } } },
    })
    return raw ? PrismaClienteMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Cliente[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.cliente.findMany({
      where: { tenantId, deletedAt: null },
      include: { enderecosEntrega: { where: { deletedAt: null } } },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaClienteMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.cliente.count({ where: { tenantId, deletedAt: null } })
  }

  async create(cliente: Cliente): Promise<void> {
    await this.prisma.cliente.create({
      data: PrismaClienteMapper.toPrismaCreate(cliente),
    })
  }

  async save(cliente: Cliente): Promise<void> {
    await this.prisma.cliente.update({
      where: { id: cliente.id.toString() },
      data: PrismaClienteMapper.toPrismaUpdate(cliente),
    })
  }
}
