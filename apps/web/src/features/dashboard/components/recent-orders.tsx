import { ArrowRight } from 'lucide-react'


import { recentOrders } from '../mock'

import { FiscalBadge } from './fiscal-badge'
import { InitialsAvatar } from './initials-avatar'

import type { ReactElement } from 'react'

export function RecentOrders(): ReactElement {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Pedidos recentes</h2>
        <a
          href="#"
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Ver todos <ArrowRight className="size-4" />
        </a>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 font-medium">Cliente</th>
              <th className="pb-3 font-medium">Tipo</th>
              <th className="pb-3 font-medium">Empresa</th>
              <th className="pb-3 font-medium">Valor</th>
              <th className="pb-3 font-medium">Fiscal</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.cliente} className="border-t border-border/50">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar initials={order.initials} className="size-9" />
                    <span className="font-medium text-foreground">{order.cliente}</span>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-muted-foreground">{order.tipo}</td>
                <td className="py-4 pr-4 text-sm text-muted-foreground">{order.empresa}</td>
                <td className="py-4 pr-4 text-sm font-semibold text-foreground">{order.valor}</td>
                <td className="py-4">
                  <FiscalBadge status={order.fiscal} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
