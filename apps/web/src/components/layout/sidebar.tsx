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
  { to: '/app/empresas', label: 'Empresas', requiresAny: ['empresa:read'] },
  { to: '/app/admin/users', label: 'Usuarios', requiresAny: ['admin:users'] },
  { to: '/app/admin/roles', label: 'Cargos', requiresAny: ['admin:roles'] },
]

export function Sidebar(): ReactElement {
  const { user } = useAuth()
  const userPerms = user?.permissions ?? []

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold">Template</h2>
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
