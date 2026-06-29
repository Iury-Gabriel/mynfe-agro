import { makeTabelaPrecoCliente } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { TabelaPrecoPresenter } from './tabela-preco-presenter'

describe(TabelaPrecoPresenter.name, () => {
  it('mapeia todos os campos', () => {
    const tabela = makeTabelaPrecoCliente({
      id: 'tabela-preco-1',
      preco: 250.75,
      vigenciaInicio: new Date('2024-01-01'),
      vigenciaFim: new Date('2024-12-31'),
    })

    const sut = TabelaPrecoPresenter.toHTTP(tabela)

    expect(sut.id).toBe('tabela-preco-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.clienteId).toBe('cliente-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.preco).toBe(250.75)
    expect(sut.vigenciaInicio).toEqual(new Date('2024-01-01'))
    expect(sut.vigenciaFim).toEqual(new Date('2024-12-31'))
  })

  it('mapeia vigências nulas', () => {
    const tabela = makeTabelaPrecoCliente({ vigenciaInicio: null, vigenciaFim: null })
    const sut = TabelaPrecoPresenter.toHTTP(tabela)

    expect(sut.vigenciaInicio).toBeNull()
    expect(sut.vigenciaFim).toBeNull()
  })
})
