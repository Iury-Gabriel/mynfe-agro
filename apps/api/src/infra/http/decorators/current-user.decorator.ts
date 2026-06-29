import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import type { Permission } from '@/core/auth/permissions'

export interface SessionUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  tenantId: string | null
  isSuperAdmin: boolean
  permissions?: readonly Permission[]
  empresaIds?: readonly string[]
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: SessionUser }>()
    if (!req.user) {
      throw new Error('CurrentUser usado em rota sem AuthGuard ou user não populado')
    }
    return req.user
  },
)
