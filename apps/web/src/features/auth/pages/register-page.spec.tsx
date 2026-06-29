import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterPage } from './register-page'

import type * as ReactRouterDom from 'react-router-dom'

import { api } from '@/lib/api-client'
import { ApiError } from '@/lib/api-error'
import { renderWithProviders } from '@/test/render-with-providers'

const navigateMock = vi.fn()
const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return { ...actual, useNavigate: () => navigateMock }
})

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

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o título e o link para login', () => {
    renderWithProviders(<RegisterPage />)

    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/sign-in')
  })

  it('cria a conta, exibe toast e navega para /sign-in no sucesso', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ok: true } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RegisterPage />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/onboarding/register',
        expect.objectContaining({ email: 'maria@example.com', tenantNome: 'Fazenda Verde' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Conta criada, faça login')
    expect(navigateMock).toHaveBeenCalledWith('/sign-in')
  })

  it('exibe erros field-level quando o servidor retorna validação', async () => {
    vi.mocked(api.post).mockRejectedValue(
      new ApiError('bad-request', 'Dados inválidos', 400, [
        { path: 'empresa.cnpjCpf', message: 'CNPJ inválido' },
      ]),
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RegisterPage />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('CNPJ inválido')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('exibe mensagem de e-mail em uso quando o servidor retorna 409', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError('conflict', 'Conflito', 409))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RegisterPage />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está em uso.')
  })

  it('exibe a mensagem do ApiError em outros erros', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError('internal-error', 'Erro interno', 500))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RegisterPage />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno')
  })

  it('exibe mensagem genérica quando o erro não é um ApiError', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<RegisterPage />)

    fillValid()
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível criar a conta. Tente novamente.',
    )
  })
})
