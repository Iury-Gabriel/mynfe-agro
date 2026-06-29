import type { NotaFiscalEvento } from './nota-fiscal-evento'
import type { NotaFiscalItem } from './nota-fiscal-item'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { left, right, type Either } from '@/core/either'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'

export const NOTA_FISCAL_STATUSES = [
  'pendente',
  'emitindo',
  'autorizada',
  'rejeitada',
  'cancelada',
] as const

export type NotaFiscalStatus = (typeof NOTA_FISCAL_STATUSES)[number]

export const NOTA_FISCAL_AMBIENTES = ['homologacao', 'producao'] as const

export type NotaFiscalAmbiente = (typeof NOTA_FISCAL_AMBIENTES)[number]

export interface NotaFiscalProps {
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
  plugnotasId: string | null
  xmlUrl: string | null
  danfeUrl: string | null
  mensagemRetorno: string | null
  dataEmissao: Date | null
  itens: NotaFiscalItem[]
  eventos: NotaFiscalEvento[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface MarcarAutorizadaInput {
  chaveAcesso: string
  protocolo: string
  plugnotasId?: string | null
  xmlUrl?: string | null
  danfeUrl?: string | null
  dataEmissao: Date
}

export class NotaFiscal extends AggregateRoot<NotaFiscalProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get empresaEmitenteId() {
    return this.props.empresaEmitenteId
  }

  get pedidoId() {
    return this.props.pedidoId
  }

  get clienteId() {
    return this.props.clienteId
  }

  get numero() {
    return this.props.numero
  }

  get serie() {
    return this.props.serie
  }

  get modelo() {
    return this.props.modelo
  }

  get naturezaOperacao() {
    return this.props.naturezaOperacao
  }

  get status() {
    return this.props.status
  }

  get chaveAcesso() {
    return this.props.chaveAcesso
  }

  get protocolo() {
    return this.props.protocolo
  }

  get valorTotal() {
    return this.props.valorTotal
  }

  get ambiente() {
    return this.props.ambiente
  }

  get plugnotasId() {
    return this.props.plugnotasId
  }

  get xmlUrl() {
    return this.props.xmlUrl
  }

  get danfeUrl() {
    return this.props.danfeUrl
  }

  get mensagemRetorno() {
    return this.props.mensagemRetorno
  }

  get dataEmissao() {
    return this.props.dataEmissao
  }

  get itens(): readonly NotaFiscalItem[] {
    return this.props.itens
  }

  get eventos(): readonly NotaFiscalEvento[] {
    return this.props.eventos
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  addItem(item: NotaFiscalItem): void {
    this.props.itens.push(item)
    this.recalcularTotal()
  }

  addEvento(evento: NotaFiscalEvento): void {
    this.props.eventos.push(evento)
    this.touch()
  }

  recalcularTotal(): void {
    this.props.valorTotal = this.props.itens.reduce((soma, item) => soma + item.valorTotal, 0)
    this.touch()
  }

  marcarEmitindo(): Either<TransicaoFiscalInvalidaError, void> {
    if (this.props.status !== 'pendente') {
      return left(new TransicaoFiscalInvalidaError(this.props.status, 'emitindo'))
    }
    this.props.status = 'emitindo'
    this.touch()
    return right(undefined)
  }

  marcarAutorizada(input: MarcarAutorizadaInput): Either<TransicaoFiscalInvalidaError, void> {
    if (this.props.status !== 'emitindo') {
      return left(new TransicaoFiscalInvalidaError(this.props.status, 'autorizada'))
    }
    this.props.status = 'autorizada'
    this.props.chaveAcesso = input.chaveAcesso
    this.props.protocolo = input.protocolo
    this.props.plugnotasId = input.plugnotasId ?? this.props.plugnotasId
    this.props.xmlUrl = input.xmlUrl ?? null
    this.props.danfeUrl = input.danfeUrl ?? null
    this.props.dataEmissao = input.dataEmissao
    this.props.mensagemRetorno = null
    this.touch()
    return right(undefined)
  }

  marcarRejeitada(mensagem: string): Either<TransicaoFiscalInvalidaError, void> {
    if (this.props.status !== 'emitindo') {
      return left(new TransicaoFiscalInvalidaError(this.props.status, 'rejeitada'))
    }
    this.props.status = 'rejeitada'
    this.props.mensagemRetorno = mensagem
    this.touch()
    return right(undefined)
  }

  registrarPlugnotasId(plugnotasId: string | null): void {
    if (plugnotasId !== null) {
      this.props.plugnotasId = plugnotasId
    }
    this.touch()
  }

  marcarCancelada(): Either<TransicaoFiscalInvalidaError, void> {
    if (this.props.status !== 'autorizada') {
      return left(new TransicaoFiscalInvalidaError(this.props.status, 'cancelada'))
    }
    this.props.status = 'cancelada'
    this.touch()
    return right(undefined)
  }

  static create(
    props: Omit<
      NotaFiscalProps,
      | 'numero'
      | 'serie'
      | 'modelo'
      | 'naturezaOperacao'
      | 'status'
      | 'chaveAcesso'
      | 'protocolo'
      | 'valorTotal'
      | 'plugnotasId'
      | 'xmlUrl'
      | 'danfeUrl'
      | 'mensagemRetorno'
      | 'dataEmissao'
      | 'itens'
      | 'eventos'
      | 'deletedAt'
    > & {
      numero?: string | null
      serie?: string | null
      modelo?: string
      naturezaOperacao?: string | null
      status?: NotaFiscalStatus
      chaveAcesso?: string | null
      protocolo?: string | null
      valorTotal?: number
      plugnotasId?: string | null
      xmlUrl?: string | null
      danfeUrl?: string | null
      mensagemRetorno?: string | null
      dataEmissao?: Date | null
      itens?: NotaFiscalItem[]
      eventos?: NotaFiscalEvento[]
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): NotaFiscal {
    return new NotaFiscal(
      {
        ...props,
        numero: props.numero ?? null,
        serie: props.serie ?? null,
        modelo: props.modelo ?? '55',
        naturezaOperacao: props.naturezaOperacao ?? null,
        status: props.status ?? 'pendente',
        chaveAcesso: props.chaveAcesso ?? null,
        protocolo: props.protocolo ?? null,
        valorTotal: props.valorTotal ?? 0,
        plugnotasId: props.plugnotasId ?? null,
        xmlUrl: props.xmlUrl ?? null,
        danfeUrl: props.danfeUrl ?? null,
        mensagemRetorno: props.mensagemRetorno ?? null,
        dataEmissao: props.dataEmissao ?? null,
        itens: props.itens ?? [],
        eventos: props.eventos ?? [],
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
