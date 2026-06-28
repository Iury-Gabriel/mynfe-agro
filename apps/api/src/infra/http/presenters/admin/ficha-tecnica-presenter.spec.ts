import { makeProdutoFichaTecnica } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { FichaTecnicaPresenter } from './ficha-tecnica-presenter'

describe(FichaTecnicaPresenter.name, () => {
  it('mapeia todos os campos', () => {
    const ficha = makeProdutoFichaTecnica({
      id: 'ficha-1',
      descricaoComponente: 'Milho moído',
      quantidadeReferencia: 5,
      observacoes: 'Base',
    })

    const sut = FichaTecnicaPresenter.toHTTP(ficha)

    expect(sut.id).toBe('ficha-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.descricaoComponente).toBe('Milho moído')
    expect(sut.quantidadeReferencia).toBe(5)
    expect(sut.observacoes).toBe('Base')
  })

  it('mapeia campos opcionais nulos', () => {
    const ficha = makeProdutoFichaTecnica({ quantidadeReferencia: null, observacoes: null })
    const sut = FichaTecnicaPresenter.toHTTP(ficha)

    expect(sut.quantidadeReferencia).toBeNull()
    expect(sut.observacoes).toBeNull()
  })
})
