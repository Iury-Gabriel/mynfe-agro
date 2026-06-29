import { Reflector } from '@nestjs/core'
import { describe, expect, it } from 'vitest'

import { REQUIRES_EMPRESA_KEY, RequiresEmpresa } from './requires-empresa.decorator'

describe('RequiresEmpresa', () => {
  it('define a metadata sinalizando que a rota exige empresa ativa', () => {
    class Controller {
      @RequiresEmpresa()
      handler(this: void): null {
        return null
      }
    }

    const reflector = new Reflector()
    const value = reflector.get<boolean>(REQUIRES_EMPRESA_KEY, Controller.prototype.handler)

    expect(value).toBe(true)
  })
})
