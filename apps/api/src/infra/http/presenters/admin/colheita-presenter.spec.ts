import { makeColheita } from '@test/factories/make-colheita'
import { describe, expect, it } from 'vitest'

import { ColheitaPresenter } from './colheita-presenter'

describe('ColheitaPresenter', () => {
  it('serializa a entidade sem vazar internals do Prisma', () => {
    const colheita = makeColheita({
      id: 'colheita-1',
      quantidade: 1200.5,
      safraId: 'safra-1',
      areaId: 'area-1',
      responsavelUsuarioId: 'user-1',
    })

    const dto = ColheitaPresenter.toHTTP(colheita)

    expect(dto.id).toBe('colheita-1')
    expect(dto.quantidade).toBe(1200.5)
    expect(dto.safraId).toBe('safra-1')
    expect(dto.areaId).toBe('area-1')
    expect(dto.responsavelUsuarioId).toBe('user-1')
    expect(dto).not.toHaveProperty('props')
    expect(dto).not.toHaveProperty('deletedAt')
  })

  it('preserva campos nullable', () => {
    const colheita = makeColheita({ safraId: null, areaId: null, responsavelUsuarioId: null })
    const dto = ColheitaPresenter.toHTTP(colheita)
    expect(dto.safraId).toBeNull()
    expect(dto.areaId).toBeNull()
    expect(dto.responsavelUsuarioId).toBeNull()
  })
})
