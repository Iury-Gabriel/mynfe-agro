import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Entity } from '@/core/entities/entity'

export const NOTA_FISCAL_EVENTO_TIPOS = [
  'emissao',
  'cancelamento',
  'carta_correcao',
  'rejeicao',
] as const

export type NotaFiscalEventoTipo = (typeof NOTA_FISCAL_EVENTO_TIPOS)[number]

export interface NotaFiscalEventoProps {
  tenantId: string
  notaFiscalId: string
  tipo: NotaFiscalEventoTipo
  payload: Record<string, unknown>
  data: Date
  createdAt: Date
}

export class NotaFiscalEvento extends Entity<NotaFiscalEventoProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get notaFiscalId() {
    return this.props.notaFiscalId
  }

  get tipo() {
    return this.props.tipo
  }

  get payload() {
    return this.props.payload
  }

  get data() {
    return this.props.data
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Omit<NotaFiscalEventoProps, 'payload' | 'createdAt'> & {
      payload?: Record<string, unknown>
      createdAt?: Date
    },
    id?: UniqueEntityID,
  ): NotaFiscalEvento {
    return new NotaFiscalEvento(
      {
        ...props,
        payload: props.payload ?? {},
        createdAt: props.createdAt ?? props.data,
      },
      id,
    )
  }
}
