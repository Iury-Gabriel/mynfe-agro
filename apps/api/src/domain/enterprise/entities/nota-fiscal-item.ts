import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Entity } from '@/core/entities/entity'

export interface NotaFiscalItemProps {
  tenantId: string
  notaFiscalId: string
  produtoId: string
  descricao: string
  ncm: string | null
  cfop: string | null
  cstCsosn: string | null
  quantidade: number
  valorUnitario: number
  valorTotal: number
  impostos: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export class NotaFiscalItem extends Entity<NotaFiscalItemProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get notaFiscalId() {
    return this.props.notaFiscalId
  }

  get produtoId() {
    return this.props.produtoId
  }

  get descricao() {
    return this.props.descricao
  }

  get ncm() {
    return this.props.ncm
  }

  get cfop() {
    return this.props.cfop
  }

  get cstCsosn() {
    return this.props.cstCsosn
  }

  get quantidade() {
    return this.props.quantidade
  }

  get valorUnitario() {
    return this.props.valorUnitario
  }

  get valorTotal() {
    return this.props.valorTotal
  }

  get impostos() {
    return this.props.impostos
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  static create(
    props: Omit<NotaFiscalItemProps, 'ncm' | 'cfop' | 'cstCsosn' | 'valorTotal' | 'impostos'> & {
      ncm?: string | null
      cfop?: string | null
      cstCsosn?: string | null
      valorTotal?: number
      impostos?: Record<string, unknown>
    },
    id?: UniqueEntityID,
  ): NotaFiscalItem {
    return new NotaFiscalItem(
      {
        ...props,
        ncm: props.ncm ?? null,
        cfop: props.cfop ?? null,
        cstCsosn: props.cstCsosn ?? null,
        valorTotal: props.valorTotal ?? props.quantidade * props.valorUnitario,
        impostos: props.impostos ?? {},
      },
      id,
    )
  }
}
