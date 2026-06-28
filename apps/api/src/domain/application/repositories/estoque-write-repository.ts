import type { Colheita } from '@/domain/enterprise/entities/colheita'
import type { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'
import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import type { Lote } from '@/domain/enterprise/entities/lote'

export interface RegistrarColheitaArgs {
  colheita: Colheita
  lote: Lote
  movimento: EstoqueMovimento
  saldo: EstoqueSaldo
}

export interface RegistrarEmbalagemArgs {
  lote: Lote
  movimento: EstoqueMovimento
  saldo: EstoqueSaldo
}

export interface RegistrarAjusteArgs {
  movimento: EstoqueMovimento
  saldo: EstoqueSaldo
  lote: Lote | null
}

export interface RegistrarSaidaVendaArgs {
  movimentos: EstoqueMovimento[]
  saldos: EstoqueSaldo[]
  lotes: Lote[]
}

export abstract class EstoqueWriteRepository {
  abstract registrarColheita(args: RegistrarColheitaArgs): Promise<void>
  abstract registrarEmbalagem(args: RegistrarEmbalagemArgs): Promise<void>
  abstract registrarAjuste(args: RegistrarAjusteArgs): Promise<void>
  abstract registrarSaidaVenda(args: RegistrarSaidaVendaArgs): Promise<void>
}
