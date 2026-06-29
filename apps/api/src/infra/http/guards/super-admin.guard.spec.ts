import { describe, expect, it, vi } from 'vitest'

import { CustomHttpException } from '../exceptions/custom-http.exception'

import { SuperAdminGuard } from './super-admin.guard'

import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'

function makeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext
}

describe(SuperAdminGuard.name, () => {
  it('libera rotas sem a metadata @RequiresSuperAdmin', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) } as unknown as Reflector
    const sut = new SuperAdminGuard(reflector)

    expect(sut.canActivate(makeContext({ user: { isSuperAdmin: false } }))).toBe(true)
  })

  it('libera quando a rota exige super-admin e o usuário é super-admin', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) } as unknown as Reflector
    const sut = new SuperAdminGuard(reflector)

    expect(sut.canActivate(makeContext({ user: { isSuperAdmin: true } }))).toBe(true)
  })

  it('lança forbidden quando a rota exige super-admin e o usuário não é', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) } as unknown as Reflector
    const sut = new SuperAdminGuard(reflector)

    expect(() => sut.canActivate(makeContext({ user: { isSuperAdmin: false } }))).toThrow(
      CustomHttpException,
    )
  })

  it('lança unauthorized quando não há usuário na request', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) } as unknown as Reflector
    const sut = new SuperAdminGuard(reflector)

    expect(() => sut.canActivate(makeContext({}))).toThrow(CustomHttpException)
  })
})
