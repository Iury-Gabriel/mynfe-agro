import { Leaf } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import type { ReactElement } from 'react'

export function AuthLayout(): ReactElement {
  return (
    <div className="agroflow agroflow-glow flex min-h-screen flex-col items-center justify-center px-4 py-12 text-foreground">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-background shadow-lg shadow-emerald-500/20">
          <Leaf className="size-5" strokeWidth={2.5} />
        </span>
        <span className="text-xl font-bold tracking-tight text-foreground">AgroFlow</span>
      </div>

      <Outlet />

      <p className="mt-8 text-center text-xs text-muted-foreground">
        AgroFlow · Gestão do campo à nota fiscal
      </p>
    </div>
  )
}
