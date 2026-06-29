import type { NotaFiscalAmbiente } from '@/domain/enterprise/entities/nota-fiscal'

export interface FiscalEmitirItem {
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

export interface FiscalEmitirInput {
  notaFiscalId: string
  empresaEmitenteId: string
  clienteId: string
  numero: string
  serie: string | null
  modelo: string
  naturezaOperacao: string | null
  valorTotal: number
  ambiente: NotaFiscalAmbiente
  itens: FiscalEmitirItem[]
}

export type FiscalEmitirStatus = 'autorizada' | 'rejeitada' | 'emitindo'

export interface FiscalEmitirResult {
  status: FiscalEmitirStatus
  chaveAcesso?: string | null
  protocolo?: string | null
  plugnotasId?: string | null
  xmlUrl?: string | null
  danfeUrl?: string | null
  mensagemRetorno?: string | null
}

export interface FiscalCancelarResult {
  status: 'cancelada' | 'rejeitada'
  mensagemRetorno?: string | null
}

export type FiscalConsultarStatus = 'autorizada' | 'rejeitada' | 'cancelada' | 'emitindo'

export interface FiscalConsultarResult {
  status: FiscalConsultarStatus
  chaveAcesso?: string | null
  protocolo?: string | null
  plugnotasId?: string | null
  xmlUrl?: string | null
  danfeUrl?: string | null
  mensagemRetorno?: string | null
}

export abstract class FiscalProvider {
  abstract emitir(input: FiscalEmitirInput): Promise<FiscalEmitirResult>
  abstract cancelar(plugnotasId: string): Promise<FiscalCancelarResult>
  abstract consultar(plugnotasId: string): Promise<FiscalConsultarResult>
}
