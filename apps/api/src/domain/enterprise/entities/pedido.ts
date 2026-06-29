import type { PedidoItem } from './pedido-item'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { left, right, type Either } from '@/core/either'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'

export const PEDIDO_TIPOS = ['avulso', 'consolidado'] as const

export type PedidoTipo = (typeof PEDIDO_TIPOS)[number]

export const PEDIDO_STATUSES = ['rascunho', 'confirmado', 'faturado', 'cancelado'] as const

export type PedidoStatus = (typeof PEDIDO_STATUSES)[number]

export interface PedidoProps {
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
  itens: PedidoItem[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Pedido extends AggregateRoot<PedidoProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get empresaFaturadoraId() {
    return this.props.empresaFaturadoraId
  }

  get clienteId() {
    return this.props.clienteId
  }

  get numero() {
    return this.props.numero
  }

  get tipo() {
    return this.props.tipo
  }

  get status() {
    return this.props.status
  }

  get valorTotal() {
    return this.props.valorTotal
  }

  get periodoConsolidacao() {
    return this.props.periodoConsolidacao
  }

  get data() {
    return this.props.data
  }

  get observacoes() {
    return this.props.observacoes
  }

  get itens(): readonly PedidoItem[] {
    return this.props.itens
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

  addItem(item: PedidoItem): void {
    this.props.itens.push(item)
    this.recalcularTotal()
  }

  recalcularTotal(): void {
    this.props.valorTotal = this.props.itens.reduce((soma, item) => soma + item.valorTotal, 0)
    this.touch()
  }

  confirmar(): Either<TransicaoInvalidaError, void> {
    if (this.props.status !== 'rascunho') {
      return left(new TransicaoInvalidaError(this.props.status, 'confirmado'))
    }
    this.props.status = 'confirmado'
    this.touch()
    return right(undefined)
  }

  cancelar(): Either<TransicaoInvalidaError, void> {
    if (this.props.status === 'faturado' || this.props.status === 'cancelado') {
      return left(new TransicaoInvalidaError(this.props.status, 'cancelado'))
    }
    this.props.status = 'cancelado'
    this.touch()
    return right(undefined)
  }

  static create(
    props: Omit<
      PedidoProps,
      'status' | 'valorTotal' | 'periodoConsolidacao' | 'observacoes' | 'itens' | 'deletedAt'
    > & {
      status?: PedidoStatus
      valorTotal?: number
      periodoConsolidacao?: Date | null
      observacoes?: string | null
      itens?: PedidoItem[]
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Pedido {
    return new Pedido(
      {
        ...props,
        status: props.status ?? 'rascunho',
        valorTotal: props.valorTotal ?? 0,
        periodoConsolidacao: props.periodoConsolidacao ?? null,
        observacoes: props.observacoes ?? null,
        itens: props.itens ?? [],
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
