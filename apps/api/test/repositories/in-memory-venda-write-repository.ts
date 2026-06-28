import type { InMemoryPedidoRepository } from './in-memory-pedido-repository'
import type { InMemoryRemessaRepository } from './in-memory-remessa-repository'
import type { ConsolidarArgs } from '@/domain/application/repositories/venda-write-repository'
import type { Remessa } from '@/domain/enterprise/entities/remessa'

import { VendaWriteRepository } from '@/domain/application/repositories/venda-write-repository'

export class InMemoryVendaWriteRepository extends VendaWriteRepository {
  shouldFail = false

  constructor(
    private readonly pedidos: InMemoryPedidoRepository,
    private readonly remessas: InMemoryRemessaRepository,
  ) {
    super()
  }

  private upsertRemessa(remessa: Remessa): void {
    const idx = this.remessas.remessas.findIndex((r) => r.id.equals(remessa.id))
    if (idx >= 0) this.remessas.remessas[idx] = remessa
    else this.remessas.remessas.push(remessa)
  }

  async consolidar(args: ConsolidarArgs): Promise<void> {
    if (this.shouldFail) throw new Error('transaction failed')
    this.pedidos.pedidos.push(args.pedido)
    for (const remessa of args.remessas) this.upsertRemessa(remessa)
  }
}
