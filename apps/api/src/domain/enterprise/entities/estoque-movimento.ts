import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const ESTOQUE_MOVIMENTO_TIPOS = ['entrada', 'saida', 'ajuste', 'estorno', 'reserva'] as const

export type EstoqueMovimentoTipo = (typeof ESTOQUE_MOVIMENTO_TIPOS)[number]

export const ESTOQUE_MOVIMENTO_ORIGENS = [
  'colheita',
  'embalagem',
  'remessa',
  'pedido',
  'ajuste',
] as const

export type EstoqueMovimentoOrigem = (typeof ESTOQUE_MOVIMENTO_ORIGENS)[number]

export interface EstoqueMovimentoProps {
  tenantId: string
  empresaId: string
  produtoId: string
  loteId: string | null
  tipo: EstoqueMovimentoTipo
  origem: EstoqueMovimentoOrigem
  referenciaId: string | null
  quantidade: number
  data: Date
  usuarioId: string | null
  motivo: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class EstoqueMovimento extends AggregateRoot<EstoqueMovimentoProps> {
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

  get tipo() {
    return this.props.tipo
  }

  get origem() {
    return this.props.origem
  }

  get referenciaId() {
    return this.props.referenciaId
  }

  get quantidade() {
    return this.props.quantidade
  }

  get data() {
    return this.props.data
  }

  get usuarioId() {
    return this.props.usuarioId
  }

  get motivo() {
    return this.props.motivo
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
    props: Omit<EstoqueMovimentoProps, 'loteId' | 'referenciaId' | 'usuarioId' | 'motivo' | 'deletedAt'> & {
      loteId?: string | null
      referenciaId?: string | null
      usuarioId?: string | null
      motivo?: string | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): EstoqueMovimento {
    return new EstoqueMovimento(
      {
        ...props,
        loteId: props.loteId ?? null,
        referenciaId: props.referenciaId ?? null,
        usuarioId: props.usuarioId ?? null,
        motivo: props.motivo ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
