import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { describe, expect, it } from 'vitest'

import { CustomHttpException } from '../exceptions/custom-http.exception'

import { ACTIVE_EMPRESA_HEADER, CurrentEmpresa } from './current-empresa.decorator'

import type { ExecutionContext } from '@nestjs/common'

type Factory = (data: unknown, ctx: ExecutionContext) => string

function getFactory(): Factory {
  class Controller {
    handler(this: void, @CurrentEmpresa() empresaId: string): string {
      return empresaId
    }
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Controller, 'handler') as Record<
    string,
    { factory: Factory }
  >
  return Object.values(metadata)[0].factory
}

function makeContext(headers: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext
}

describe('CurrentEmpresa', () => {
  it('retorna o id do header', () => {
    const factory = getFactory()
    expect(factory(undefined, makeContext({ [ACTIVE_EMPRESA_HEADER]: 'empresa-1' }))).toBe('empresa-1')
  })

  it('usa o primeiro valor quando o header vem como array', () => {
    const factory = getFactory()
    expect(factory(undefined, makeContext({ [ACTIVE_EMPRESA_HEADER]: ['empresa-2', 'empresa-3'] }))).toBe(
      'empresa-2',
    )
  })

  it('lança 400 quando o header está ausente', () => {
    const factory = getFactory()
    expect(() => factory(undefined, makeContext({}))).toThrow(CustomHttpException)
  })

  it('lança 400 quando o header é vazio', () => {
    const factory = getFactory()
    expect(() => factory(undefined, makeContext({ [ACTIVE_EMPRESA_HEADER]: '   ' }))).toThrow(
      CustomHttpException,
    )
  })
})
