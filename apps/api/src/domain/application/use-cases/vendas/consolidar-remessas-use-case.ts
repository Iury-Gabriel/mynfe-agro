import { Injectable } from '@nestjs/common'

import { agruparItensRemessas } from './preview-consolidacao-use-case'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { VendaWriteRepository } from '@/domain/application/repositories/venda-write-repository'
import { SemRemessasParaConsolidarError } from '@/domain/application/use-cases/errors/sem-remessas-para-consolidar-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'
import { Pedido } from '@/domain/enterprise/entities/pedido'
import { PedidoItem } from '@/domain/enterprise/entities/pedido-item'
import { Remessa } from '@/domain/enterprise/entities/remessa'


export interface ConsolidarRemessasInput {
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  periodoInicio: Date
  periodoFim: Date
  observacoes?: string | null
}

export interface ConsolidarRemessasOutput {
  pedido: Pedido
  remessas: Remessa[]
}

type ConsolidarRemessasResult = Either<
  SemRemessasParaConsolidarError | TransicaoInvalidaError | UnexpectedError,
  ConsolidarRemessasOutput
>

@Injectable()
export class ConsolidarRemessasUseCase {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly remessas: RemessaRepository,
    private readonly vendaWrite: VendaWriteRepository,
  ) {}

  async execute(input: ConsolidarRemessasInput): Promise<ConsolidarRemessasResult> {
    try {
      const remessas = await this.remessas.findNaoConsolidadasByClientePeriodo(
        input.tenantId,
        input.empresaFaturadoraId,
        input.clienteId,
        input.periodoInicio,
        input.periodoFim,
      )

      if (remessas.length === 0) {
        return left(new SemRemessasParaConsolidarError())
      }

      const now = new Date()
      const numero = await this.pedidos.nextNumero(input.tenantId, input.empresaFaturadoraId)

      const pedido = Pedido.create({
        tenantId: input.tenantId,
        empresaFaturadoraId: input.empresaFaturadoraId,
        clienteId: input.clienteId,
        numero,
        tipo: 'consolidado',
        status: 'confirmado',
        periodoConsolidacao: input.periodoInicio,
        data: now,
        observacoes: input.observacoes ?? null,
        createdAt: now,
        updatedAt: now,
      })

      const itensAgregados = agruparItensRemessas(remessas)
      for (const agregado of itensAgregados) {
        pedido.addItem(
          PedidoItem.create({
            tenantId: input.tenantId,
            pedidoId: pedido.id.toString(),
            produtoId: agregado.produtoId,
            loteId: null,
            quantidade: agregado.quantidade,
            precoUnitario: agregado.precoUnitario,
            valorTotal: agregado.valorTotal,
            createdAt: now,
            updatedAt: now,
          }),
        )
      }

      for (const remessa of remessas) {
        const marcacaoResult = remessa.marcarConsolidada(pedido.id.toString())
        if (marcacaoResult.isLeft()) {
          return left(marcacaoResult.value)
        }
      }

      await this.vendaWrite.consolidar({ pedido, remessas })

      return right({ pedido, remessas })
    } catch (err) {
      console.error('[ConsolidarRemessasUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
