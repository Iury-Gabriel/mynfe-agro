import { makeNotaFiscalEvento } from '@test/factories/make-nota-fiscal-evento'
import { describe, expect, it } from 'vitest'


import { NotaFiscalEvento } from './nota-fiscal-evento'

describe(NotaFiscalEvento.name, () => {
  it('cria com defaults (payload vazio, createdAt = data)', () => {
    const data = new Date('2024-03-10')
    const sut = NotaFiscalEvento.create({
      tenantId: 'tenant-1',
      notaFiscalId: 'nota-1',
      tipo: 'emissao',
      data,
    })

    expect(sut.payload).toEqual({})
    expect(sut.createdAt).toEqual(data)
  })

  it('expõe getters', () => {
    const data = new Date('2024-03-10')
    const sut = makeNotaFiscalEvento({
      tipo: 'cancelamento',
      payload: { motivo: 'erro' },
      data,
      createdAt: new Date('2024-03-11'),
    })

    expect(sut.id.toString()).toBe('nota-evento-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.notaFiscalId).toBe('nota-1')
    expect(sut.tipo).toBe('cancelamento')
    expect(sut.payload).toEqual({ motivo: 'erro' })
    expect(sut.data).toEqual(data)
    expect(sut.createdAt).toEqual(new Date('2024-03-11'))
  })
})
