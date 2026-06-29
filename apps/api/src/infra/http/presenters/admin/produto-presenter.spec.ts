import { makeProduto } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { ProdutoPresenter } from './produto-presenter'

describe(ProdutoPresenter.name, () => {
  it('mapeia todos os campos', () => {
    const produto = makeProduto({
      id: 'produto-1',
      descricao: 'Soja a granel',
      precoPadrao: 42.5,
      ncm: '12019000',
      aliquotas: { icms: 12 },
    })

    const sut = ProdutoPresenter.toHTTP(produto)

    expect(sut.id).toBe('produto-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.descricao).toBe('Soja a granel')
    expect(sut.tipo).toBe('bruto')
    expect(sut.unidadeMedida).toBe('KG')
    expect(sut.precoPadrao).toBe(42.5)
    expect(sut.ncm).toBe('12019000')
    expect(sut.aliquotas).toEqual({ icms: 12 })
    expect(sut.status).toBe('ativo')
  })

  it('expõe aliquotas como cópia plana, não a referência do domínio', () => {
    const produto = makeProduto({ aliquotas: { icms: 12 } })
    const sut = ProdutoPresenter.toHTTP(produto)

    expect(sut.aliquotas).toEqual({ icms: 12 })
    expect(sut.aliquotas).not.toBe(produto.aliquotas)
  })

  it('mapeia campos opcionais nulos', () => {
    const produto = makeProduto({ precoPadrao: null, ncm: null, aliquotas: null })
    const sut = ProdutoPresenter.toHTTP(produto)

    expect(sut.precoPadrao).toBeNull()
    expect(sut.ncm).toBeNull()
    expect(sut.aliquotas).toBeNull()
  })
})
