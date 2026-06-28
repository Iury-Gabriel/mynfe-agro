import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Entity } from '@/core/entities/entity'

export interface RemessaItemProps {
  tenantId: string
  remessaId: string
  produtoId: string
  loteId: string | null
  quantidade: number
  precoUnitario: number
  valorTotal: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class RemessaItem extends Entity<RemessaItemProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get remessaId() {
    return this.props.remessaId
  }

  get produtoId() {
    return this.props.produtoId
  }

  get loteId() {
    return this.props.loteId
  }

  get quantidade() {
    return this.props.quantidade
  }

  get precoUnitario() {
    return this.props.precoUnitario
  }

  get valorTotal() {
    return this.props.valorTotal
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

  static create(
    props: Omit<RemessaItemProps, 'loteId' | 'valorTotal' | 'deletedAt'> & {
      loteId?: string | null
      valorTotal?: number
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): RemessaItem {
    return new RemessaItem(
      {
        ...props,
        loteId: props.loteId ?? null,
        valorTotal: props.valorTotal ?? props.quantidade * props.precoUnitario,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
