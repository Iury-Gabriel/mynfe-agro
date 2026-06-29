import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TenantFormDialog } from './tenant-form-dialog'

import { api } from '@/lib/api-client'
import { ApiError } from '@/lib/api-error'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { post: vi.fn() },
}))

function fillValid(): void {
  fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Maria' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'maria@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-super-forte' } })
  fireEvent.change(screen.getByLabelText('Nome da organização'), {
    target: { value: 'Fazenda Verde' },
  })
  fireEvent.change(screen.getByLabelText('Razão social'), { target: { value: 'Verde Folha' } })
  fireEvent.change(screen.getByLabelText('CNPJ / CPF'), { target: { value: '12345678000190' } })
  fireEvent.change(screen.getByLabelText('Regime tributário'), { target: { value: 'Simples' } })
  fireEvent.change(screen.getByLabelText('CRT'), { target: { value: '1' } })
}

describe('TenantFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria o tenant, dispara onCreated e fecha no sucesso', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { tenant: { id: 't1' } } })
    const onCreated = vi.fn()
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <TenantFormDialog open onOpenChange={onOpenChange} onCreated={onCreated} />,
    )

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar tenant' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/platform/tenants',
        expect.objectContaining({ tenantNome: 'Fazenda Verde' }),
      )
    })
    expect(onCreated).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exibe erros field-level do servidor', async () => {
    vi.mocked(api.post).mockRejectedValue(
      new ApiError('bad-request', 'Inválido', 400, [
        { path: 'empresa.cnpjCpf', message: 'CNPJ inválido' },
      ]),
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantFormDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar tenant' }))

    expect(await screen.findByText('CNPJ inválido')).toBeInTheDocument()
  })

  it('exibe alerta de e-mail em uso quando o servidor retorna 409', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError('conflict', 'Conflito', 409))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantFormDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar tenant' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está em uso.')
  })

  it('exibe a mensagem do ApiError em outros erros', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError('internal-error', 'Erro interno', 500))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantFormDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar tenant' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno')
  })

  it('exibe mensagem genérica quando o erro não é um ApiError', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantFormDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar tenant' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível criar o tenant. Tente novamente.',
    )
  })
})
