import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TenantStatusDialog } from './tenant-status-dialog'

import type { Tenant } from '@/features/platform/api/tenants-api'

import { renderWithProviders } from '@/test/render-with-providers'

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 't1',
    nome: 'Fazenda Verde',
    status: 'ativo',
    empresasCount: 2,
    usuariosCount: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('TenantStatusDialog', () => {
  it('mostra o texto de suspensão para tenant ativo e confirma', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <TenantStatusDialog
        tenant={makeTenant()}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Suspender tenant' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Suspender' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('mostra o texto de ativação para tenant suspenso', () => {
    renderWithProviders(
      <TenantStatusDialog
        tenant={makeTenant({ status: 'suspenso' })}
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Ativar tenant' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativar' })).toBeInTheDocument()
  })

  it('desabilita os botões e mostra "Salvando..." quando pendente', () => {
    renderWithProviders(
      <TenantStatusDialog
        tenant={makeTenant()}
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
