import { SidebarNav } from './sidebar-nav'

import type { ReactElement } from 'react'

export function Sidebar(): ReactElement {
  return (
    <aside className="agroflow sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <SidebarNav />
    </aside>
  )
}
