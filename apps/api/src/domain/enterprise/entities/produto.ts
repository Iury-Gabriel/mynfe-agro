import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const PRODUTO_TIPOS = ['bruto', 'embalado'] as const

export type ProdutoTipo = (typeof PRODUTO_TIPOS)[number]

export const PRODUTO_STATUSES = ['ativo', 'inativo'] as const

export type ProdutoStatus = (typeof PRODUTO_STATUSES)[number]

export interface ProdutoProps {
  tenantId: string
  empresaId: string
  descricao: string
  tipo: ProdutoTipo
  unidadeMedida: string
  precoPadrao: number | null
  ncm: string | null
  cest: string | null
  cfopPadrao: string | null
  origemMercadoria: string | null
  cstCsosn: string | null
  aliquotas: Record<string, unknown> | null
  status: ProdutoStatus
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateProdutoCadastro {
  descricao?: string
  tipo?: ProdutoTipo
  unidadeMedida?: string
  precoPadrao?: number | null
  ncm?: string | null
  cest?: string | null
  cfopPadrao?: string | null
  origemMercadoria?: string | null
  cstCsosn?: string | null
  aliquotas?: Record<string, unknown> | null
}

export class Produto extends AggregateRoot<ProdutoProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get empresaId() {
    return this.props.empresaId
  }

  get descricao() {
    return this.props.descricao
  }

  get tipo() {
    return this.props.tipo
  }

  get unidadeMedida() {
    return this.props.unidadeMedida
  }

  get precoPadrao() {
    return this.props.precoPadrao
  }

  get ncm() {
    return this.props.ncm
  }

  get cest() {
    return this.props.cest
  }

  get cfopPadrao() {
    return this.props.cfopPadrao
  }

  get origemMercadoria() {
    return this.props.origemMercadoria
  }

  get cstCsosn() {
    return this.props.cstCsosn
  }

  get aliquotas() {
    return this.props.aliquotas
  }

  get status() {
    return this.props.status
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

  activate(): void {
    this.props.status = 'ativo'
    this.touch()
  }

  deactivate(): void {
    this.props.status = 'inativo'
    this.touch()
  }

  updateCadastro(input: UpdateProdutoCadastro): void {
    if (input.descricao !== undefined) this.props.descricao = input.descricao
    if (input.tipo !== undefined) this.props.tipo = input.tipo
    if (input.unidadeMedida !== undefined) this.props.unidadeMedida = input.unidadeMedida
    if (input.precoPadrao !== undefined) this.props.precoPadrao = input.precoPadrao
    if (input.ncm !== undefined) this.props.ncm = input.ncm
    if (input.cest !== undefined) this.props.cest = input.cest
    if (input.cfopPadrao !== undefined) this.props.cfopPadrao = input.cfopPadrao
    if (input.origemMercadoria !== undefined) this.props.origemMercadoria = input.origemMercadoria
    if (input.cstCsosn !== undefined) this.props.cstCsosn = input.cstCsosn
    if (input.aliquotas !== undefined) this.props.aliquotas = input.aliquotas
    this.touch()
  }

  static create(
    props: Omit<
      ProdutoProps,
      | 'precoPadrao'
      | 'ncm'
      | 'cest'
      | 'cfopPadrao'
      | 'origemMercadoria'
      | 'cstCsosn'
      | 'aliquotas'
      | 'status'
      | 'deletedAt'
    > & {
      precoPadrao?: number | null
      ncm?: string | null
      cest?: string | null
      cfopPadrao?: string | null
      origemMercadoria?: string | null
      cstCsosn?: string | null
      aliquotas?: Record<string, unknown> | null
      status?: ProdutoStatus
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): Produto {
    return new Produto(
      {
        ...props,
        precoPadrao: props.precoPadrao ?? null,
        ncm: props.ncm ?? null,
        cest: props.cest ?? null,
        cfopPadrao: props.cfopPadrao ?? null,
        origemMercadoria: props.origemMercadoria ?? null,
        cstCsosn: props.cstCsosn ?? null,
        aliquotas: props.aliquotas ?? null,
        status: props.status ?? 'ativo',
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
