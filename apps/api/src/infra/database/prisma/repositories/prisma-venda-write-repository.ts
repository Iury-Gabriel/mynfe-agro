import { Injectable } from '@nestjs/common'

import { PrismaPedidoMapper } from '../mappers/admin/prisma-pedido-mapper'
import { PrismaRemessaMapper } from '../mappers/admin/prisma-remessa-mapper'
import { PrismaService } from '../prisma.service'

import type { ConsolidarArgs } from '@/domain/application/repositories/venda-write-repository'

import { VendaWriteRepository } from '@/domain/application/repositories/venda-write-repository'

@Injectable()
export class PrismaVendaWriteRepository extends VendaWriteRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async consolidar(args: ConsolidarArgs): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.pedido.create({ data: PrismaPedidoMapper.toPrismaCreate(args.pedido) })
      for (const remessa of args.remessas) {
        await tx.remessa.update({
          where: { id: remessa.id.toString() },
          data: PrismaRemessaMapper.toPrismaUpdate(remessa),
        })
      }
    })
  }
}
