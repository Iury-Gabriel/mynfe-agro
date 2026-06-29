import type { Pedido } from '@/domain/enterprise/entities/pedido'
import type { Remessa } from '@/domain/enterprise/entities/remessa'

export interface ConsolidarArgs {
  pedido: Pedido
  remessas: Remessa[]
}

export abstract class VendaWriteRepository {
  abstract consolidar(args: ConsolidarArgs): Promise<void>
}
