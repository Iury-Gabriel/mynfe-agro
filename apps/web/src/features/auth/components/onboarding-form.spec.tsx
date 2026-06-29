import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OnboardingForm, toRegisterPayload, type OnboardingFormValues } from './onboarding-form'

import { renderWithProviders } from '@/test/render-with-providers'

function fillValid(): void {
  fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: '  Maria  ' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'Maria@Example.COM' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-super-forte' } })
  fireEvent.change(screen.getByLabelText('Nome da organização'), {
    target: { value: 'Fazenda Verde' },
  })
  fireEvent.change(screen.getByLabelText('Razão social'), {
    target: { value: 'Verde Folha LTDA' },
  })
  fireEvent.change(screen.getByLabelText('CNPJ / CPF'), { target: { value: '12345678000190' } })
  fireEvent.change(screen.getByLabelText('Regime tributário'), {
    target: { value: 'Simples Nacional' },
  })
  fireEvent.change(screen.getByLabelText('CRT'), { target: { value: '1' } })
}

describe('OnboardingForm', () => {
  it('renderiza todos os campos do cadastro', () => {
    renderWithProviders(
      <OnboardingForm onSubmit={vi.fn()} isPending={false} submitLabel="Criar conta" />,
    )

    expect(screen.getByLabelText('Seu nome')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome da organização')).toBeInTheDocument()
    expect(screen.getByLabelText('Razão social')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de pessoa')).toBeInTheDocument()
    expect(screen.getByLabelText('CNPJ / CPF')).toBeInTheDocument()
    expect(screen.getByLabelText('Regime tributário')).toBeInTheDocument()
    expect(screen.getByLabelText('CRT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('envia o payload normalizado ao submeter com dados válidos', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <OnboardingForm onSubmit={onSubmit} isPending={false} submitLabel="Criar conta" />,
    )

    fillValid()
    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="tipoPessoa"]')!, {
      target: { value: 'PF' },
    })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values = onSubmit.mock.calls[0]![0] as OnboardingFormValues
    expect(toRegisterPayload(values)).toEqual({
      name: 'Maria',
      email: 'maria@example.com',
      password: 'senha-super-forte',
      tenantNome: 'Fazenda Verde',
      empresa: {
        razaoSocial: 'Verde Folha LTDA',
        cnpjCpf: '12345678000190',
        tipoPessoa: 'PF',
        regimeTributario: 'Simples Nacional',
        crt: '1',
      },
    })
  })

  it('exibe erros de validação e não submete quando o form está vazio', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <OnboardingForm onSubmit={onSubmit} isPending={false} submitLabel="Criar conta" />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Nome obrigatório')).toBeInTheDocument()
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(screen.getByText('A senha deve ter no mínimo 12 caracteres')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('valida CNPJ/CPF com menos de 11 dígitos', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <OnboardingForm onSubmit={onSubmit} isPending={false} submitLabel="Criar conta" />,
    )

    fillValid()
    fireEvent.change(screen.getByLabelText('CNPJ / CPF'), { target: { value: '123' } })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Mínimo 11 dígitos')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('valida e-mail malformado', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <OnboardingForm onSubmit={onSubmit} isPending={false} submitLabel="Criar conta" />,
    )

    fillValid()
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'nao-eh-email' } })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('mapeia erros field-level do servidor (paths empresa.* e top-level)', async () => {
    renderWithProviders(
      <OnboardingForm
        onSubmit={vi.fn()}
        isPending={false}
        submitLabel="Criar conta"
        serverDetails={[
          { path: 'email', message: 'E-mail já cadastrado' },
          { path: 'empresa.cnpjCpf', message: 'CNPJ inválido' },
          { path: 'desconhecido', message: 'ignorar' },
        ]}
      />,
    )

    expect(await screen.findByText('E-mail já cadastrado')).toBeInTheDocument()
    expect(screen.getByText('CNPJ inválido')).toBeInTheDocument()
    expect(screen.queryByText('ignorar')).not.toBeInTheDocument()
  })

  it('não altera o form quando serverDetails está vazio', () => {
    renderWithProviders(
      <OnboardingForm
        onSubmit={vi.fn()}
        isPending={false}
        submitLabel="Criar conta"
        serverDetails={[]}
      />,
    )

    expect(screen.queryByText('E-mail já cadastrado')).not.toBeInTheDocument()
  })

  it('desabilita o botão e mostra "Enviando..." quando pendente', () => {
    renderWithProviders(
      <OnboardingForm onSubmit={vi.fn()} isPending submitLabel="Criar conta" />,
    )

    expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled()
  })
})
