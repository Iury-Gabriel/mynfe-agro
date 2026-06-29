import type { RemessaItem } from './remessa-item'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { left, right, type Either } from '@/core/either'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'

export const REMESSA_STATUSES = ['aberta', 'entregue', 'consolidada', 'cancelada'] as const

export type RemessaStatus = (typeof REMESSA_STATUSES)[number]

export interface RemessaProps {
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  numero: string
  status: RemessaStatus
  pedidoConsolidadoId: string | null
  valorEstimado: number
  data: Date
  observacoes: string | null
  itens: RemessaItem[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Remessa extends AggregateRoot<RemessaProps> {
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

  get status() {
    return this.props.status
  }

  get pedidoConsolidadoId() {
    return this.props.pedidoConsolidadoId
  }

  get valorEstimado() {
    return this.props.valorEstimado
  }

  get data() {
    return this.props.data
  }

  get observacoes() {
    return this.props.observacoes
  }

  get itens(): readonly RemessaItem[] {
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

  addItem(item: RemessaItem): void {
    this.props.itens.push(item)
    this.recalcularTotal()
  }

  recalcularTotal(): void {
    this.props.valorEstimado = this.props.itens.reduce((soma, item) => soma + item.valorTotal, 0)
    this.touch()
  }

  marcarEntregue(): Either<TransicaoInvalidaError, void> {
    if (this.props.status !== 'aberta') {
      return left(new TransicaoInvalidaError(this.props.status, 'entregue'))
    }
    this.props.status = 'entregue'
    this.touch()
    return right(undefined)
  }

  marcarConsolidada(pedidoId: string): Either<TransicaoInvalidaError, void> {
    if (this.props.status !== 'aberta' && this.props.status !== 'entregue') {
      return left(new TransicaoInvalidaError(this.props.status, 'consolidada'))
    }
    this.props.status = 'consolidada'
    this.props.pedidoConsolidadoId = pedidoId
    this.touch()
    return right(undefined)
  }

  cancelar(): Either<TransicaoInvalidaError, void> {
    if (this.props.status === 'consolidada' || this.props.status === 'cancelada') {
      return left(new TransicaoInvalidaError(this.props.status, 'cancelada'))
    }
    this.props.status = 'cancelada'
    this.touch()
    return right(undefined)
  }

  static create(
    props: Omit<
      RemessaProps,
      'status' | 'pedidoConsolidadoId' | 'valorEstimado' | 'observacoes' | 'itens' | 'deletedAt'
    > & {
      status?: RemessaStatus
      pedidoConsolidadoId?: string | null
      valorEstimado?: number
      observacoes?: string | null
      itens?: RemessaItem[]
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Remessa {
    return new Remessa(
      {
        ...props,
        status: props.status ?? 'aberta',
        pedidoConsolidadoId: props.pedidoConsolidadoId ?? null,
        valorEstimado: props.valorEstimado ?? 0,
        observacoes: props.observacoes ?? null,
        itens: props.itens ?? [],
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
