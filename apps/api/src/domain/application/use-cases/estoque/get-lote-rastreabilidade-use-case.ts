import { Injectable } from '@nestjs/common'

import type { PedidoItemConsumo } from '@/domain/application/repositories/pedido-repository'
import type { RemessaItemConsumo } from '@/domain/application/repositories/remessa-repository'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ColheitaRepository } from '@/domain/application/repositories/colheita-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { Colheita } from '@/domain/enterprise/entities/colheita'
import { Lote } from '@/domain/enterprise/entities/lote'

export interface RastreabilidadeMontante {
  colheita: Colheita | null
  safraId: string | null
  areaId: string | null
}

export interface RastreabilidadeJusante {
  pedidoItens: PedidoItemConsumo[]
  remessaItens: RemessaItemConsumo[]
}

export interface GetLoteRastreabilidadeInput {
  tenantId: string
  loteId: string
}

export interface GetLoteRastreabilidadeOutput {
  lote: Lote
  montante: RastreabilidadeMontante
  jusante: RastreabilidadeJusante
}

type GetLoteRastreabilidadeResult = Either<
  LoteNotFoundError | UnexpectedError,
  GetLoteRastreabilidadeOutput
>

@Injectable()
export class GetLoteRastreabilidadeUseCase {
  constructor(
    private readonly lotes: LoteRepository,
    private readonly colheitas: ColheitaRepository,
    private readonly pedidos: PedidoRepository,
    private readonly remessas: RemessaRepository,
  ) {}

  async execute(input: GetLoteRastreabilidadeInput): Promise<GetLoteRastreabilidadeResult> {
    try {
      const lote = await this.lotes.findById(input.loteId, input.tenantId)
      if (!lote) return left(new LoteNotFoundError())

      const colheita =
        lote.colheitaId === null
          ? null
          : await this.colheitas.findById(lote.colheitaId, input.tenantId)

      const montante: RastreabilidadeMontante = {
        colheita,
        safraId: colheita?.safraId ?? null,
        areaId: colheita?.areaId ?? lote.areaId,
      }

      const [pedidoItens, remessaItens] = await Promise.all([
        this.pedidos.findItensByLote(input.tenantId, input.loteId),
        this.remessas.findItensByLote(input.tenantId, input.loteId),
      ])

      const jusante: RastreabilidadeJusante = { pedidoItens, remessaItens }

      return right({ lote, montante, jusante })
    } catch (err) {
      console.error('[GetLoteRastreabilidadeUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
