import { Injectable } from '@nestjs/common'

import { PrismaLoteMapper } from '../mappers/admin/prisma-lote-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Lote } from '@/domain/enterprise/entities/lote'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'

@Injectable()
export class PrismaLoteRepository extends LoteRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Lote | null> {
    const raw = await this.prisma.lote.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaLoteMapper.toDomain(raw) : null
  }

  async findByCodigo(
    tenantId: string,
    empresaId: string,
    codigoLote: string,
  ): Promise<Lote | null> {
    const raw = await this.prisma.lote.findFirst({
      where: { tenantId, empresaId, codigoLote, deletedAt: null },
    })
    return raw ? PrismaLoteMapper.toDomain(raw) : null
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<Lote[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.lote.findMany({
      where: { tenantId, empresaId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaLoteMapper.toDomain(raw))
  }

  async count(tenantId: string, empresaId: string): Promise<number> {
    return this.prisma.lote.count({ where: { tenantId, empresaId, deletedAt: null } })
  }

  async save(lote: Lote): Promise<void> {
    await this.prisma.lote.update({
      where: { id: lote.id.toString() },
      data: PrismaLoteMapper.toPrismaUpdate(lote),
    })
  }
}
