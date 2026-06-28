import { makeNotaFiscal, makeNotaFiscalEvento, makeNotaFiscalItem } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { NotaFiscalPresenter } from './nota-fiscal-presenter'

describe('NotaFiscalPresenter', () => {
  it('serializa a nota com itens e eventos', () => {
    const nota = makeNotaFiscal({
      id: 'nota-1',
      status: 'autorizada',
      chaveAcesso: '0'.repeat(44),
      protocolo: 'prot-1',
      xmlUrl: 'https://x/nfe.xml',
      danfeUrl: 'https://x/danfe.pdf',
      dataEmissao: new Date('2024-01-03'),
      itens: [makeNotaFiscalItem({ id: 'i-1', impostos: { icms: 12 } })],
      eventos: [makeNotaFiscalEvento({ id: 'e-1', tipo: 'emissao', payload: { numero: '1' } })],
    })

    const output = NotaFiscalPresenter.toHTTP(nota)

    expect(output.id).toBe('nota-1')
    expect(output.status).toBe('autorizada')
    expect(output.chaveAcesso).toBe('0'.repeat(44))
    expect(output.protocolo).toBe('prot-1')
    expect(output.xmlUrl).toBe('https://x/nfe.xml')
    expect(output.danfeUrl).toBe('https://x/danfe.pdf')
    expect(output.dataEmissao).toEqual(new Date('2024-01-03'))
    expect(output.itens).toHaveLength(1)
    expect(output.itens[0].id).toBe('i-1')
    expect(output.itens[0].impostos).toEqual({ icms: 12 })
    expect(output.eventos).toHaveLength(1)
    expect(output.eventos[0].tipo).toBe('emissao')
    expect(output.eventos[0].payload).toEqual({ numero: '1' })
  })

  it('não expõe plugnotasId nem campos internos do provider', () => {
    const nota = makeNotaFiscal({ plugnotasId: 'plugnotas-secreto' })

    const output = NotaFiscalPresenter.toHTTP(nota)

    expect(output).not.toHaveProperty('plugnotasId')
    expect(JSON.stringify(output)).not.toContain('plugnotas-secreto')
  })

  it('preserva campos nullable quando a nota ainda está pendente', () => {
    const nota = makeNotaFiscal({
      status: 'pendente',
      chaveAcesso: null,
      protocolo: null,
      xmlUrl: null,
      danfeUrl: null,
      mensagemRetorno: null,
      dataEmissao: null,
    })

    const output = NotaFiscalPresenter.toHTTP(nota)

    expect(output.status).toBe('pendente')
    expect(output.chaveAcesso).toBeNull()
    expect(output.protocolo).toBeNull()
    expect(output.xmlUrl).toBeNull()
    expect(output.danfeUrl).toBeNull()
    expect(output.mensagemRetorno).toBeNull()
    expect(output.dataEmissao).toBeNull()
    expect(output.itens).toHaveLength(0)
    expect(output.eventos).toHaveLength(0)
  })
})
