import { PrismaNotaFiscalEventoMapper } from './prisma-nota-fiscal-evento-mapper'
import { PrismaNotaFiscalItemMapper } from './prisma-nota-fiscal-item-mapper'

import type {
  Prisma,
  NotaFiscal as PrismaNotaFiscal,
  NotaFiscalEvento as PrismaNotaFiscalEvento,
  NotaFiscalItem as PrismaNotaFiscalItem,
} from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  NotaFiscal,
  type NotaFiscalAmbiente,
  type NotaFiscalStatus,
} from '@/domain/enterprise/entities/nota-fiscal'

type PrismaNotaFiscalWithRelations = PrismaNotaFiscal & {
  itens: PrismaNotaFiscalItem[]
  eventos: PrismaNotaFiscalEvento[]
}

export class PrismaNotaFiscalMapper {
  static toDomain(raw: PrismaNotaFiscalWithRelations): NotaFiscal {
    return NotaFiscal.create(
      {
        tenantId: raw.tenantId,
        empresaEmitenteId: raw.empresaEmitenteId,
        pedidoId: raw.pedidoId,
        clienteId: raw.clienteId,
        numero: raw.numero,
        serie: raw.serie,
        modelo: raw.modelo,
        naturezaOperacao: raw.naturezaOperacao,
        status: raw.status as NotaFiscalStatus,
        chaveAcesso: raw.chaveAcesso,
        protocolo: raw.protocolo,
        valorTotal: raw.valorTotal.toNumber(),
        ambiente: raw.ambiente as NotaFiscalAmbiente,
        plugnotasId: raw.plugnotasId,
        xmlUrl: raw.xmlUrl,
        danfeUrl: raw.danfeUrl,
        mensagemRetorno: raw.mensagemRetorno,
        dataEmissao: raw.dataEmissao,
        itens: raw.itens.map((item) => PrismaNotaFiscalItemMapper.toDomain(item)),
        eventos: raw.eventos.map((evento) => PrismaNotaFiscalEventoMapper.toDomain(evento)),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(nota: NotaFiscal): Prisma.NotaFiscalUncheckedCreateInput {
    return {
      id: nota.id.toString(),
      tenantId: nota.tenantId,
      empresaEmitenteId: nota.empresaEmitenteId,
      pedidoId: nota.pedidoId,
      clienteId: nota.clienteId,
      numero: nota.numero,
      serie: nota.serie,
      modelo: nota.modelo,
      naturezaOperacao: nota.naturezaOperacao,
      status: nota.status,
      chaveAcesso: nota.chaveAcesso,
      protocolo: nota.protocolo,
      valorTotal: nota.valorTotal,
      ambiente: nota.ambiente,
      plugnotasId: nota.plugnotasId,
      xmlUrl: nota.xmlUrl,
      danfeUrl: nota.danfeUrl,
      mensagemRetorno: nota.mensagemRetorno,
      dataEmissao: nota.dataEmissao,
      createdAt: nota.createdAt,
      updatedAt: nota.updatedAt,
      deletedAt: nota.deletedAt,
      itens: {
        create: nota.itens.map((item) => PrismaNotaFiscalItemMapper.toPrismaCreateNested(item)),
      },
      eventos: {
        create: nota.eventos.map((evento) =>
          PrismaNotaFiscalEventoMapper.toPrismaCreateNested(evento),
        ),
      },
    }
  }

  static toPrismaUpdate(nota: NotaFiscal): Prisma.NotaFiscalUncheckedUpdateInput {
    return {
      numero: nota.numero,
      serie: nota.serie,
      modelo: nota.modelo,
      naturezaOperacao: nota.naturezaOperacao,
      status: nota.status,
      chaveAcesso: nota.chaveAcesso,
      protocolo: nota.protocolo,
      valorTotal: nota.valorTotal,
      ambiente: nota.ambiente,
      plugnotasId: nota.plugnotasId,
      xmlUrl: nota.xmlUrl,
      danfeUrl: nota.danfeUrl,
      mensagemRetorno: nota.mensagemRetorno,
      dataEmissao: nota.dataEmissao,
      updatedAt: nota.updatedAt,
      deletedAt: nota.deletedAt,
    }
  }
}
