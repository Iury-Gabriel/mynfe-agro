import { ChevronDown, Leaf } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { empresaAtiva, navItems, usuarioAtivo } from '../mock'

import { InitialsAvatar } from './initials-avatar'

import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'

export function AgroFlowTopNav(): ReactElement {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        {/* Marca */}
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-background shadow-lg shadow-emerald-500/20">
            <Leaf className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">AgroFlow</span>
        </div>

        {/* Navegação */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/preview'}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/5 text-foreground ring-1 ring-inset ring-white/10'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Empresa ativa + usuário */}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 text-left transition-colors hover:bg-card"
          >
            <InitialsAvatar initials={empresaAtiva.initials} className="size-8 rounded-lg" />
            <span className="hidden sm:block">
              <span className="block text-[11px] leading-tight text-muted-foreground">Empresa ativa</span>
              <span className="block text-sm font-semibold leading-tight text-foreground">
                {empresaAtiva.nome}
              </span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>

          <InitialsAvatar
            initials={usuarioAtivo.initials}
            className="size-10 bg-white/5 text-foreground ring-white/10"
          />
        </div>
      </div>
    </header>
  )
}
