import { Injectable } from '@nestjs/common'

import { PrismaColheitaMapper } from '../mappers/admin/prisma-colheita-mapper'
import { PrismaEstoqueMovimentoMapper } from '../mappers/admin/prisma-estoque-movimento-mapper'
import { PrismaEstoqueSaldoMapper } from '../mappers/admin/prisma-estoque-saldo-mapper'
import { PrismaLoteMapper } from '../mappers/admin/prisma-lote-mapper'
import { PrismaService } from '../prisma.service'

import type {
  RegistrarAjusteArgs,
  RegistrarColheitaArgs,
  RegistrarEmbalagemArgs,
} from '@/domain/application/repositories/estoque-write-repository'
import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import type { Prisma } from '@prisma/client'

import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'

type TransactionClient = Prisma.TransactionClient

async function upsertSaldo(tx: TransactionClient, saldo: EstoqueSaldo): Promise<void> {
  const existing = await tx.estoqueSaldo.findFirst({
    where: {
      tenantId: saldo.tenantId,
      empresaId: saldo.empresaId,
      produtoId: saldo.produtoId,
      loteId: saldo.loteId,
    },
    select: { id: true },
  })

  if (existing) {
    await tx.estoqueSaldo.update({
      where: { id: existing.id },
      data: PrismaEstoqueSaldoMapper.toPrismaUpdate(saldo),
    })
    return
  }

  await tx.estoqueSaldo.create({
    data: PrismaEstoqueSaldoMapper.toPrismaCreate(saldo),
  })
}

async function upsertLote(tx: TransactionClient, lote: RegistrarAjusteArgs['lote']): Promise<void> {
  if (!lote) return

  const existing = await tx.lote.findUnique({
    where: { id: lote.id.toString() },
    select: { id: true },
  })

  if (existing) {
    await tx.lote.update({
      where: { id: lote.id.toString() },
      data: PrismaLoteMapper.toPrismaUpdate(lote),
    })
    return
  }

  await tx.lote.create({ data: PrismaLoteMapper.toPrismaCreate(lote) })
}

@Injectable()
export class PrismaEstoqueWriteRepository extends EstoqueWriteRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async registrarColheita(args: RegistrarColheitaArgs): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.colheita.create({ data: PrismaColheitaMapper.toPrismaCreate(args.colheita) })
      await upsertLote(tx, args.lote)
      await tx.estoqueMovimento.create({
        data: PrismaEstoqueMovimentoMapper.toPrismaCreate(args.movimento),
      })
      await upsertSaldo(tx, args.saldo)
    })
  }

  async registrarEmbalagem(args: RegistrarEmbalagemArgs): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await upsertLote(tx, args.lote)
      await tx.estoqueMovimento.create({
        data: PrismaEstoqueMovimentoMapper.toPrismaCreate(args.movimento),
      })
      await upsertSaldo(tx, args.saldo)
    })
  }

  async registrarAjuste(args: RegistrarAjusteArgs): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.estoqueMovimento.create({
        data: PrismaEstoqueMovimentoMapper.toPrismaCreate(args.movimento),
      })
      await upsertSaldo(tx, args.saldo)
      await upsertLote(tx, args.lote)
    })
  }
}
