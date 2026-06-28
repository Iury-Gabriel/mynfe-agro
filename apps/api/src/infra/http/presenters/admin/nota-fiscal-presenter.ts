import type {
  NotaFiscal,
  NotaFiscalAmbiente,
  NotaFiscalStatus,
} from '@/domain/enterprise/entities/nota-fiscal'
import type {
  NotaFiscalEvento,
  NotaFiscalEventoTipo,
} from '@/domain/enterprise/entities/nota-fiscal-evento'
import type { NotaFiscalItem } from '@/domain/enterprise/entities/nota-fiscal-item'

export interface NotaFiscalItemPresenterOutput {
  id: string
  produtoId: string
  descricao: string
  ncm: string | null
  cfop: string | null
  cstCsosn: string | null
  quantidade: number
  valorUnitario: number
  valorTotal: number
  impostos: Record<string, unknown>
}

export interface NotaFiscalEventoPresenterOutput {
  id: string
  tipo: NotaFiscalEventoTipo
  payload: Record<string, unknown>
  data: Date
}

export interface NotaFiscalPresenterOutput {
  id: string
  tenantId: string
  empresaEmitenteId: string
  pedidoId: string
  clienteId: string
  numero: string | null
  serie: string | null
  modelo: string
  naturezaOperacao: string | null
  status: NotaFiscalStatus
  chaveAcesso: string | null
  protocolo: string | null
  valorTotal: number
  ambiente: NotaFiscalAmbiente
  xmlUrl: string | null
  danfeUrl: string | null
  mensagemRetorno: string | null
  dataEmissao: Date | null
  itens: NotaFiscalItemPresenterOutput[]
  eventos: NotaFiscalEventoPresenterOutput[]
  createdAt: Date
  updatedAt: Date
}

function itemToHTTP(item: NotaFiscalItem): NotaFiscalItemPresenterOutput {
  return {
    id: item.id.toString(),
    produtoId: item.produtoId,
    descricao: item.descricao,
    ncm: item.ncm,
    cfop: item.cfop,
    cstCsosn: item.cstCsosn,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    valorTotal: item.valorTotal,
    impostos: item.impostos,
  }
}

function eventoToHTTP(evento: NotaFiscalEvento): NotaFiscalEventoPresenterOutput {
  return {
    id: evento.id.toString(),
    tipo: evento.tipo,
    payload: evento.payload,
    data: evento.data,
  }
}

export class NotaFiscalPresenter {
  static toHTTP(nota: NotaFiscal): NotaFiscalPresenterOutput {
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
      xmlUrl: nota.xmlUrl,
      danfeUrl: nota.danfeUrl,
      mensagemRetorno: nota.mensagemRetorno,
      dataEmissao: nota.dataEmissao,
      itens: nota.itens.map((item) => itemToHTTP(item)),
      eventos: nota.eventos.map((evento) => eventoToHTTP(evento)),
      createdAt: nota.createdAt,
      updatedAt: nota.updatedAt,
    }
  }
}
