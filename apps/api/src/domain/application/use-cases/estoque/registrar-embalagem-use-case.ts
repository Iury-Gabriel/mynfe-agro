import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import { Lote } from '@/domain/enterprise/entities/lote'

export interface RegistrarEmbalagemInput {
  tenantId: string
  empresaId: string
  produtoId: string
  quantidade: number
  data: Date
  codigoLote?: string | null
  validade?: Date | null
  usuarioId?: string | null
}

export interface RegistrarEmbalagemOutput {
  lote: Lote
  movimento: EstoqueMovimento
  saldo: EstoqueSaldo
}

type RegistrarEmbalagemResult = Either<UnexpectedError, RegistrarEmbalagemOutput>

@Injectable()
export class RegistrarEmbalagemUseCase {
  constructor(
    private readonly estoqueWrite: EstoqueWriteRepository,
    private readonly saldos: EstoqueSaldoRepository,
  ) {}

  async execute(input: RegistrarEmbalagemInput): Promise<RegistrarEmbalagemResult> {
    try {
      const now = new Date()

      const lote = Lote.create({
        tenantId: input.tenantId,
        empresaId: input.empresaId,
        produtoId: input.produtoId,
        codigoLote: input.codigoLote ?? `LOTE-${randomUUID()}`,
        origemTipo: 'embalagem',
        colheitaId: null,
        areaId: null,
        quantidadeInicial: input.quantidade,
        quantidadeAtual: input.quantidade,
        validade: input.validade ?? null,
        dataEntrada: input.data,
        createdAt: now,
        updatedAt: now,
      })

      const movimento = EstoqueMovimento.create({
        tenantId: input.tenantId,
        empresaId: input.empresaId,
        produtoId: input.produtoId,
        loteId: lote.id.toString(),
        tipo: 'entrada',
        origem: 'embalagem',
        referenciaId: lote.id.toString(),
        quantidade: input.quantidade,
        data: input.data,
        usuarioId: input.usuarioId ?? null,
        createdAt: now,
        updatedAt: now,
      })

      const existing = await this.saldos.findByChave(
        input.tenantId,
        input.empresaId,
        input.produtoId,
        lote.id.toString(),
      )

      const saldo =
        existing ??
        EstoqueSaldo.create({
          tenantId: input.tenantId,
          empresaId: input.empresaId,
          produtoId: input.produtoId,
          loteId: lote.id.toString(),
          createdAt: now,
          updatedAt: now,
        })

      saldo.aplicarEntrada(input.quantidade)

      await this.estoqueWrite.registrarEmbalagem({ lote, movimento, saldo })

      return right({ lote, movimento, saldo })
    } catch (err) {
      console.error('[RegistrarEmbalagemUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
