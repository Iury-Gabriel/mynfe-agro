import { betterAuth, type Auth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { customSession } from 'better-auth/plugins'

import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'

import { permissionsCacheKey } from '@/domain/application/cache/permissions-cache'

export interface CreateAuthEnv {
  AUTH_SECRET: string
  AUTH_BASE_URL: string
  AUTH_TRUSTED_ORIGINS: string[]
  SECURE_COOKIES: boolean
  AUTH_COOKIE_DOMAIN?: string
  AUTH_RATE_LIMIT_WINDOW: number
  AUTH_RATE_LIMIT_MAX: number
  MAIL_ENABLED: boolean
  PERMISSIONS_CACHE_TTL_SECONDS: number
}

export interface PermissionsCache {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, opts: { ttlSeconds: number }): Promise<void>
}

export { permissionsCacheKey }

export function createAuth(
  prisma: PrismaClient,
  env: CreateAuthEnv,
  redis: Redis,
  cache: PermissionsCache,
): Auth {
  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret: env.AUTH_SECRET,
    baseURL: env.AUTH_BASE_URL,
    trustedOrigins: env.AUTH_TRUSTED_ORIGINS,

    secondaryStorage: {
      get: (key) => redis.get(key),
      set: async (key, value, ttl) => {
        if (ttl) await redis.set(key, value, 'EX', ttl)
        else await redis.set(key, value)
      },
      delete: async (key) => {
        await redis.del(key)
      },
    },

    rateLimit: {
      enabled: true,
      window: env.AUTH_RATE_LIMIT_WINDOW,
      max: env.AUTH_RATE_LIMIT_MAX,
      storage: 'secondary-storage',
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: env.MAIL_ENABLED,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 3,
      updateAge: 60 * 60 * 24,
      storeSessionInDatabase: true,
    },

    advanced: {
      ...(env.AUTH_COOKIE_DOMAIN
        ? { crossSubDomainCookies: { enabled: true, domain: env.AUTH_COOKIE_DOMAIN } }
        : {}),
      cookies: {
        session_token: {
          attributes: {
            httpOnly: true,
            secure: env.SECURE_COOKIES,
            sameSite: 'lax',
          },
        },
      },
      defaultCookieAttributes: {
        httpOnly: true,
        secure: env.SECURE_COOKIES,
        sameSite: 'lax',
      },
    },

    plugins: [
      customSession(async ({ user, session }) => {
        try {
          const empresaLinks = await prisma.usuarioEmpresa.findMany({
            where: { userId: user.id, empresa: { deletedAt: null } },
            select: { empresaId: true },
          })
          const empresaIds = empresaLinks.map((link) => link.empresaId)

          const cacheKey = permissionsCacheKey(user.id)
          const cached = await cache.get<string[]>(cacheKey)
          if (cached) return { user, session, permissions: cached, empresaIds }

          const assignments = await prisma.userRoleAssignment.findMany({
            where: { userId: user.id },
            include: { role: { include: { permissions: true } } },
          })
          const permissions = [
            ...new Set(
              assignments.flatMap((a) => a.role.permissions.map((p) => p.permission)),
            ),
          ]
          await cache.set(cacheKey, permissions, {
            ttlSeconds: env.PERMISSIONS_CACHE_TTL_SECONDS,
          })
          return { user, session, permissions, empresaIds }
        } catch (err) {
          console.error('[customSession] falha ao carregar permissions:', err)
          throw err
        }
      }),
    ],
  // customSession plugin alarga o tipo de retorno; better-auth não exporta o tipo
  // enriquecido, então o cast duplo é necessário para satisfazer o compilador.
  }) as unknown as Auth
}

export type AppAuth = ReturnType<typeof createAuth>
