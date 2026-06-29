import { Outlet } from 'react-router-dom'

import type { ReactElement } from 'react'

import { AgroFlowTopNav } from '@/features/dashboard/components/agroflow-top-nav'


export function AgroFlowLayout(): ReactElement {
  return (
    <div className="agroflow agroflow-glow min-h-screen text-foreground">
      <AgroFlowTopNav />

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <Outlet />

        <p className="mt-12 text-center text-xs text-muted-foreground">
          AgroFlow · Plataforma de gestão do campo à nota fiscal — dados ilustrativos do MVP.
        </p>
      </main>
    </div>
  )
}
