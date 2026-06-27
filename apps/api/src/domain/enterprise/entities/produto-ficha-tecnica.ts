import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { Entity } from '@/core/entities/entity'

export interface ProdutoFichaTecnicaProps {
  tenantId: string
  produtoId: string
  descricaoComponente: string
  quantidadeReferencia: number | null
  observacoes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateProdutoFichaTecnica {
  descricaoComponente?: string
  quantidadeReferencia?: number | null
  observacoes?: string | null
}

export class ProdutoFichaTecnica extends Entity<ProdutoFichaTecnicaProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get produtoId() {
    return this.props.produtoId
  }

  get descricaoComponente() {
    return this.props.descricaoComponente
  }

  get quantidadeReferencia() {
    return this.props.quantidadeReferencia
  }

  get observacoes() {
    return this.props.observacoes
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

  update(input: UpdateProdutoFichaTecnica): void {
    if (input.descricaoComponente !== undefined) {
      this.props.descricaoComponente = input.descricaoComponente
    }
    if (input.quantidadeReferencia !== undefined) {
      this.props.quantidadeReferencia = input.quantidadeReferencia
    }
    if (input.observacoes !== undefined) this.props.observacoes = input.observacoes
    this.touch()
  }

  static create(
    props: Omit<
      ProdutoFichaTecnicaProps,
      'quantidadeReferencia' | 'observacoes' | 'deletedAt'
    > & {
      quantidadeReferencia?: number | null
      observacoes?: string | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): ProdutoFichaTecnica {
    return new ProdutoFichaTecnica(
      {
        ...props,
        quantidadeReferencia: props.quantidadeReferencia ?? null,
        observacoes: props.observacoes ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
