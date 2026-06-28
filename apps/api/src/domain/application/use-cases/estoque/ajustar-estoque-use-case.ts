import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { MovimentoInvalidoError } from '@/domain/application/use-cases/errors/movimento-invalido-error'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

export interface AjustarEstoqueInput {
  tenantId: string
  empresaId: string
  produtoId: string
  loteId?: string | null
  delta: number
  motivo: string
  data: Date
  usuarioId?: string | null
}

export interface AjustarEstoqueOutput {
  movimento: EstoqueMovimento
  saldo: EstoqueSaldo
}

type AjustarEstoqueResult = Either<
  MovimentoInvalidoError | EstoqueInsuficienteError | LoteNotFoundError | UnexpectedError,
  AjustarEstoqueOutput
>

@Injectable()
export class AjustarEstoqueUseCase {
  constructor(
    private readonly estoqueWrite: EstoqueWriteRepository,
    private readonly saldos: EstoqueSaldoRepository,
    private readonly lotes: LoteRepository,
  ) {}

  async execute(input: AjustarEstoqueInput): Promise<AjustarEstoqueResult> {
    if (input.motivo.trim() === '') {
      return left(new MovimentoInvalidoError('motivo é obrigatório.'))
    }
    if (input.delta === 0) {
      return left(new MovimentoInvalidoError('delta não pode ser zero.'))
    }

    const loteId = input.loteId ?? null

    try {
      const lote = loteId === null ? null : await this.lotes.findById(loteId, input.tenantId)
      if (loteId !== null && !lote) {
        return left(new LoteNotFoundError())
      }

      const now = new Date()

      const existing = await this.saldos.findByChave(
        input.tenantId,
        input.empresaId,
        input.produtoId,
        loteId,
      )

      const saldo =
        existing ??
        EstoqueSaldo.create({
          tenantId: input.tenantId,
          empresaId: input.empresaId,
          produtoId: input.produtoId,
          loteId,
          createdAt: now,
          updatedAt: now,
        })

      const ajusteResult = saldo.aplicarAjuste(input.delta)
      if (ajusteResult.isLeft()) {
        return left(ajusteResult.value)
      }

      if (lote) {
        if (input.delta < 0) {
          const consumoResult = lote.consumir(-input.delta)
          if (consumoResult.isLeft()) {
            return left(consumoResult.value)
          }
        } else {
          lote.estornar(input.delta)
        }
      }

      const movimento = EstoqueMovimento.create({
        tenantId: input.tenantId,
        empresaId: input.empresaId,
        produtoId: input.produtoId,
        loteId,
        tipo: 'ajuste',
        origem: 'ajuste',
        quantidade: input.delta,
        data: input.data,
        usuarioId: input.usuarioId ?? null,
        motivo: input.motivo,
        createdAt: now,
        updatedAt: now,
      })

      await this.estoqueWrite.registrarAjuste({ movimento, saldo, lote })

      return right({ movimento, saldo })
    } catch (err) {
      console.error('[AjustarEstoqueUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
