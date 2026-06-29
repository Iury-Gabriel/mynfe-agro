import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AreaFormDialog } from './area-form-dialog'

import type { Area } from '@/features/admin/api/areas-api'

import { renderWithProviders } from '@/test/render-with-providers'

function makeArea(overrides: Partial<Area> = {}): Area {
  return {
    id: 'a1',
    tenantId: 't1',
    fazendaId: 'f1',
    identificacao: 'Talhão 1',
    tamanho: 12.5,
    unidadeTamanho: 'm2',
    rotulo: 'Talhão',
    geometria: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('AreaFormDialog', () => {
  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <AreaFormDialog open={false} onOpenChange={vi.fn()} area={null} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AreaFormDialog open onOpenChange={vi.fn()} area={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar área' }))

    expect(await screen.findByText('Fazenda obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Identificação obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('cria com payload normalizado (tamanho e rótulo vazios viram null)', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AreaFormDialog open onOpenChange={vi.fn()} area={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Fazenda'), '  f9  ')
    await user.type(screen.getByLabelText('Identificação'), '  Gleba A  ')
    await user.click(screen.getByRole('button', { name: 'Criar área' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        fazendaId: 'f9',
        identificacao: 'Gleba A',
        tamanho: null,
        unidadeTamanho: 'ha',
        rotulo: null,
      })
    })
  })

  it('cria com tamanho numérico, rótulo e unidade trocada pelo select', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AreaFormDialog open onOpenChange={vi.fn()} area={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Fazenda'), 'f1')
    await user.type(screen.getByLabelText('Identificação'), 'Talhão 1')
    await user.type(screen.getByLabelText('Tamanho'), '10')
    await user.type(screen.getByLabelText('Rótulo'), 'Canteiro')
    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="unidadeTamanho"]')!, {
      target: { value: 'm2' },
    })
    await user.click(screen.getByRole('button', { name: 'Criar área' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ tamanho: 10, unidadeTamanho: 'm2', rotulo: 'Canteiro' }),
      )
    })
  })

  it('vem pré-preenchido no modo edição e desabilita o campo fazenda', () => {
    renderWithProviders(
      <AreaFormDialog open onOpenChange={vi.fn()} area={makeArea()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByRole('heading', { name: 'Editar área' })).toBeInTheDocument()
    expect(screen.getByLabelText('Identificação')).toHaveValue('Talhão 1')
    expect(screen.getByLabelText('Fazenda')).toBeDisabled()
    expect(screen.getByLabelText('Tamanho')).toHaveValue('12.5')
  })

  it('normaliza unidade inválida para ha e tamanho nulo para vazio na edição', () => {
    renderWithProviders(
      <AreaFormDialog
        open
        onOpenChange={vi.fn()}
        area={makeArea({ unidadeTamanho: 'xx', tamanho: null, rotulo: null })}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByLabelText('Tamanho')).toHaveValue('')
  })

  it('normaliza unidade nula para ha na edição', () => {
    renderWithProviders(
      <AreaFormDialog
        open
        onOpenChange={vi.fn()}
        area={makeArea({ unidadeTamanho: null })}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(
      document.querySelector<HTMLSelectElement>('select[name="unidadeTamanho"]')!.value,
    ).toBe('ha')
  })

  it('fecha o diálogo ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AreaFormDialog open onOpenChange={onOpenChange} area={null} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exibe "Salvando..." e desabilita o submit quando isPending é true', () => {
    renderWithProviders(
      <AreaFormDialog open onOpenChange={vi.fn()} area={null} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })
})
