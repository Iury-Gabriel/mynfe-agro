import type { InMemoryColheitaRepository } from './in-memory-colheita-repository'
import type { InMemoryEstoqueMovimentoRepository } from './in-memory-estoque-movimento-repository'
import type { InMemoryEstoqueSaldoRepository } from './in-memory-estoque-saldo-repository'
import type { InMemoryLoteRepository } from './in-memory-lote-repository'
import type {
  RegistrarAjusteArgs,
  RegistrarColheitaArgs,
  RegistrarEmbalagemArgs,
  RegistrarSaidaVendaArgs,
} from '@/domain/application/repositories/estoque-write-repository'
import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import type { Lote } from '@/domain/enterprise/entities/lote'

import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'

export class InMemoryEstoqueWriteRepository extends EstoqueWriteRepository {
  shouldFail = false

  constructor(
    private readonly colheitas: InMemoryColheitaRepository,
    private readonly lotes: InMemoryLoteRepository,
    private readonly movimentos: InMemoryEstoqueMovimentoRepository,
    private readonly saldos: InMemoryEstoqueSaldoRepository,
  ) {
    super()
  }

  private upsertLote(lote: Lote): void {
    const idx = this.lotes.lotes.findIndex((l) => l.id.equals(lote.id))
    if (idx >= 0) this.lotes.lotes[idx] = lote
    else this.lotes.lotes.push(lote)
  }

  private upsertSaldo(saldo: EstoqueSaldo): void {
    const idx = this.saldos.saldos.findIndex((s) => s.id.equals(saldo.id))
    if (idx >= 0) this.saldos.saldos[idx] = saldo
    else this.saldos.saldos.push(saldo)
  }

  async registrarColheita(args: RegistrarColheitaArgs): Promise<void> {
    if (this.shouldFail) throw new Error('transaction failed')
    this.colheitas.colheitas.push(args.colheita)
    this.upsertLote(args.lote)
    this.movimentos.movimentos.push(args.movimento)
    this.upsertSaldo(args.saldo)
  }

  async registrarEmbalagem(args: RegistrarEmbalagemArgs): Promise<void> {
    if (this.shouldFail) throw new Error('transaction failed')
    this.upsertLote(args.lote)
    this.movimentos.movimentos.push(args.movimento)
    this.upsertSaldo(args.saldo)
  }

  async registrarAjuste(args: RegistrarAjusteArgs): Promise<void> {
    if (this.shouldFail) throw new Error('transaction failed')
    this.movimentos.movimentos.push(args.movimento)
    this.upsertSaldo(args.saldo)
    if (args.lote) this.upsertLote(args.lote)
  }

  async registrarSaidaVenda(args: RegistrarSaidaVendaArgs): Promise<void> {
    if (this.shouldFail) throw new Error('transaction failed')
    for (const saldo of args.saldos) this.upsertSaldo(saldo)
    for (const movimento of args.movimentos) this.movimentos.movimentos.push(movimento)
    for (const lote of args.lotes) this.upsertLote(lote)
  }
}
