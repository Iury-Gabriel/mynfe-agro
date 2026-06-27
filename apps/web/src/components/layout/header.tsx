import type { ReactElement } from 'react'

import { useAuth } from '@/providers/auth-context'

export function Header(): ReactElement {
  const { user } = useAuth()
  return (
    <header className="flex h-14 items-center justify-end border-b border-border px-6">
      {user && (
        <div className="text-sm text-muted-foreground">
          {user.name} <span className="text-xs">({user.email})</span>
        </div>
      )}
    </header>
  )
}
