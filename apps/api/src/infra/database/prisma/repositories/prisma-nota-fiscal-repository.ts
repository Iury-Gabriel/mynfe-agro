import { Injectable } from '@nestjs/common'

import { PrismaEmpresaMapper } from '../mappers/admin/prisma-empresa-mapper'
import { PrismaNotaFiscalEventoMapper } from '../mappers/admin/prisma-nota-fiscal-evento-mapper'
import { PrismaNotaFiscalMapper } from '../mappers/admin/prisma-nota-fiscal-mapper'
import { PrismaService } from '../prisma.service'

import type { PaginationParams } from '@/core/repositories/pagination-params'
import type {
  AtualizarStatusComEventoArgs,
  CriarEmissaoArgs,
  NotaFiscalFiltros,
} from '@/domain/application/repositories/nota-fiscal-repository'
import type { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'
import type { Prisma } from '@prisma/client'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'

function buildWhere(
  tenantId: string,
  empresaEmitenteId: string,
  filtros: NotaFiscalFiltros,
): Prisma.NotaFiscalWhereInput {
  const where: Prisma.NotaFiscalWhereInput = {
    tenantId,
    empresaEmitenteId,
    deletedAt: null,
  }
  if (filtros.status !== undefined) where.status = filtros.status
  if (filtros.clienteId !== undefined) where.clienteId = filtros.clienteId
  return where
}

@Injectable()
export class PrismaNotaFiscalRepository extends NotaFiscalRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string, tenantId: string): Promise<NotaFiscal | null> {
    const raw = await this.prisma.notaFiscal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { itens: true, eventos: { orderBy: { data: 'asc' } } },
    })
    return raw ? PrismaNotaFiscalMapper.toDomain(raw) : null
  }

  async findByPlugnotasId(plugnotasId: string, tenantId: string): Promise<NotaFiscal | null> {
    const raw = await this.prisma.notaFiscal.findFirst({
      where: { plugnotasId, tenantId, deletedAt: null },
      include: { itens: true, eventos: { orderBy: { data: 'asc' } } },
    })
    return raw ? PrismaNotaFiscalMapper.toDomain(raw) : null
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaEmitenteId: string,
    filtros: NotaFiscalFiltros,
    params: PaginationParams,
  ): Promise<NotaFiscal[]> {
    const { page, perPage } = normalizePagination(params)

    const raws = await this.prisma.notaFiscal.findMany({
      where: buildWhere(tenantId, empresaEmitenteId, filtros),
      include: { itens: true, eventos: { orderBy: { data: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    })

    return raws.map((raw) => PrismaNotaFiscalMapper.toDomain(raw))
  }

  async count(
    tenantId: string,
    empresaEmitenteId: string,
    filtros: NotaFiscalFiltros,
  ): Promise<number> {
    return this.prisma.notaFiscal.count({
      where: buildWhere(tenantId, empresaEmitenteId, filtros),
    })
  }

  async findAtivasByPedido(tenantId: string, pedidoId: string): Promise<NotaFiscal[]> {
    const raws = await this.prisma.notaFiscal.findMany({
      where: { tenantId, pedidoId, deletedAt: null },
      include: { itens: true, eventos: { orderBy: { data: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return raws.map((raw) => PrismaNotaFiscalMapper.toDomain(raw))
  }

  async save(nota: NotaFiscal): Promise<void> {
    await this.prisma.notaFiscal.update({
      where: { id: nota.id.toString() },
      data: PrismaNotaFiscalMapper.toPrismaUpdate(nota),
    })
  }

  async criarEmissao(args: CriarEmissaoArgs): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notaFiscal.create({ data: PrismaNotaFiscalMapper.toPrismaCreate(args.nota) })
      await tx.empresa.update({
        where: { id: args.empresa.id.toString() },
        data: PrismaEmpresaMapper.toPrismaUpdate(args.empresa),
      })
    })
  }

  async atualizarStatusComEvento(args: AtualizarStatusComEventoArgs): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notaFiscal.update({
        where: { id: args.nota.id.toString() },
        data: PrismaNotaFiscalMapper.toPrismaUpdate(args.nota),
      })
      await tx.notaFiscalEvento.create({
        data: PrismaNotaFiscalEventoMapper.toPrismaCreate(args.evento),
      })
    })
  }
}
