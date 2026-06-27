import { makeArea } from '@test/factories/make-area'
import { describe, expect, it } from 'vitest'

import { AreaPresenter } from './area-presenter'

describe(AreaPresenter.name, () => {
  it('mapeia todos os campos da entidade', () => {
    const area = makeArea({
      id: 'area-1',
      identificacao: 'Talhão 01',
      tamanho: 120.5,
      unidadeTamanho: 'ha',
      rotulo: 'Soja',
      geometria: { type: 'Polygon' },
    })

    const sut = AreaPresenter.toHTTP(area)

    expect(sut.id).toBe('area-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.fazendaId).toBe('fazenda-1')
    expect(sut.identificacao).toBe('Talhão 01')
    expect(sut.tamanho).toBe(120.5)
    expect(sut.unidadeTamanho).toBe('ha')
    expect(sut.rotulo).toBe('Soja')
    expect(sut.geometria).toEqual({ type: 'Polygon' })
    expect(sut.createdAt).toEqual(area.createdAt)
    expect(sut.updatedAt).toEqual(area.updatedAt)
  })

  it('mapeia campos opcionais nulos', () => {
    const area = makeArea({
      tamanho: null,
      unidadeTamanho: null,
      rotulo: null,
      geometria: null,
    })

    const sut = AreaPresenter.toHTTP(area)

    expect(sut.tamanho).toBeNull()
    expect(sut.unidadeTamanho).toBeNull()
    expect(sut.rotulo).toBeNull()
    expect(sut.geometria).toBeNull()
  })

  it('não vaza referência da geometria — expõe cópia plana', () => {
    const area = makeArea({ geometria: { type: 'Point' } })
    const sut = AreaPresenter.toHTTP(area)

    expect(sut.geometria).toEqual({ type: 'Point' })
    expect(sut.geometria).not.toBe(area.geometria)
  })
})
