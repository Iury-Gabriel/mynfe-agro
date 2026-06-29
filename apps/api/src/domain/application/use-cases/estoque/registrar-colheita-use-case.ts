import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { Colheita } from '@/domain/enterprise/entities/colheita'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import { Lote } from '@/domain/enterprise/entities/lote'

export interface RegistrarColheitaInput {
  tenantId: string
  empresaId: string
  produtoId: string
  safraId?: string | null
  areaId?: string | null
  quantidade: number
  data: Date
  responsavelUsuarioId?: string | null
  codigoLote?: string | null
  validade?: Date | null
}

export interface RegistrarColheitaOutput {
  colheita: Colheita
  lote: Lote
  movimento: EstoqueMovimento
  saldo: EstoqueSaldo
}

type RegistrarColheitaResult = Either<UnexpectedError, RegistrarColheitaOutput>

@Injectable()
export class RegistrarColheitaUseCase {
  constructor(
    private readonly estoqueWrite: EstoqueWriteRepository,
    private readonly saldos: EstoqueSaldoRepository,
  ) {}

  async execute(input: RegistrarColheitaInput): Promise<RegistrarColheitaResult> {
    try {
      const now = new Date()

      const colheita = Colheita.create({
        tenantId: input.tenantId,
        empresaId: input.empresaId,
        produtoId: input.produtoId,
        safraId: input.safraId ?? null,
        areaId: input.areaId ?? null,
        quantidade: input.quantidade,
        data: input.data,
        responsavelUsuarioId: input.responsavelUsuarioId ?? null,
        createdAt: now,
        updatedAt: now,
      })

      const lote = Lote.create({
        tenantId: input.tenantId,
        empresaId: input.empresaId,
        produtoId: input.produtoId,
        codigoLote: input.codigoLote ?? `LOTE-${randomUUID()}`,
        origemTipo: 'colheita',
        colheitaId: colheita.id.toString(),
        areaId: input.areaId ?? null,
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
        origem: 'colheita',
        referenciaId: colheita.id.toString(),
        quantidade: input.quantidade,
        data: input.data,
        usuarioId: input.responsavelUsuarioId ?? null,
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

      await this.estoqueWrite.registrarColheita({ colheita, lote, movimento, saldo })

      return right({ colheita, lote, movimento, saldo })
    } catch (err) {
      console.error('[RegistrarColheitaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
