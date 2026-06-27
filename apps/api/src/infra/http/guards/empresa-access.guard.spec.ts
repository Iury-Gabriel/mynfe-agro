import { describe, expect, it, vi } from 'vitest'

import { ACTIVE_EMPRESA_HEADER } from '../decorators/current-empresa.decorator'
import { CustomHttpException } from '../exceptions/custom-http.exception'

import { EmpresaAccessGuard } from './empresa-access.guard'

import type { PrismaService } from '@/infra/database/prisma/prisma.service'
import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'

function makeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext
}

function makeReflector(required: boolean | undefined): Reflector {
  return { getAllAndOverride: vi.fn().mockReturnValue(required) } as unknown as Reflector
}

function makePrisma(findFirst: ReturnType<typeof vi.fn>): PrismaService {
  return { usuarioEmpresa: { findFirst } } as unknown as PrismaService
}

describe('EmpresaAccessGuard', () => {
  it('libera quando a rota não exige empresa ativa', async () => {
    const findFirst = vi.fn()
    const sut = new EmpresaAccessGuard(makeReflector(undefined), makePrisma(findFirst))

    await expect(sut.canActivate(makeContext({ headers: {} }))).resolves.toBe(true)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('lança unauthorized quando não há user no request', async () => {
    const sut = new EmpresaAccessGuard(makeReflector(true), makePrisma(vi.fn()))

    await expect(sut.canActivate(makeContext({ headers: {} }))).rejects.toBeInstanceOf(
      CustomHttpException,
    )
  })

  it('lança forbidden quando o user não tem tenant', async () => {
    const sut = new EmpresaAccessGuard(makeReflector(true), makePrisma(vi.fn()))
    const req = { headers: { [ACTIVE_EMPRESA_HEADER]: 'empresa-1' }, user: { id: 'u1', tenantId: null } }

    await expect(sut.canActivate(makeContext(req))).rejects.toBeInstanceOf(CustomHttpException)
  })

  it('lança 400 quando o header de empresa ativa está ausente', async () => {
    const sut = new EmpresaAccessGuard(makeReflector(true), makePrisma(vi.fn()))
    const req = { headers: {}, user: { id: 'u1', tenantId: 'tenant-1' } }

    await expect(sut.canActivate(makeContext(req))).rejects.toBeInstanceOf(CustomHttpException)
  })

  it('lança 400 quando o header de empresa ativa é vazio', async () => {
    const sut = new EmpresaAccessGuard(makeReflector(true), makePrisma(vi.fn()))
    const req = { headers: { [ACTIVE_EMPRESA_HEADER]: '  ' }, user: { id: 'u1', tenantId: 'tenant-1' } }

    await expect(sut.canActivate(makeContext(req))).rejects.toBeInstanceOf(CustomHttpException)
  })

  it('aceita header em array usando o primeiro valor', async () => {
    const findFirst = vi.fn().mockResolvedValue({ empresaId: 'empresa-1' })
    const sut = new EmpresaAccessGuard(makeReflector(true), makePrisma(findFirst))
    const req = {
      headers: { [ACTIVE_EMPRESA_HEADER]: ['empresa-1', 'empresa-2'] },
      user: { id: 'u1', tenantId: 'tenant-1' },
    }

    await expect(sut.canActivate(makeContext(req))).resolves.toBe(true)
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        empresaId: 'empresa-1',
        empresa: { tenantId: 'tenant-1', deletedAt: null },
      },
      select: { empresaId: true },
    })
  })

  it('lança forbidden quando o user não tem acesso à empresa (cross-tenant ou sem vínculo)', async () => {
    const findFirst = vi.fn().mockResolvedValue(null)
    const sut = new EmpresaAccessGuard(makeReflector(true), makePrisma(findFirst))
    const req = {
      headers: { [ACTIVE_EMPRESA_HEADER]: 'empresa-x' },
      user: { id: 'u1', tenantId: 'tenant-1' },
    }

    await expect(sut.canActivate(makeContext(req))).rejects.toBeInstanceOf(CustomHttpException)
  })

  it('libera quando o vínculo usuario-empresa existe no tenant', async () => {
    const findFirst = vi.fn().mockResolvedValue({ empresaId: 'empresa-1' })
    const sut = new EmpresaAccessGuard(makeReflector(true), makePrisma(findFirst))
    const req = {
      headers: { [ACTIVE_EMPRESA_HEADER]: 'empresa-1' },
      user: { id: 'u1', tenantId: 'tenant-1' },
    }

    await expect(sut.canActivate(makeContext(req))).resolves.toBe(true)
  })
})
