import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

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
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setMenuOpen(true)}
        className="fixed left-3 top-3 z-40 flex size-11 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-foreground backdrop-blur-sm transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:hidden"
      >
        <Menu className="size-5" />
      </button>
      <main className="agroflow agroflow-glow flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
