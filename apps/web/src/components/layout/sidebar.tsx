import { NavLink } from 'react-router-dom'

import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

interface SidebarItem {
  to: string
  label: string
  /** Permissões necessárias (any-of). Array vazio = público pros logados. */
  requiresAny: readonly string[]
}

const ITEMS: readonly SidebarItem[] = [
  { to: '/app', label: 'Início', requiresAny: ['view:dashboard'] },
  { to: '/app/vendas/pedidos', label: 'Pedidos', requiresAny: ['pedido:read'] },
  { to: '/app/vendas/remessas', label: 'Remessas', requiresAny: ['remessa:read'] },
  { to: '/app/vendas/consolidacao', label: 'Consolidação', requiresAny: ['consolidacao:create'] },
  { to: '/app/fila-faturamento', label: 'Fila de faturamento', requiresAny: ['nota:read'] },
  { to: '/app/notas-fiscais', label: 'Notas fiscais', requiresAny: ['nota:read'] },
  { to: '/app/estoque', label: 'Estoque', requiresAny: ['estoque:read'] },
  { to: '/app/lotes', label: 'Lotes', requiresAny: ['lote:read'] },
  { to: '/app/colheitas', label: 'Colheitas', requiresAny: ['colheita:read'] },
  { to: '/app/safras', label: 'Safras', requiresAny: ['safra:read'] },
  { to: '/app/atividades-campo', label: 'Atividades de campo', requiresAny: ['atividade:read'] },
  { to: '/app/custos-producao', label: 'Custos', requiresAny: ['custo:read'] },
  { to: '/app/empresas', label: 'Empresas', requiresAny: ['empresa:read'] },
  { to: '/app/fazendas', label: 'Fazendas', requiresAny: ['fazenda:read'] },
  { to: '/app/areas', label: 'Áreas', requiresAny: ['area:read'] },
  { to: '/app/clientes', label: 'Clientes', requiresAny: ['cliente:read'] },
  { to: '/app/produtos', label: 'Produtos', requiresAny: ['produto:read'] },
  { to: '/app/tabela-precos', label: 'Tabelas de preço', requiresAny: ['preco:read'] },
  { to: '/app/admin/users', label: 'Usuarios', requiresAny: ['admin:users'] },
  { to: '/app/admin/roles', label: 'Cargos', requiresAny: ['admin:roles'] },
  { to: '/app/configuracoes', label: 'Configurações', requiresAny: ['view:settings'] },
  { to: '/app/auditoria', label: 'Auditoria', requiresAny: ['auditoria:read'] },
]

export function Sidebar(): ReactElement {
  const { user } = useAuth()
  const userPerms = user?.permissions ?? []

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold">AgroFlow</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.filter((item) => hasAnyPermission(userPerms, item.requiresAny)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                'block rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/60',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
