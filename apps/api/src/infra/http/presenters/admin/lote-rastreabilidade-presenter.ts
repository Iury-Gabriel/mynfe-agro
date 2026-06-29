import type { PedidoItemConsumo } from '@/domain/application/repositories/pedido-repository'
import type { RemessaItemConsumo } from '@/domain/application/repositories/remessa-repository'
import type { PedidoStatus } from '@/domain/enterprise/entities/pedido'
import type { RemessaStatus } from '@/domain/enterprise/entities/remessa'

export interface PedidoItemConsumoOutput {
  itemId: string
  pedidoId: string
  numero: string
  clienteId: string
  clienteNome: string
  quantidade: number
  data: Date
  status: PedidoStatus
}

export interface RemessaItemConsumoOutput {
  itemId: string
  remessaId: string
  numero: string
  clienteId: string
  clienteNome: string
  quantidade: number
  data: Date
  status: RemessaStatus
}

export class LoteRastreabilidadeJusantePresenter {
  static pedidoItemToHTTP(item: PedidoItemConsumo): PedidoItemConsumoOutput {
    return {
      itemId: item.itemId,
      pedidoId: item.pedidoId,
      numero: item.numero,
      clienteId: item.clienteId,
      clienteNome: item.clienteNome,
      quantidade: item.quantidade,
      data: item.data,
      status: item.status,
    }
  }

  static remessaItemToHTTP(item: RemessaItemConsumo): RemessaItemConsumoOutput {
    return {
      itemId: item.itemId,
      remessaId: item.remessaId,
      numero: item.numero,
      clienteId: item.clienteId,
      clienteNome: item.clienteNome,
      quantidade: item.quantidade,
      data: item.data,
      status: item.status,
    }
  }
}
