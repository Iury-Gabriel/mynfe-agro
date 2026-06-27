import { Outlet } from 'react-router-dom'

import { Header } from './header'
import { Sidebar } from './sidebar'

import type { ReactElement } from 'react'

export function AppShell(): ReactElement {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
