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

  it('mostra estado de carregamento e título genérico', () => {
    renderWithProviders(
      <NotaDetailDialog open onOpenChange={vi.fn()} nota={undefined} isLoading />,
    )

    expect(screen.getByRole('heading', { name: 'Detalhe da nota' })).toBeInTheDocument()
    expect(screen.getByText('Carregando nota…')).toBeInTheDocument()
  })

  it('renderiza mensagem de retorno, links e eventos', () => {
    const notaCompleta = {
      ...nota,
      mensagemRetorno: 'Autorizado o uso da NF-e',
      danfeUrl: 'https://danfe.example/nf1.pdf',
      xmlUrl: 'https://xml.example/nf1.xml',
      itens: [
        {
          id: 'it2',
          produtoId: 'p2',
          descricao: 'Tomate Italiano',
          ncm: null,
          cfop: null,
          cstCsosn: null,
          quantidade: 50,
          valorUnitario: 4.5,
          valorTotal: 225,
          impostos: {},
        },
      ],
      eventos: [
        {
          id: 'ev1',
          tipo: 'Autorização',
          payload: {},
          data: '2026-06-26T12:00:00.000Z',
        },
      ],
    }

    renderWithProviders(
      <NotaDetailDialog open onOpenChange={vi.fn()} nota={notaCompleta} isLoading={false} />,
    )

    expect(screen.getByText('Autorizado o uso da NF-e')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /DANFE/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /XML/ })).toBeInTheDocument()
    expect(screen.getByText('Autorização')).toBeInTheDocument()
    expect(screen.getByText('Tomate Italiano')).toBeInTheDocument()
  })

  it('usa traços para campos ausentes', () => {
    const notaParcial = {
      ...nota,
      serie: null,
      naturezaOperacao: null,
      chaveAcesso: null,
      protocolo: null,
    }

    renderWithProviders(
      <NotaDetailDialog open onOpenChange={vi.fn()} nota={notaParcial} isLoading={false} />,
    )

    expect(screen.getByRole('heading', { name: 'NF-e 1042 / Série —' })).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
