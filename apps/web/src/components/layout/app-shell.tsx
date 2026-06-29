import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { SidebarNav } from './sidebar-nav'

import type { ReactElement } from 'react'

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

export function AppShell(): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="agroflow w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="agroflow agroflow-glow flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
