import { AlertTriangle, Clock, ListChecks, Sprout } from 'lucide-react'

import { attentionItems, type AttentionItem } from '../mock'

import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'


const ICONS = {
  alert: AlertTriangle,
  list: ListChecks,
  clock: Clock,
  sprout: Sprout,
}

const TONES: Record<AttentionItem['tone'], string> = {
  danger: 'bg-red-500/10 text-red-300',
  warning: 'bg-amber-500/10 text-amber-300',
  neutral: 'bg-sky-500/10 text-sky-300',
  success: 'bg-emerald-500/10 text-emerald-300',
}

export function AttentionList(): ReactElement {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
      <h2 className="text-lg font-bold text-foreground">Precisa de atenção</h2>

      <ul className="mt-4 space-y-2.5">
        {attentionItems.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li
              key={item.title}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-3 transition-colors hover:bg-background/70"
            >
              <span className={cn('flex size-10 items-center justify-center rounded-lg', TONES[item.tone])}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.description}</p>
              </div>
              <span className="text-xl font-bold tabular-nums text-foreground">{item.count}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
