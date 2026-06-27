import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Entity } from '@/core/entities/entity'

export interface TabelaPrecoClienteProps {
  tenantId: string
  clienteId: string
  produtoId: string
  preco: number
  vigenciaInicio: Date | null
  vigenciaFim: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateTabelaPrecoCliente {
  preco?: number
  vigenciaInicio?: Date | null
  vigenciaFim?: Date | null
}

export class TabelaPrecoCliente extends Entity<TabelaPrecoClienteProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get clienteId() {
    return this.props.clienteId
  }

  get produtoId() {
    return this.props.produtoId
  }

  get preco() {
    return this.props.preco
  }

  get vigenciaInicio() {
    return this.props.vigenciaInicio
  }

  get vigenciaFim() {
    return this.props.vigenciaFim
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

  isVigente(ref: Date): boolean {
    if (this.props.vigenciaInicio !== null && ref.getTime() < this.props.vigenciaInicio.getTime()) {
      return false
    }
    if (this.props.vigenciaFim !== null && ref.getTime() > this.props.vigenciaFim.getTime()) {
      return false
    }
    return true
  }

  update(input: UpdateTabelaPrecoCliente): void {
    if (input.preco !== undefined) this.props.preco = input.preco
    if (input.vigenciaInicio !== undefined) this.props.vigenciaInicio = input.vigenciaInicio
    if (input.vigenciaFim !== undefined) this.props.vigenciaFim = input.vigenciaFim
    this.touch()
  }

  markAsDeleted(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Omit<TabelaPrecoClienteProps, 'vigenciaInicio' | 'vigenciaFim' | 'deletedAt'> & {
      vigenciaInicio?: Date | null
      vigenciaFim?: Date | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): TabelaPrecoCliente {
    return new TabelaPrecoCliente(
      {
        ...props,
        vigenciaInicio: props.vigenciaInicio ?? null,
        vigenciaFim: props.vigenciaFim ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
