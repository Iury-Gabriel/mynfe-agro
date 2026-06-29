import type { Pedido, PedidoStatus, PedidoTipo } from '@/domain/enterprise/entities/pedido'
import type { PedidoItem } from '@/domain/enterprise/entities/pedido-item'
import type { Remessa } from '@/domain/enterprise/entities/remessa'

export interface PedidoItemPresenterOutput {
  id: string
  produtoId: string
  loteId: string | null
  quantidade: number
  precoUnitario: number
  valorTotal: number
}

export interface PedidoRemessaVinculoOutput {
  id: string
  numero: string
  status: string
  valorEstimado: number
}

export interface PedidoPresenterOutput {
  id: string
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  numero: string
  tipo: PedidoTipo
  status: PedidoStatus
  valorTotal: number
  periodoConsolidacao: Date | null
  data: Date
  observacoes: string | null
  itens: PedidoItemPresenterOutput[]
  remessas: PedidoRemessaVinculoOutput[]
  createdAt: Date
  updatedAt: Date
}

function itemToHTTP(item: PedidoItem): PedidoItemPresenterOutput {
  return {
    id: item.id.toString(),
    produtoId: item.produtoId,
    loteId: item.loteId,
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
    valorTotal: item.valorTotal,
  }
}

export class PedidoPresenter {
  static toHTTP(pedido: Pedido, remessas: Remessa[] = []): PedidoPresenterOutput {
    return {
      id: pedido.id.toString(),
      tenantId: pedido.tenantId,
      empresaFaturadoraId: pedido.empresaFaturadoraId,
      clienteId: pedido.clienteId,
      numero: pedido.numero,
      tipo: pedido.tipo,
      status: pedido.status,
      valorTotal: pedido.valorTotal,
      periodoConsolidacao: pedido.periodoConsolidacao,
      data: pedido.data,
      observacoes: pedido.observacoes,
      itens: pedido.itens.map((item) => itemToHTTP(item)),
      remessas: remessas.map((remessa) => ({
        id: remessa.id.toString(),
        numero: remessa.numero,
        status: remessa.status,
        valorEstimado: remessa.valorEstimado,
      })),
      createdAt: pedido.createdAt,
      updatedAt: pedido.updatedAt,
    }
  }
}
