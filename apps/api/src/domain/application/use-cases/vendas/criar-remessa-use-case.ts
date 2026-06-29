import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import { Lote } from '@/domain/enterprise/entities/lote'
import { Remessa } from '@/domain/enterprise/entities/remessa'
import { RemessaItem } from '@/domain/enterprise/entities/remessa-item'
import { resolvePreco } from '@/domain/enterprise/services/price-resolver'

export interface CriarRemessaItemInput {
  produtoId: string
  loteId?: string | null
  quantidade: number
  precoUnitario?: number | null
}

export interface CriarRemessaInput {
  tenantId: string
  empresaFaturadoraId: string
  clienteId: string
  data: Date
  observacoes?: string | null
  usuarioId?: string | null
  itens: CriarRemessaItemInput[]
}

export interface CriarRemessaOutput {
  remessa: Remessa
}

type CriarRemessaResult = Either<
  EstoqueInsuficienteError | UnexpectedError,
  CriarRemessaOutput
>

@Injectable()
export class CriarRemessaUseCase {
  constructor(
    private readonly remessas: RemessaRepository,
    private readonly produtos: ProdutoRepository,
    private readonly tabelasPreco: TabelaPrecoClienteRepository,
    private readonly saldos: EstoqueSaldoRepository,
    private readonly lotes: LoteRepository,
    private readonly estoqueWrite: EstoqueWriteRepository,
  ) {}

  async execute(input: CriarRemessaInput): Promise<CriarRemessaResult> {
    try {
      const now = new Date()

      const numero = await this.remessas.nextNumero(input.tenantId, input.empresaFaturadoraId)

      const remessa = Remessa.create({
        tenantId: input.tenantId,
        empresaFaturadoraId: input.empresaFaturadoraId,
        clienteId: input.clienteId,
        numero,
        status: 'aberta',
        data: input.data,
        observacoes: input.observacoes ?? null,
        createdAt: now,
        updatedAt: now,
      })

      const movimentos: EstoqueMovimento[] = []
      const saldos: EstoqueSaldo[] = []
      const lotesConsumidos: Lote[] = []

      for (const itemInput of input.itens) {
        const precoUnitario = await this.resolverPreco(input, itemInput, now)

        const existing = await this.saldos.findByChave(
          input.tenantId,
          input.empresaFaturadoraId,
          itemInput.produtoId,
          itemInput.loteId ?? null,
        )

        const saldo =
          existing ??
          EstoqueSaldo.create({
            tenantId: input.tenantId,
            empresaId: input.empresaFaturadoraId,
            produtoId: itemInput.produtoId,
            loteId: itemInput.loteId ?? null,
            createdAt: now,
            updatedAt: now,
          })

        const saidaResult = saldo.aplicarSaida(itemInput.quantidade)
        if (saidaResult.isLeft()) {
          return left(saidaResult.value)
        }
        saldos.push(saldo)

        movimentos.push(
          EstoqueMovimento.create({
            tenantId: input.tenantId,
            empresaId: input.empresaFaturadoraId,
            produtoId: itemInput.produtoId,
            loteId: itemInput.loteId ?? null,
            tipo: 'saida',
            origem: 'remessa',
            referenciaId: remessa.id.toString(),
            quantidade: itemInput.quantidade,
            data: now,
            usuarioId: input.usuarioId ?? null,
            createdAt: now,
            updatedAt: now,
          }),
        )

        if (itemInput.loteId !== undefined && itemInput.loteId !== null) {
          const lote = await this.lotes.findById(itemInput.loteId, input.tenantId)
          if (lote === null) {
            return left(new EstoqueInsuficienteError(0, itemInput.quantidade))
          }
          const consumoResult = lote.consumir(itemInput.quantidade)
          if (consumoResult.isLeft()) {
            return left(consumoResult.value)
          }
          lotesConsumidos.push(lote)
        }

        remessa.addItem(
          RemessaItem.create({
            tenantId: input.tenantId,
            remessaId: remessa.id.toString(),
            produtoId: itemInput.produtoId,
            loteId: itemInput.loteId ?? null,
            quantidade: itemInput.quantidade,
            precoUnitario,
            createdAt: now,
            updatedAt: now,
          }),
        )
      }

      await this.estoqueWrite.registrarSaidaVenda({
        movimentos,
        saldos,
        lotes: lotesConsumidos,
      })
      await this.remessas.create(remessa)

      return right({ remessa })
    } catch (err) {
      console.error('[CriarRemessaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }

  private async resolverPreco(
    input: CriarRemessaInput,
    itemInput: CriarRemessaItemInput,
    ref: Date,
  ): Promise<number> {
    if (itemInput.precoUnitario !== undefined && itemInput.precoUnitario !== null) {
      return itemInput.precoUnitario
    }

    const precosCliente = await this.tabelasPreco.findVigentesByClienteProduto(
      input.tenantId,
      input.clienteId,
      itemInput.produtoId,
      ref,
    )

    const produto = await this.produtos.findById(itemInput.produtoId, input.tenantId)

    const resolvido = resolvePreco({
      precosCliente,
      precoPadrao: produto?.precoPadrao ?? null,
      ref,
    })

    return resolvido ?? 0
  }
}
