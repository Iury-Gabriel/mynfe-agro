import { Menu } from 'lucide-react'

import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { EmpresaSwitcher } from '@/features/admin/components/empresas/empresa-switcher'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

export function Header({ onMenuClick }: { onMenuClick?: () => void }): ReactElement {
  const { user } = useAuth()
  const canReadEmpresas = hasAnyPermission(user?.permissions, ['empresa:read'])

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
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
        <div className="shrink-0 truncate text-sm text-muted-foreground">
          {user.name} <span className="hidden text-xs sm:inline">({user.email})</span>
        </div>
      )}
    </header>
  )
}
