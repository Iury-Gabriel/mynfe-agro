import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { NotaDetailDialog } from './nota-detail-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

const nota = {
  id: 'nf1',
  tenantId: 't1',
  empresaEmitenteId: 'Verde Folha',
  pedidoId: 'pd1',
  clienteId: 'Sacolão do Bairro',
  numero: '1042',
  serie: '1',
  modelo: '55',
  naturezaOperacao: 'Venda',
  status: 'autorizada' as const,
  chaveAcesso: '35260612345678000190550010000010421000010428',
  protocolo: '135260000891234',
  valorTotal: 2156.3,
  ambiente: 'homologacao',
  xmlUrl: null,
  danfeUrl: null,
  mensagemRetorno: null,
  dataEmissao: '2026-06-26T00:00:00.000Z',
  itens: [
    {
      id: 'it1',
      produtoId: 'p1',
      descricao: 'Alface Crespa',
      ncm: '0705.11.00',
      cfop: '5101',
      cstCsosn: '00',
      quantidade: 120,
      valorUnitario: 2.8,
      valorTotal: 336,
      impostos: {},
    },
  ],
  eventos: [],
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
}

describe('NotaDetailDialog', () => {
  it('renderiza chave, protocolo e itens quando aberto', () => {
    renderWithProviders(
      <NotaDetailDialog open onOpenChange={vi.fn()} nota={nota} isLoading={false} />,
    )

    expect(screen.getByRole('heading', { name: 'NF-e 1042 / Série 1' })).toBeInTheDocument()
    expect(screen.getByText(nota.chaveAcesso)).toBeInTheDocument()
    expect(screen.getByText(nota.protocolo)).toBeInTheDocument()
    expect(screen.getByText('Alface Crespa')).toBeInTheDocument()
  })
})
