import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmitirDanfeDialog } from './emitir-danfe-dialog'

import type { FilaPedido } from '@/features/fiscal/api/fila-faturamento-api'
import type { NotaFiscal } from '@/features/fiscal/api/notas-fiscais-api'


import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({ api: { get: vi.fn() } }))

const pedido: FilaPedido = {
  id: 'pd1',
  tenantId: 't1',
  empresaFaturadoraId: 'e1',
  clienteId: 'cli1',
  numero: 'PED-0042',
  tipo: 'avulso',
  status: 'confirmado',
  valorTotal: 336,
  data: '2026-06-20T00:00:00.000Z',
}

function mockGets() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/api/empresas') {
      return Promise.resolve({
        data: {
          empresas: [
            {
              id: 'e1',
              razaoSocial: 'Verde Folha',
              cnpjCpfFormatado: '12.345.678/0001-90',
              regimeTributario: 'Simples',
              ambienteFiscal: 'homologacao',
              serieNfe: 1,
            },
          ],
        },
      })
    }
    if (url === '/api/clientes') {
      return Promise.resolve({
        data: {
          clientes: [
            { id: 'cli1', razaoSocialNome: 'Quitanda Horta Viva', cnpjCpfFormatado: '98.765.432/0001-10', municipio: 'Campinas', uf: 'SP' },
          ],
        },
      })
    }
    if (url === '/api/produtos') {
      return Promise.resolve({
        data: {
          produtos: [{ id: 'p1', descricao: 'Alface Crespa', ncm: '0705.11.00', cfopPadrao: '5101', cstCsosn: '00' }],
        },
      })
    }
    return Promise.resolve({
      data: {
        pedido: {
          id: 'pd1',
          itens: [{ id: 'it1', produtoId: 'p1', loteId: null, quantidade: 120, precoUnitario: 2.8, valorTotal: 336 }],
        },
      },
    })
  })
}

describe('EmitirDanfeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGets()
  })

  it('mostra emitente, destinatário, item fiscal e ambiente', async () => {
    renderWithProviders(
      <EmitirDanfeDialog
        open
        onOpenChange={vi.fn()}
        pedido={pedido}
        empresaId="e1"
        nota={null}
        isEmitting={false}
        onConfirm={vi.fn()}
      />,
    )

    expect(await screen.findByText('Verde Folha')).toBeInTheDocument()
    expect(await screen.findByText('Quitanda Horta Viva')).toBeInTheDocument()
    expect(await screen.findByText('Alface Crespa')).toBeInTheDocument()
    expect(screen.getByText('0705.11.00')).toBeInTheDocument()
    expect(screen.getByText('Homologação')).toBeInTheDocument()
  })

  it('dispara onConfirm ao clicar em Emitir DANFE', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <EmitirDanfeDialog
        open
        onOpenChange={vi.fn()}
        pedido={pedido}
        empresaId="e1"
        nota={null}
        isEmitting={false}
        onConfirm={onConfirm}
      />,
    )

    await user.click(await screen.findByRole('button', { name: /Emitir DANFE/ }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('exibe resultado da emissão quando há nota', async () => {
    const nota: NotaFiscal = {
      id: 'nf1',
      tenantId: 't1',
      empresaEmitenteId: 'e1',
      pedidoId: 'pd1',
      clienteId: 'cli1',
      status: 'autorizada',
      numero: '1042',
      serie: '1',
      modelo: '55',
      naturezaOperacao: 'Venda',
      chaveAcesso: 'CHAVE-AAA',
      protocolo: 'PROTO-123',
      valorTotal: 336,
      ambiente: 'homologacao',
      dataEmissao: '2026-06-26T00:00:00.000Z',
      mensagemRetorno: null,
      danfeUrl: 'https://danfe',
      xmlUrl: null,
      itens: [],
      eventos: [],
      createdAt: '2026-06-26T00:00:00.000Z',
      updatedAt: '2026-06-26T00:00:00.000Z',
    }

    renderWithProviders(
      <EmitirDanfeDialog
        open
        onOpenChange={vi.fn()}
        pedido={pedido}
        empresaId="e1"
        nota={nota}
        isEmitting={false}
        onConfirm={vi.fn()}
      />,
    )

    expect(await screen.findByText('CHAVE-AAA')).toBeInTheDocument()
    expect(screen.getByText('PROTO-123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument()
  })
})
