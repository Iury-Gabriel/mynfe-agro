import type { ReactElement } from 'react'

import { EmpresaSwitcher } from '@/features/admin/components/empresas/empresa-switcher'
import { hasAnyPermission } from '@/lib/permissions'
import { useAuth } from '@/providers/auth-context'

export function Header(): ReactElement {
  const { user } = useAuth()
  const canReadEmpresas = hasAnyPermission(user?.permissions, ['empresa:read'])

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border px-6">
      <div>{canReadEmpresas && <EmpresaSwitcher />}</div>
      {user && (
        <div className="text-sm text-muted-foreground">
          {user.name} <span className="text-xs">({user.email})</span>
        </div>
      )}
    </header>
  )
}
