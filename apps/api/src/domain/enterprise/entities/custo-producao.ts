import type { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { AggregateRoot } from '@/core/entities/aggregate-root'

export const CUSTO_PRODUCAO_TIPOS = ['insumo', 'mao_de_obra', 'maquinario', 'outro'] as const

export type CustoProducaoTipo = (typeof CUSTO_PRODUCAO_TIPOS)[number]

export interface CustoProducaoProps {
  tenantId: string
  safraId: string | null
  areaId: string | null
  tipo: CustoProducaoTipo
  descricao: string
  valor: number
  data: Date
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface UpdateCustoProducaoCadastro {
  safraId?: string | null
  areaId?: string | null
  tipo?: CustoProducaoTipo
  descricao?: string
  valor?: number
  data?: Date
}

export class CustoProducao extends AggregateRoot<CustoProducaoProps> {
  get tenantId() {
    return this.props.tenantId
  }

  get safraId() {
    return this.props.safraId
  }

  get areaId() {
    return this.props.areaId
  }

  get tipo() {
    return this.props.tipo
  }

  get descricao() {
    return this.props.descricao
  }

  get valor() {
    return this.props.valor
  }

  get data() {
    return this.props.data
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

  updateCadastro(input: UpdateCustoProducaoCadastro): void {
    if (input.safraId !== undefined) this.props.safraId = input.safraId
    if (input.areaId !== undefined) this.props.areaId = input.areaId
    if (input.tipo !== undefined) this.props.tipo = input.tipo
    if (input.descricao !== undefined) this.props.descricao = input.descricao
    if (input.valor !== undefined) this.props.valor = input.valor
    if (input.data !== undefined) this.props.data = input.data
    this.touch()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Omit<CustoProducaoProps, 'safraId' | 'areaId' | 'deletedAt'> & {
      safraId?: string | null
      areaId?: string | null
      deletedAt?: Date | null
    },
    id?: UniqueEntityID,
  ): CustoProducao {
    return new CustoProducao(
      {
        ...props,
        safraId: props.safraId ?? null,
        areaId: props.areaId ?? null,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    )
  }
}
