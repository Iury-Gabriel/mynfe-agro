import { LogOut, Menu } from 'lucide-react'

import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmpresaSwitcher } from '@/features/admin/components/empresas/empresa-switcher'
import { useSignOut } from '@/features/auth/api/auth-api'
import { InitialsAvatar } from '@/features/dashboard/components/initials-avatar'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }): ReactElement {
  const { user } = useAuth()
  const signOut = useSignOut()
  const canReadEmpresas = hasAnyPermission(user?.permissions, ['empresa:read'])

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/40 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 md:hidden"
          aria-label="Abrir menu"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>
        {canReadEmpresas && <EmpresaSwitcher />}
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu do usuário"
              className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-2 py-1 text-sm transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <InitialsAvatar initials={getInitials(user.name)} className="size-8" />
              <span className="hidden max-w-[12rem] truncate font-medium text-foreground sm:inline">
                {user.name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate font-medium text-foreground">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signOut.isPending}
              onSelect={(e) => {
                e.preventDefault()
                signOut.mutate()
              }}
            >
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
