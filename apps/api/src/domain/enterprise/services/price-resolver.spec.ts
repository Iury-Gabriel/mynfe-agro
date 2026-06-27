import { makeTabelaPrecoCliente } from '@test/factories/make-tabela-preco-cliente'
import { describe, expect, it } from 'vitest'

import { resolvePreco } from './price-resolver'

describe('resolvePreco', () => {
  const ref = new Date('2024-06-15')

  it('retorna o preço do cliente quando há tabela vigente', () => {
    const preco = makeTabelaPrecoCliente({
      preco: 80,
      vigenciaInicio: new Date('2024-01-01'),
      vigenciaFim: new Date('2024-12-31'),
    })

    const sut = resolvePreco({ precosCliente: [preco], precoPadrao: 100, ref })

    expect(sut).toBe(80)
  })

  it('escolhe o mais recente entre múltiplos vigentes (maior vigenciaInicio)', () => {
    const antigo = makeTabelaPrecoCliente({
      id: 'antigo',
      preco: 70,
      vigenciaInicio: new Date('2024-01-01'),
    })
    const recente = makeTabelaPrecoCliente({
      id: 'recente',
      preco: 90,
      vigenciaInicio: new Date('2024-05-01'),
    })

    const sut = resolvePreco({ precosCliente: [antigo, recente], precoPadrao: 100, ref })

    expect(sut).toBe(90)
  })

  it('trata vigenciaInicio nula como menos específica que uma datada', () => {
    const semInicio = makeTabelaPrecoCliente({ id: 'sem-inicio', preco: 60 })
    const comInicio = makeTabelaPrecoCliente({
      id: 'com-inicio',
      preco: 95,
      vigenciaInicio: new Date('2024-02-01'),
    })

    const sut = resolvePreco({ precosCliente: [semInicio, comInicio], precoPadrao: 100, ref })

    expect(sut).toBe(95)
  })

  it('cai no preço padrão quando não há tabela vigente', () => {
    const expirada = makeTabelaPrecoCliente({
      preco: 80,
      vigenciaFim: new Date('2024-05-01'),
    })

    const sut = resolvePreco({ precosCliente: [expirada], precoPadrao: 120, ref })

    expect(sut).toBe(120)
  })

  it('cai no preço padrão quando não há tabela alguma', () => {
    const sut = resolvePreco({ precosCliente: [], precoPadrao: 150, ref })

    expect(sut).toBe(150)
  })

  it('retorna null quando não há tabela vigente nem preço padrão', () => {
    const expirada = makeTabelaPrecoCliente({
      preco: 80,
      vigenciaInicio: new Date('2024-07-01'),
    })

    const sut = resolvePreco({ precosCliente: [expirada], precoPadrao: null, ref })

    expect(sut).toBeNull()
  })

  it('retorna null quando não há tabela alguma nem preço padrão', () => {
    const sut = resolvePreco({ precosCliente: [], precoPadrao: null, ref })

    expect(sut).toBeNull()
  })
})
