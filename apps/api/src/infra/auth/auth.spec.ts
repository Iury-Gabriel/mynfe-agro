import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaClient } from '@prisma/client'

const betterAuthMock = vi.fn().mockReturnValue({ api: {} })
const prismaAdapterMock = vi.fn().mockReturnValue({ __adapter: true })
const customSessionMock = vi.fn().mockReturnValue({ __plugin: 'customSession' })

vi.mock('better-auth', () => ({
  betterAuth: (config: unknown): unknown => betterAuthMock(config),
}))

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: (...args: unknown[]): unknown => prismaAdapterMock(...args),
}))

vi.mock('better-auth/plugins', () => ({
  customSession: (cb: unknown): unknown => customSessionMock(cb),
}))

const { createAuth } = await import('./auth')

function makeEnv() {
  return {
    AUTH_SECRET: 's'.repeat(32),
    AUTH_BASE_URL: 'http://localhost:3333',
    AUTH_TRUSTED_ORIGINS: ['http://localhost:5173'],
    SECURE_COOKIES: true,
    AUTH_RATE_LIMIT_WINDOW: 60,
    AUTH_RATE_LIMIT_MAX: 5,
    MAIL_ENABLED: false,
    PERMISSIONS_CACHE_TTL_SECONDS: 300,
  }
}

function makeRedis() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  }
}

function makeCache() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  }
}

function makeMailer() {
  return { sendPasswordReset: vi.fn().mockResolvedValue(undefined) }
}

