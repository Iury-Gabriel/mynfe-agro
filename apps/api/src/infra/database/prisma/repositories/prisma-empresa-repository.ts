import { Injectable } from '@nestjs/common'

import { PrismaEmpresaMapper } from '../mappers/admin/prisma-empresa-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Empresa } from '@/domain/enterprise/entities/empresa'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'

@Injectable()
export class PrismaEmpresaRepository extends EmpresaRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<Empresa | null> {
    const raw = await this.prisma.empresa.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    return raw ? PrismaEmpresaMapper.toDomain(raw) : null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Empresa[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.empresa.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaEmpresaMapper.toDomain(raw))
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.empresa.count({ where: { tenantId, deletedAt: null } })
  }

  async create(empresa: Empresa): Promise<void> {
    await this.prisma.empresa.create({
      data: PrismaEmpresaMapper.toPrismaCreate(empresa),
    })
  }

  async save(empresa: Empresa): Promise<void> {
    await this.prisma.empresa.update({
      where: { id: empresa.id.toString() },
      data: PrismaEmpresaMapper.toPrismaUpdate(empresa),
    })
  }
}
