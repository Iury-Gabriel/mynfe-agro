import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { left, right, type Either } from '@/core/either'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'

export const LOTE_ORIGEM_TIPOS = ['colheita', 'embalagem', 'ajuste'] as const

export type LoteOrigemTipo = (typeof LOTE_ORIGEM_TIPOS)[number]

export interface LoteProps {
  tenantId: string
  empresaId: string
  produtoId: string
  codigoLote: string
  origemTipo: LoteOrigemTipo | null
  colheitaId: string | null
  areaId: string | null
  quantidadeInicial: number
  quantidadeAtual: number
  validade: Date | null
  dataEntrada: Date
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Lote extends AggregateRoot<LoteProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get empresaId() {
    return this.props.empresaId
  }

  get produtoId() {
    return this.props.produtoId
  }

  get codigoLote() {
    return this.props.codigoLote
  }

  get origemTipo() {
    return this.props.origemTipo
  }

  get colheitaId() {
    return this.props.colheitaId
  }

  get areaId() {
    return this.props.areaId
  }

  get quantidadeInicial() {
    return this.props.quantidadeInicial
  }

  get quantidadeAtual() {
    return this.props.quantidadeAtual
  }

  get validade() {
    return this.props.validade
  }

  get dataEntrada() {
    return this.props.dataEntrada
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

  consumir(quantidade: number): Either<EstoqueInsuficienteError, void> {
    if (quantidade > this.props.quantidadeAtual) {
      return left(new EstoqueInsuficienteError(this.props.quantidadeAtual, quantidade))
    }
    this.props.quantidadeAtual -= quantidade
    this.touch()
    return right(undefined)
  }

  estornar(quantidade: number): void {
    this.props.quantidadeAtual += quantidade
    this.touch()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Omit<LoteProps, 'origemTipo' | 'colheitaId' | 'areaId' | 'validade' | 'deletedAt'> & {
      origemTipo?: LoteOrigemTipo | null
      colheitaId?: string | null
      areaId?: string | null
      validade?: Date | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Lote {
    return new Lote(
      {
        ...props,
        origemTipo: props.origemTipo ?? null,
        colheitaId: props.colheitaId ?? null,
        areaId: props.areaId ?? null,
        validade: props.validade ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
