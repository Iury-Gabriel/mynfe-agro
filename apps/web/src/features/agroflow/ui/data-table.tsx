import type { ReactElement, ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  className?: string
}

export type Row = Record<string, ReactNode> & { id: string }

interface DataTableProps {
  columns: Column[]
  rows: Row[]
  minWidth?: number
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const

export function DataTable({ columns, rows, minWidth = 640 }: DataTableProps): ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('pb-3 font-medium', ALIGN[col.align ?? 'left'], col.className)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border/50 transition-colors hover:bg-white/[0.02]">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('py-4 pr-4 text-sm text-foreground', ALIGN[col.align ?? 'left'])}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p>
      )}
    </div>
  )
}
