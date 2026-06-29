import type {
  NotaFiscalAmbiente,
  NotaFiscalStatus,
} from '@/domain/enterprise/entities/nota-fiscal'
import type { NotaFiscalEvento } from '@/domain/enterprise/entities/nota-fiscal-evento'
import type { NotaFiscalItem } from '@/domain/enterprise/entities/nota-fiscal-item'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'

export interface MakeNotaFiscalOverrides {
  id?: string
  tenantId?: string
  empresaEmitenteId?: string
  pedidoId?: string
  clienteId?: string
  numero?: string | null
  serie?: string | null
  modelo?: string
  naturezaOperacao?: string | null
  status?: NotaFiscalStatus
  chaveAcesso?: string | null
  protocolo?: string | null
  valorTotal?: number
  ambiente?: NotaFiscalAmbiente
  plugnotasId?: string | null
  xmlUrl?: string | null
  danfeUrl?: string | null
  mensagemRetorno?: string | null
  dataEmissao?: Date | null
  itens?: NotaFiscalItem[]
  eventos?: NotaFiscalEvento[]
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeNotaFiscal(overrides: MakeNotaFiscalOverrides = {}): NotaFiscal {
  return NotaFiscal.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaEmitenteId: overrides.empresaEmitenteId ?? 'empresa-1',
      pedidoId: overrides.pedidoId ?? 'pedido-1',
      clienteId: overrides.clienteId ?? 'cliente-1',
      numero: overrides.numero ?? '1',
      serie: overrides.serie ?? '1',
      modelo: overrides.modelo ?? '55',
      naturezaOperacao: overrides.naturezaOperacao ?? 'Venda de produção do estabelecimento',
      status: overrides.status ?? 'pendente',
      chaveAcesso: overrides.chaveAcesso ?? null,
      protocolo: overrides.protocolo ?? null,
      valorTotal: overrides.valorTotal ?? 0,
      ambiente: overrides.ambiente ?? 'homologacao',
      plugnotasId: overrides.plugnotasId ?? null,
      xmlUrl: overrides.xmlUrl ?? null,
      danfeUrl: overrides.danfeUrl ?? null,
      mensagemRetorno: overrides.mensagemRetorno ?? null,
      dataEmissao: overrides.dataEmissao ?? null,
      itens: overrides.itens ?? [],
      eventos: overrides.eventos ?? [],
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'nota-1'),
  )
}