describe('createAuth', () => {
  beforeEach(() => {
    betterAuthMock.mockClear()
    prismaAdapterMock.mockClear()
    customSessionMock.mockClear()
  })

  it('configura o betterAuth com adapter, segredo e cookies seguros', () => {
    const prisma = {} as PrismaClient

    createAuth(prisma, makeEnv(), makeRedis(), makeCache(), makeMailer())

    expect(prismaAdapterMock).toHaveBeenCalledWith(prisma, { provider: 'postgresql' })
    expect(betterAuthMock).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: 's'.repeat(32),
        baseURL: 'http://localhost:3333',
        trustedOrigins: ['http://localhost:5173'],
        emailAndPassword: expect.objectContaining({ minPasswordLength: 12, maxPasswordLength: 128 }),
        advanced: expect.objectContaining({
          defaultCookieAttributes: { httpOnly: true, secure: true, sameSite: 'lax' },
        }),
        rateLimit: { enabled: true, window: 60, max: 5, storage: 'secondary-storage' },
      }),
    )
  })

  it('não habilita crossSubDomainCookies quando AUTH_COOKIE_DOMAIN é ausente', () => {
    const prisma = {} as PrismaClient

    createAuth(prisma, makeEnv(), makeRedis(), makeCache(), makeMailer())

    const config = betterAuthMock.mock.calls[0][0] as { advanced: Record<string, unknown> }
    expect(config.advanced.crossSubDomainCookies).toBeUndefined()
  })

  it('habilita crossSubDomainCookies com o domínio quando AUTH_COOKIE_DOMAIN é fornecido', () => {
    const prisma = {} as PrismaClient

    createAuth(prisma, { ...makeEnv(), AUTH_COOKIE_DOMAIN: '.example.com' }, makeRedis(), makeCache(), makeMailer())

    const config = betterAuthMock.mock.calls[0][0] as { advanced: Record<string, unknown> }
    expect(config.advanced.crossSubDomainCookies).toEqual({
      enabled: true,
      domain: '.example.com',
    })
  })

  it('registra o plugin customSession cujo callback devolve { user, session, permissions, empresaIds }', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        role: {
          permissions: [{ permission: 'admin:users' }, { permission: 'admin:roles' }],
        },
      },
    ])
    const empresaFindMany = vi.fn().mockResolvedValue([{ empresaId: 'empresa-1' }, { empresaId: 'empresa-2' }])
    const prisma = {
      userRoleAssignment: { findMany },
      usuarioEmpresa: { findMany: empresaFindMany },
    } as unknown as PrismaClient
    const cache = makeCache()

    createAuth(prisma, makeEnv(), makeRedis(), cache, makeMailer())

    expect(customSessionMock).toHaveBeenCalledOnce()
    const callback = customSessionMock.mock.calls[0][0] as (arg: {
      user: { id: string }
      session: unknown
    }) => Promise<unknown>
    const user = { id: 'u1' }
    const session = { id: 's1' }

    await expect(callback({ user, session })).resolves.toEqual({
      user,
      session,
      permissions: ['admin:users', 'admin:roles'],
      empresaIds: ['empresa-1', 'empresa-2'],
    })
    expect(cache.get).toHaveBeenCalledWith('permissions:user:u1')
    expect(cache.set).toHaveBeenCalledWith('permissions:user:u1', ['admin:users', 'admin:roles'], {
      ttlSeconds: 300,
    })
  })

  it('customSession devolve permissions do cache sem consultar roles em hit, mas sempre carrega empresaIds', async () => {
    const findMany = vi.fn()
    const empresaFindMany = vi.fn().mockResolvedValue([{ empresaId: 'empresa-9' }])
    const prisma = {
      userRoleAssignment: { findMany },
      usuarioEmpresa: { findMany: empresaFindMany },
    } as unknown as PrismaClient
    const cache = makeCache()
    cache.get.mockResolvedValue(['cached:perm'])

    createAuth(prisma, makeEnv(), makeRedis(), cache, makeMailer())

    const callback = customSessionMock.mock.calls[0][0] as (arg: {
      user: { id: string }
      session: unknown
    }) => Promise<{ permissions: string[]; empresaIds: string[] }>

    const result = await callback({ user: { id: 'u1' }, session: { id: 's1' } })

    expect(result.permissions).toEqual(['cached:perm'])
    expect(result.empresaIds).toEqual(['empresa-9'])
    expect(findMany).not.toHaveBeenCalled()
    expect(cache.set).not.toHaveBeenCalled()
  })

  it('registra o plugin customSession que deduplica permissões repetidas', async () => {
    const prisma = {
      userRoleAssignment: {
        findMany: vi.fn().mockResolvedValue([
          { role: { permissions: [{ permission: 'admin:users' }] } },
          { role: { permissions: [{ permission: 'admin:users' }, { permission: 'admin:roles' }] } },
        ]),
      },
      usuarioEmpresa: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient

    createAuth(prisma, makeEnv(), makeRedis(), makeCache(), makeMailer())

    const callback = customSessionMock.mock.calls[0][0] as (arg: {
      user: { id: string }
      session: unknown
    }) => Promise<{ permissions: string[]; empresaIds: string[] }>
    const user = { id: 'u1' }
    const session = { id: 's1' }

    const result = await callback({ user, session })
    expect(result.permissions).toEqual(['admin:users', 'admin:roles'])
    expect(result.empresaIds).toEqual([])
  })

  it('customSession loga e propaga erro ao falhar carregando permissions', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const prisma = {
      userRoleAssignment: {
        findMany: vi.fn().mockRejectedValue(new Error('db down')),
      },
      usuarioEmpresa: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient

    createAuth(prisma, makeEnv(), makeRedis(), makeCache(), makeMailer())

    const callback = customSessionMock.mock.calls[0][0] as (arg: {
      user: { id: string }
      session: unknown
    }) => Promise<unknown>

    await expect(callback({ user: { id: 'u1' }, session: { id: 's1' } })).rejects.toThrow('db down')
    expect(errorSpy).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })

  it('secondaryStorage delega ao redis (get, set com e sem ttl, delete)', async () => {
    const redis = makeRedis()
    createAuth({}, makeEnv(), redis, makeCache(), makeMailer())

    const config = betterAuthMock.mock.calls[0][0] as {
      secondaryStorage: {
        get: (k: string) => Promise<unknown>
        set: (k: string, v: string, ttl?: number) => Promise<void>
        delete: (k: string) => Promise<void>
      }
    }

    await config.secondaryStorage.get('k')
    expect(redis.get).toHaveBeenCalledWith('k')

    await config.secondaryStorage.set('k', 'v', 30)
    expect(redis.set).toHaveBeenCalledWith('k', 'v', 'EX', 30)

    await config.secondaryStorage.set('k', 'v')
    expect(redis.set).toHaveBeenLastCalledWith('k', 'v')

    await config.secondaryStorage.delete('k')
    expect(redis.del).toHaveBeenCalledWith('k')
  })

  it('sendResetPassword delega ao mailer com to, name, resetUrl e expiração', async () => {
    const mailer = makeMailer()
    createAuth({}, makeEnv(), makeRedis(), makeCache(), mailer)

    const config = betterAuthMock.mock.calls[0][0] as {
      emailAndPassword: {
        sendResetPassword: (arg: {
          user: { email: string; name: string }
          url: string
        }) => Promise<void>
      }
    }

    await config.emailAndPassword.sendResetPassword({
      user: { email: 'ada@example.com', name: 'Ada' },
      url: 'https://app.example.com/reset?token=abc',
    })

    expect(mailer.sendPasswordReset).toHaveBeenCalledWith({
      to: 'ada@example.com',
      name: 'Ada',
      resetUrl: 'https://app.example.com/reset?token=abc',
      expiresInMinutes: 60,
    })
  })

  it('sendResetPassword loga e não propaga quando o mailer falha (best-effort)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const mailer = makeMailer()
    mailer.sendPasswordReset.mockRejectedValue(new Error('mail down'))
    createAuth({}, makeEnv(), makeRedis(), makeCache(), mailer)

    const config = betterAuthMock.mock.calls[0][0] as {
      emailAndPassword: {
        sendResetPassword: (arg: {
          user: { email: string; name: string }
          url: string
        }) => Promise<void>
      }
    }

    await expect(
      config.emailAndPassword.sendResetPassword({
        user: { email: 'ada@example.com', name: 'Ada' },
        url: 'https://app.example.com/reset',
      }),
    ).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalledWith(
      '[auth.sendResetPassword] falha ao enviar email:',
      expect.any(Error),
    )
    errorSpy.mockRestore()
  })
})
