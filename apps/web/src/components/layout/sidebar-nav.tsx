import {
  Boxes, Building2, ClipboardList, Coins, FileClock, Layers, LayoutDashboard, Leaf, Map,
  Package, Receipt, ScrollText, Settings, Shield, ShoppingCart, Sprout, Tag, Tags, Truck,
  UserCog, Users, Warehouse, Wheat,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import type { LucideIcon } from 'lucide-react'
import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

interface SidebarItem { to: string; label: string; icon: LucideIcon; end?: boolean; requiresAny: readonly string[] }
interface SidebarGroup { label: string; items: readonly SidebarItem[] }

const GROUPS: readonly SidebarGroup[] = [
  { label: '', items: [{ to: '/app', label: 'Início', icon: LayoutDashboard, end: true, requiresAny: ['view:dashboard'] }] },
  { label: 'Vendas', items: [
    { to: '/app/vendas/pedidos', label: 'Pedidos', icon: ShoppingCart, requiresAny: ['pedido:read'] },
    { to: '/app/vendas/remessas', label: 'Remessas', icon: Truck, requiresAny: ['remessa:read'] },
    { to: '/app/vendas/consolidacao', label: 'Consolidação', icon: Layers, requiresAny: ['consolidacao:create'] },
  ]},
  { label: 'Faturamento', items: [
    { to: '/app/fila-faturamento', label: 'Fila de faturamento', icon: FileClock, requiresAny: ['nota:read'] },
    { to: '/app/notas-fiscais', label: 'Notas fiscais', icon: Receipt, requiresAny: ['nota:read'] },
  ]},
  { label: 'Estoque', items: [
    { to: '/app/estoque', label: 'Estoque', icon: Boxes, requiresAny: ['estoque:read'] },
    { to: '/app/lotes', label: 'Lotes', icon: Package, requiresAny: ['lote:read'] },
    { to: '/app/colheitas', label: 'Colheitas', icon: Wheat, requiresAny: ['colheita:read'] },
  ]},
  { label: 'Produção', items: [
    { to: '/app/safras', label: 'Safras', icon: Sprout, requiresAny: ['safra:read'] },
    { to: '/app/atividades-campo', label: 'Atividades de campo', icon: ClipboardList, requiresAny: ['atividade:read'] },
    { to: '/app/custos-producao', label: 'Custos', icon: Coins, requiresAny: ['custo:read'] },
  ]},
  { label: 'Cadastros', items: [
    { to: '/app/empresas', label: 'Empresas', icon: Building2, requiresAny: ['empresa:read'] },
    { to: '/app/fazendas', label: 'Fazendas', icon: Warehouse, requiresAny: ['fazenda:read'] },
    { to: '/app/areas', label: 'Áreas', icon: Map, requiresAny: ['area:read'] },
    { to: '/app/clientes', label: 'Clientes', icon: Users, requiresAny: ['cliente:read'] },
    { to: '/app/produtos', label: 'Produtos', icon: Tag, requiresAny: ['produto:read'] },
    { to: '/app/tabela-precos', label: 'Tabelas de preço', icon: Tags, requiresAny: ['preco:read'] },
  ]},
  { label: 'Administração', items: [
    { to: '/app/admin/users', label: 'Usuários', icon: UserCog, requiresAny: ['admin:users'] },
    { to: '/app/admin/roles', label: 'Cargos', icon: Shield, requiresAny: ['admin:roles'] },
    { to: '/app/configuracoes', label: 'Configurações', icon: Settings, requiresAny: ['view:settings'] },
    { to: '/app/auditoria', label: 'Auditoria', icon: ScrollText, requiresAny: ['auditoria:read'] },
  ]},
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }): ReactElement {
  const { user } = useAuth()
  const userPerms = user?.permissions ?? []
  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasAnyPermission(userPerms, item.requiresAny)),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-900/30">
          <Leaf className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight text-foreground">AgroFlow</p>
          <p className="text-[11px] text-sidebar-foreground/50">Gestão agro</p>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-6">
        {visibleGroups.map((group, idx) => (
          <div key={group.label || idx} className="space-y-1">
            {group.label && (
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{group.label}</p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
                  className={({ isActive }) => cn('group flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-emerald-500/15 text-emerald-300' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}>
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('size-[18px] shrink-0 transition-colors', isActive ? 'text-emerald-400' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground')} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}
