import { Injectable } from '@nestjs/common'

import { PrismaAtividadeCampoMapper } from '../mappers/admin/prisma-atividade-campo-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'

@Injectable()
export class PrismaAtividadeCampoRepository extends AtividadeCampoRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<AtividadeCampo | null> {
    const raw = await this.prisma.atividadeCampo.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaAtividadeCampoMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<AtividadeCampo[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.atividadeCampo.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaAtividadeCampoMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.atividadeCampo.count({ where: { tenantId, deletedAt: null } })
  }

  async create(atividade: AtividadeCampo): Promise<void> {
    await this.prisma.atividadeCampo.create({
      data: PrismaAtividadeCampoMapper.toPrismaCreate(atividade),
    })
  }

  async save(atividade: AtividadeCampo): Promise<void> {
    await this.prisma.atividadeCampo.update({
      where: { id: atividade.id.toString() },
      data: PrismaAtividadeCampoMapper.toPrismaUpdate(atividade),
    })
  }
}
