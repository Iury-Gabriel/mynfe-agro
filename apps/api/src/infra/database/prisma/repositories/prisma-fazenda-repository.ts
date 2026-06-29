import { Injectable } from '@nestjs/common'

import { PrismaFazendaMapper } from '../mappers/admin/prisma-fazenda-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Fazenda } from '@/domain/enterprise/entities/fazenda'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'

@Injectable()
export class PrismaFazendaRepository extends FazendaRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Fazenda | null> {
    const raw = await this.prisma.fazenda.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaFazendaMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Fazenda[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.fazenda.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaFazendaMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.fazenda.count({ where: { tenantId, deletedAt: null } })
  }

  async create(fazenda: Fazenda): Promise<void> {
    await this.prisma.fazenda.create({
      data: PrismaFazendaMapper.toPrismaCreate(fazenda),
    })
  }

  async save(fazenda: Fazenda): Promise<void> {
    await this.prisma.fazenda.update({
      where: { id: fazenda.id.toString() },
      data: PrismaFazendaMapper.toPrismaUpdate(fazenda),
    })
  }
}
