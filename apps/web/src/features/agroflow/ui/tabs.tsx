import { useState, type ReactElement, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  items: TabItem[]
}

export function Tabs({ items }: TabsProps): ReactElement {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const current = items.find((item) => item.id === active) ?? items[0]

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/50 bg-card/40 p-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={cn(
              'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
              item.id === current?.id
                ? 'bg-white/10 text-foreground ring-1 ring-inset ring-white/10'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-5">{current?.content}</div>
    </div>
  )
}
