import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { Remessa } from '@/domain/enterprise/entities/remessa'

export interface PreviewConsolidacaoInput {
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  periodoInicio: Date
  periodoFim: Date
}

export interface ItemConsolidado {
  produtoId: string
  precoUnitario: number
  quantidade: number
  valorTotal: number
}

export interface PreviewConsolidacaoOutput {
  remessas: Remessa[]
  itens: ItemConsolidado[]
  valorTotal: number
}

type PreviewConsolidacaoResult = Either<UnexpectedError, PreviewConsolidacaoOutput>

export function agruparItensRemessas(remessas: Remessa[]): ItemConsolidado[] {
  const mapa = new Map<string, ItemConsolidado>()

  for (const remessa of remessas) {
    for (const item of remessa.itens) {
      const chave = `${item.produtoId}::${item.precoUnitario}`
      const existente = mapa.get(chave)
      if (existente === undefined) {
        mapa.set(chave, {
          produtoId: item.produtoId,
          precoUnitario: item.precoUnitario,
          quantidade: item.quantidade,
          valorTotal: item.valorTotal,
        })
      } else {
        existente.quantidade += item.quantidade
        existente.valorTotal += item.valorTotal
      }
    }
  }

  return [...mapa.values()]
}

@Injectable()
export class PreviewConsolidacaoUseCase {
  constructor(private readonly remessas: RemessaRepository) {}

  async execute(input: PreviewConsolidacaoInput): Promise<PreviewConsolidacaoResult> {
    try {
      const remessas = await this.remessas.findNaoConsolidadasByClientePeriodo(
        input.tenantId,
        input.empresaFaturadoraId,
        input.clienteId,
        input.periodoInicio,
        input.periodoFim,
      )

      const itens = agruparItensRemessas(remessas)
      const valorTotal = itens.reduce((soma, item) => soma + item.valorTotal, 0)

      return right({ remessas, itens, valorTotal })
    } catch (err) {
      console.error('[PreviewConsolidacaoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
