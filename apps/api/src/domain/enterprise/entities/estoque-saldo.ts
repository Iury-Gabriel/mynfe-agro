import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { left, right, type Either } from '@/core/either'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'

export interface EstoqueSaldoProps {
  tenantId: string
  empresaId: string
  produtoId: string
  loteId: string | null
  quantidadeDisponivel: number
  quantidadeReservada: number
  createdAt: Date
  updatedAt: Date
}

export class EstoqueSaldo extends AggregateRoot<EstoqueSaldoProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get empresaId() {
    return this.props.empresaId
  }

  get produtoId() {
    return this.props.produtoId
  }

  get loteId() {
    return this.props.loteId
  }

  get quantidadeDisponivel() {
    return this.props.quantidadeDisponivel
  }

  get quantidadeReservada() {
    return this.props.quantidadeReservada
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  aplicarEntrada(quantidade: number): void {
    this.props.quantidadeDisponivel += quantidade
    this.touch()
  }

  aplicarSaida(quantidade: number): Either<EstoqueInsuficienteError, void> {
    if (quantidade > this.props.quantidadeDisponivel) {
      return left(new EstoqueInsuficienteError(this.props.quantidadeDisponivel, quantidade))
    }
    this.props.quantidadeDisponivel -= quantidade
    this.touch()
    return right(undefined)
  }

  aplicarAjuste(delta: number): Either<EstoqueInsuficienteError, void> {
    const resultado = this.props.quantidadeDisponivel + delta
    if (resultado < 0) {
      return left(new EstoqueInsuficienteError(this.props.quantidadeDisponivel, -delta))
    }
    this.props.quantidadeDisponivel = resultado
    this.touch()
    return right(undefined)
  }

  reservar(quantidade: number): Either<EstoqueInsuficienteError, void> {
    if (quantidade > this.props.quantidadeDisponivel) {
      return left(new EstoqueInsuficienteError(this.props.quantidadeDisponivel, quantidade))
    }
    this.props.quantidadeDisponivel -= quantidade
    this.props.quantidadeReservada += quantidade
    this.touch()
    return right(undefined)
  }

  liberarReserva(quantidade: number): Either<EstoqueInsuficienteError, void> {
    if (quantidade > this.props.quantidadeReservada) {
      return left(new EstoqueInsuficienteError(this.props.quantidadeReservada, quantidade))
    }
    this.props.quantidadeReservada -= quantidade
    this.props.quantidadeDisponivel += quantidade
    this.touch()
    return right(undefined)
  }

  static create(
    props: Omit<EstoqueSaldoProps, 'loteId' | 'quantidadeDisponivel' | 'quantidadeReservada'> & {
      loteId?: string | null
      quantidadeDisponivel?: number
      quantidadeReservada?: number
    },
    id?: UniqueEntityID,
  ): EstoqueSaldo {
    return new EstoqueSaldo(
      {
        ...props,
        loteId: props.loteId ?? null,
        quantidadeDisponivel: props.quantidadeDisponivel ?? 0,
        quantidadeReservada: props.quantidadeReservada ?? 0,
      },
      id,
    )
  }
}
